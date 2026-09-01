"""One-off helper: exchange a Google OAuth client for a refresh token.

Run it once on your own machine:

    pipenv run python get_gmail_token.py

It opens your browser, you approve, and it prints the refresh token to paste
into your environment. Nothing is stored on disk by this script.
"""

import getpass
import glob
import json
import http.server
import secrets
import socketserver
import threading
import urllib.parse
import webbrowser

import requests
from pathlib import Path

AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
TOKEN_URL = "https://oauth2.googleapis.com/token"
SCOPE = "https://www.googleapis.com/auth/gmail.send"
PORT = 8420
REDIRECT = f"http://localhost:{PORT}"

received = {}


class Handler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        query = urllib.parse.urlparse(self.path).query
        params = urllib.parse.parse_qs(query)
        received.update({key: value[0] for key, value in params.items()})

        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.end_headers()
        body = (
            "<h2>Done. You can close this tab and go back to the terminal.</h2>"
            if "code" in received
            else "<h2>Authorisation failed. Check the terminal.</h2>"
        )
        self.wfile.write(body.encode("utf-8"))

    def log_message(self, *_args):
        return


def from_json_file():
    matches = sorted(glob.glob("client_secret*.json"))
    if not matches:
        return "", ""
    data = json.loads(Path(matches[0]).read_text())
    block = data.get("installed") or data.get("web") or {}
    print(f"Using {matches[0]}")
    return block.get("client_id", "").strip(), block.get("client_secret", "").strip()


def main():
    client_id, client_secret = from_json_file()
    if not client_id:
        client_id = input("Client ID: ").strip()
        client_secret = getpass.getpass("Client secret: ").strip()
    if not client_id or not client_secret:
        print("Both values are required.")
        return

    state = secrets.token_urlsafe(16)
    params = {
        "client_id": client_id,
        "redirect_uri": REDIRECT,
        "response_type": "code",
        "scope": SCOPE,
        "access_type": "offline",
        "prompt": "consent",
        "state": state,
    }
    url = f"{AUTH_URL}?{urllib.parse.urlencode(params)}"

    server = socketserver.TCPServer(("localhost", PORT), Handler)
    thread = threading.Thread(target=server.handle_request, daemon=True)
    thread.start()

    print("\nOpening your browser. Approve the Deliveroo app, then come back here.")
    print("If the browser does not open, paste this into it:\n")
    print(url, "\n")
    webbrowser.open(url)

    thread.join(timeout=300)
    server.server_close()

    if received.get("state") != state:
        print("State mismatch. Start again.")
        return
    if "code" not in received:
        print("No authorisation code received:", received.get("error", "unknown error"))
        return

    response = requests.post(
        TOKEN_URL,
        data={
            "code": received["code"],
            "client_id": client_id,
            "client_secret": client_secret,
            "redirect_uri": REDIRECT,
            "grant_type": "authorization_code",
        },
        timeout=30,
    )

    if response.status_code >= 300:
        print("Token exchange failed:", response.status_code, response.text[:400])
        return

    payload = response.json()
    refresh = payload.get("refresh_token")

    if not refresh:
        print("Google did not return a refresh token. Remove the app's access at")
        print("https://myaccount.google.com/permissions and run this again.")
        return

    print("\nAdd these to server/.env and to Render:\n")
    print(f"GOOGLE_CLIENT_ID={client_id}")
    print(f"GOOGLE_CLIENT_SECRET={client_secret}")
    print(f"GOOGLE_REFRESH_TOKEN={refresh}")
    print("\nDo not commit them. .env is gitignored.")


if __name__ == "__main__":
    main()
