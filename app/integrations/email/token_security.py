import os
from cryptography.fernet import Fernet
from dotenv import load_dotenv

load_dotenv()

_key =os.getenv("EMAIL_TOKEN_ENCRYPTION_KEY")

if not _key:
    raise RuntimeError("EMAIL_TOKEN_ENCRYPTION_KEY is missing")

_cipher =Fernet(_key.encode())


def encrypt_token(value:str) -> str:
    return _cipher.encrypt(value.encode()).decode()

def decrypt_token(value:str)-> str:
    return _cipher.decrypt(value.encode()).decode()





