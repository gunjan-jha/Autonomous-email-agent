
import asyncio
from app.db.database import SessionLocal
from app.integrations.email.gmail.provider import GmailProvider


async def main():
    with SessionLocal() as db:
        account = db.query(
            __import__(
                "app.db.models.email_account",
                fromlist=["EmailAccount"],
            ).EmailAccount
        ).filter_by(provider="gmail").first()

        if not account:
            raise RuntimeError(
                "Connect a Gmail account through FastAPI first."
            )

        provider = GmailProvider(account.id, db)
        await provider.connect()

        print("Connected:", account.account_email)

        count = 0
        async for message in provider.fetch_new_messages():
            print({
                "provider": message.provider,
                "message_id": message.provider_message_id,
                "sender": message.sender,
                "subject": message.subject,
                "body_preview": message.body[:150],
            })
            count += 1

        print("New messages found:", count)
        print("Latest history ID:", provider.latest_history_id)


if __name__ == "__main__":
    asyncio.run(main())