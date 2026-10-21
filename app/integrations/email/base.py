from abc import ABC,abstractmethod
from typing import AsyncIterator
from app.integrations.email.schemas import EmailMessage

class EmailProvider(ABC):
    @abstractmethod
    async def connect(self)->None:
        """Validate credentials and initialize the provider."""

    @abstractmethod
    async def fetch_new_messages(self)->AsyncIterator[EmailMessage]:
        """Yield newly recieved messages"""

    @abstractmethod
    async def get_message(
        self,message_id:str
    )-> EmailMessage:
        """Retrieve one message by provider message ID."""

    @abstractmethod
    async def send_reply(
        self,
        message: EmailMessage,
        body:str,)->str:
        """send a reply and return provider's message ID."""