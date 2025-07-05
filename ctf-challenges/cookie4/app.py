from flask import Flask, render_template, request, make_response, redirect, url_for
import pickle
import base64
import signal
import sys

app = Flask(__name__)


@app.route("/")
def index():
    session_cookie = request.cookies.get("session")
    if not session_cookie:
        return redirect(url_for("login"))

    user_info = None

    try:
        # Decode the cookie and deserialize the user data
        decoded_cookie = base64.b64decode(session_cookie)
        user_info = pickle.loads(decoded_cookie)
    except Exception as e:
        # If the cookie is invalid, redirect to login
        print(f"Error deserializing cookie: {e}")
        return redirect(url_for("login"))

    # Create a response object
    return make_response(render_template("index.html", user=user_info))


@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")

        if username == "guest" and password == "guest":
            user = {"username": "guest"}
            pickled_user = pickle.dumps(user)
            encoded_user = base64.b64encode(pickled_user).decode("utf-8")

            resp = make_response(redirect(url_for("index")))
            resp.set_cookie("session", encoded_user)
            return resp
        else:
            return render_template("login.html", error="Invalid credentials")

    return render_template("login.html")


@app.route("/logout")
def logout():
    resp = make_response(redirect(url_for("login")))
    resp.delete_cookie("session")
    return resp


if __name__ == "__main__":
    signal.signal(signal.SIGTERM, lambda s, f: sys.exit(0))
    signal.signal(signal.SIGINT, lambda s, f: sys.exit(0))
    app.run(host="0.0.0.0", port=5004)
