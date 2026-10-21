
import asyncio
import base64
from datetime import datetime, timezone
from email.mime.text import MIMEText

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from sqlalchemy.orm import Session
from app.integrations.email.base import EmailProvider
from app.integrations.email.schemas import EmailMessage
from app.integrations.email.gmail.oauth import SCOPES
from app.integrations.email.token_security import (
    decrypt_token,
    encrypt_token,
)
from app.db.models.email_account import EmailAccount



class HistoryCursorExpired(Exception):
    """The saved Gmail historyId is no longer usable."""


def _decode_body(data: str) -> str:
    padded = data + "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(padded).decode(
        "utf-8", errors="replace"
    )


def _extract_text(payload: dict) -> str:
    """Prefer text/plain, including nested MIME parts."""
    mime_type = payload.get("mimeType", "")
    body_data = payload.get("body", {}).get("data")

    if mime_type == "text/plain" and body_data:
        return _decode_body(body_data)

    for part in payload.get("parts", []):
        text = _extract_text(part)
        if text:
            return text

    # Fallback for HTML-only messages.
    if mime_type == "text/html" and body_data:
        return _decode_body(body_data)

    return ""


class GmailProvider(EmailProvider):
    def __init__(self, account_id: int, db: Session):
        self.account_id = account_id
        self.db = db
        self.account = None
        self.credentials = None
        self.service = None
        self.latest_history_id = None

    async def connect(self) -> None:
        self.account = self.db.get(EmailAccount, self.account_id)

        if not self.account or self.account.provider != "gmail":
            raise ValueError("Connected Gmail account was not found.")

        token_json = decrypt_token(
            self.account.credentials_encrypted
        )
        self.credentials = Credentials.from_authorized_user_info(
            __import__("json").loads(token_json),
            SCOPES,
        )

        if not self.credentials.valid:
            if (
                self.credentials.expired
                and self.credentials.refresh_token
            ):
                await asyncio.to_thread(
                    self.credentials.refresh, Request()
                )
                self.account.credentials_encrypted = encrypt_token(
                    self.credentials.to_json()
                )
                self.db.commit()
            else:
                raise RuntimeError(
                    "Gmail credentials are invalid. Reconnect the account."
                )

        self.service = build(
            "gmail",
            "v1",
            credentials=self.credentials,
            cache_discovery=False,
        )

    async def get_message(
        self, message_id: str
    ) -> EmailMessage:
        if not self.service:
            raise RuntimeError("Call connect() first.")

        raw = await asyncio.to_thread(
            lambda: self.service.users()
            .messages()
            .get(
                userId="me",
                id=message_id,
                format="full",
            )
            .execute()
        )

        headers = {
            header["name"].lower(): header["value"]
            for header in raw.get("payload", {}).get("headers", [])
        }

        timestamp = raw.get("internalDate")
        received_at = (
            datetime.fromtimestamp(
                int(timestamp) / 1000, tz=timezone.utc
            )
            if timestamp
            else None
        )

        return EmailMessage(
            provider="gmail",
            account_id=self.account.account_email,
            provider_message_id=raw["id"],
            provider_thread_id=raw.get("threadId"),
            sender=headers.get("from", ""),
            recipient=headers.get("to", ""),
            subject=headers.get("subject", ""),
            body=_extract_text(raw.get("payload", {})),
            received_at=received_at,
            in_reply_to=headers.get("in-reply-to"),
            metadata={
                "label_ids": raw.get("labelIds", []),
                "message_id_header": headers.get("message-id"),
                "references": headers.get("references"),
                "history_id": raw.get("historyId"),
            },
        )

    async def fetch_new_messages(self):
        """Yield new inbox messages after the saved history cursor.

        The polling service must persist latest_history_id only after
        successfully recording all yielded messages.
        """
        if not self.service:
            raise RuntimeError("Call connect() first.")

        start_history_id = self.account.sync_cursor

        if not start_history_id:
            profile = await asyncio.to_thread(
                lambda: self.service.users()
                .getProfile(userId="me")
                .execute()
            )
            self.latest_history_id = profile["historyId"]
            return

        message_ids = set()
        page_token = None
        latest_id = start_history_id

        try:
            while True:
                kwargs = {
                    "userId": "me",
                    "startHistoryId": start_history_id,
                    "historyTypes": ["messageAdded"],
                    "maxResults": 500,
                }
                if page_token:
                    kwargs["pageToken"] = page_token

                result = await asyncio.to_thread(
                    lambda kwargs=kwargs: self.service.users()
                    .history()
                    .list(**kwargs)
                    .execute()
                )

                latest_id = result.get("historyId", latest_id)

                for item in result.get("history", []):
                    for added in item.get("messagesAdded", []):
                        message = added.get("message", {})
                        if message.get("id"):
                            message_ids.add(message["id"])

                page_token = result.get("nextPageToken")
                if not page_token:
                    break

        except HttpError as exc:
            if exc.resp.status == 404:
                raise HistoryCursorExpired(
                    "Gmail history cursor expired; perform a full sync."
                ) from exc
            raise

        self.latest_history_id = latest_id

        for message_id in message_ids:
            message = await self.get_message(message_id)

            # Only process messages currently in the inbox.
            if "INBOX" in message.metadata.get("label_ids", []):
                yield message

    def connect_sync(self) -> None:
        """Synchronously validate credentials and build the Gmail API client."""
        self.account = self.db.get(EmailAccount, self.account_id)

        if not self.account or self.account.provider != "gmail":
            raise ValueError("Connected Gmail account was not found.")

        token_json = decrypt_token(
            self.account.credentials_encrypted
        )
        self.credentials = Credentials.from_authorized_user_info(
            __import__("json").loads(token_json),
            SCOPES,
        )

        if not self.credentials.valid:
            if (
                self.credentials.expired
                and self.credentials.refresh_token
            ):
                self.credentials.refresh(Request())
                self.account.credentials_encrypted = encrypt_token(
                    self.credentials.to_json()
                )
                self.db.commit()
            else:
                raise RuntimeError(
                    "Gmail credentials are invalid. Please reconnect the account."
                )

        self.service = build(
            "gmail",
            "v1",
            credentials=self.credentials,
            cache_discovery=False,
        )

    def send_email_sync(
        self,
        to_email: str,
        subject: str,
        body: str,
        thread_id: str | None = None,
        in_reply_to: str | None = None,
    ) -> str:
        """Synchronously send an email or threaded reply via Gmail API."""
        if not self.service:
            self.connect_sync()

        mime = MIMEText(body, "plain", "utf-8")
        mime["To"] = to_email

        reply_subject = (
            subject if subject.lower().startswith("re:")
            else f"Re: {subject}"
        ) if subject else "Re: Email Response"
        mime["Subject"] = reply_subject

        if in_reply_to:
            mime["In-Reply-To"] = in_reply_to
            mime["References"] = in_reply_to

        raw = base64.urlsafe_b64encode(
            mime.as_bytes()
        ).decode("ascii")

        request_body = {"raw": raw}
        # Only attach threadId if it's a real Gmail thread identifier (not a test/sim prefix)
        if thread_id and not any(thread_id.startswith(p) for p in ("thread-", "sim-", "test-", "email-")):
            request_body["threadId"] = thread_id

        result = (
            self.service.users()
            .messages()
            .send(userId="me", body=request_body)
            .execute()
        )

        return result["id"]

    async def send_reply(
        self,
        message: EmailMessage,
        body: str,
    ) -> str:
        """Send a threaded reply. Call only after approval."""
        if not self.service:
            raise RuntimeError("Call connect() first.")

        mime = MIMEText(body, "plain", "utf-8")
        mime["To"] = message.sender

        subject = message.subject
        mime["Subject"] = (
            subject if subject.lower().startswith("re:")
            else f"Re: {subject}"
        )

        original_message_id = message.metadata.get(
            "message_id_header"
        )
        references = message.metadata.get("references", "")

        if original_message_id:
            mime["In-Reply-To"] = original_message_id
            mime["References"] = (
                f"{references} {original_message_id}".strip()
            )

        raw = base64.urlsafe_b64encode(
            mime.as_bytes()
        ).decode("ascii")

        request_body = {"raw": raw}
        if message.provider_thread_id:
            request_body["threadId"] = message.provider_thread_id

        result = await asyncio.to_thread(
            lambda: self.service.users()
            .messages()
            .send(userId="me", body=request_body)
            .execute()
        )

        return result["id"]