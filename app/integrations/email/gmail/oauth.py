import os
import secrets
from dotenv import load_dotenv
from google_auth_oauthlib.flow import Flow

load_dotenv()

SCOPES = [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.send",
]

REDIRECT_URI = os.environ["GOOGLE_REDIRECT_URI"]

def create_oauth_flow(state:str | None = None)-> Flow:
    client_id = os.environ["client_id"]
    client_secret = os.environ["client_secret"]

    client_config ={
        "web":{
            "client_id":client_id,
            "client_secret":client_secret,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "redirect_uris": [REDIRECT_URI],
        }
    }

    return Flow.from_client_config(
        client_config,
        scopes=SCOPES,
        redirect_uri = REDIRECT_URI,
        state=state,
        autogenerate_code_verifier=True,
    )
