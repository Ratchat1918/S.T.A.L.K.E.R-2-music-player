import base64
from time import time
from flask import Flask, json, render_template, redirect, request
from flask_cors import CORS
import requests
import os
from dotenv import load_dotenv
import random, string
from urllib.parse import urlencode

app = Flask(__name__)
CORS(app)
load_dotenv()
CLIENT_ID = os.getenv("CLIENT_ID")
CLIENT_SECRET = os.getenv("CLIENT_SECRET")
authorization_token = None
token_expires_at = 0

@app.route('/', methods = ['GET'])
def main():
    return render_template('index.html')

@app.route('/auth/login', methods=['GET'])
def auth_redirect():
    try:
        state = ''.join(random.choices(string.ascii_letters + string.digits, k=16))
        params = {
            "client_id": CLIENT_ID,
            "response_type": "code",
            "redirect_uri": "http://127.0.0.1:5000/auth/callback",
            "scope": "streaming user-read-email user-read-private",
            "state": state
            }
        query_string = urlencode(params)
        return redirect(f"https://accounts.spotify.com/authorize?{query_string}")
    except Exception as e:
            return {"error": str(e)}, 500

@app.route('/auth/callback', methods=['GET', 'POST'])
def auth_callback():
    authOptions = {
        "url":"https://accounts.spotify.com/api/token",
        "data":{
            "code":request.args.get('code'),
            "redirect_uri":"http://127.0.0.1:5000/auth/callback",
            "grant_type":"authorization_code"
        },
        "headers":{
            "Authorization": "Basic " + base64.b64encode(f"{CLIENT_ID}:{CLIENT_SECRET}".encode()).decode(),
            "Content-Type": "application/x-www-form-urlencoded"
        }
    }
    try:
        response = requests.post(**authOptions)
        response.raise_for_status()
        data = response.json()
        global authorization_token, token_expires_at
        authorization_token = data['access_token']
        token_expires_at = time() + data['expires_in']
        return redirect('/')
    except requests.exceptions.RequestException as e:
        return {"error": str(e)}, 500
    
@app.route('/auth/token', methods=['GET'])
def get_token():
    global authorization_token, token_expires_at
    if authorization_token and token_expires_at > time():
        return {"token": authorization_token}
    else:
        return {"error": "No valid token"}, 401
    
if __name__ =="__main__":
    app.run()