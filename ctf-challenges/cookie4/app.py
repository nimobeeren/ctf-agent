from flask import Flask, render_template, request, make_response
import pickle
import base64
import signal
import sys

app = Flask(__name__)


@app.route("/")
def index():
    session_cookie = request.cookies.get("session")
    user_info = None

    if session_cookie:
        try:
            # Decode the cookie and deserialize the user data
            decoded_cookie = base64.b64decode(session_cookie)
            user_info = pickle.loads(decoded_cookie)
        except Exception as e:
            # If the cookie is invalid, ignore it
            print(f"Error deserializing cookie: {e}")
            user_info = {"username": "guest"}
    else:
        user_info = {"username": "guest"}

    # Create a response object
    resp = make_response(render_template("index.html", user=user_info))

    # If there was no cookie, set a default one
    if not session_cookie:
        default_user = {"username": "guest"}
        pickled_user = pickle.dumps(default_user)
        encoded_user = base64.b64encode(pickled_user).decode("utf-8")
        resp.set_cookie("session", encoded_user)

    return resp


if __name__ == "__main__":
    signal.signal(signal.SIGTERM, lambda s, f: sys.exit(0))
    signal.signal(signal.SIGINT, lambda s, f: sys.exit(0))
    app.run(host="0.0.0.0", port=5004)
