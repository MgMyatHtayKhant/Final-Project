from flask import Flask, flash, redirect, render_template, request, session, jsonify
from werkzeug.security import check_password_hash, generate_password_hash
from helpers import apology, login_required, email_validation, insert
from flask_session import Session
from cs50 import SQL
from datetime import datetime
from pathlib import Path
import os


# Configure application
app = Flask(__name__)
app.config["TEMPLATES_AUTO_RELOAD"] = True
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
Session(app)

# Connect to sqlite database
db = SQL("sqlite:///users.db")


# Make sure API key is set
if not os.environ.get("API_KEY") or not os.environ.get("TEAM_SLUG"):
    raise RuntimeError("API_KEY not set")


@app.after_request
def after_request(response):
    """Ensure responses aren't cached"""
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Expires"] = 0
    response.headers["Pragma"] = "no-cache"
    return response


@app.route("/")
@login_required
def index():
    notes = db.execute(
        "SELECT * FROM notes WHERE user_id = ?", session["user_id"])
    images = db.execute(
        "SELECT * FROM images WHERE user_id = ?", session["user_id"])
    audios = db.execute(
        "SELECT * FROM audios WHERE user_id = ?", session["user_id"])
    return render_template("index.html", notes=notes, images=images, audios=audios)


@app.route("/login", methods=["GET", "POST"])
def login():
    """Log user in"""

    # Forget any user_id
    session.clear()

    # User reached route via POST (as by submitting a form via POST)
    if request.method == "POST":

        # Ensure username was submitted
        username = request.form.get("username")
        if not username:
            return apology("must provide username")

        # Ensure password was submitted
        password = request.form.get("password")
        if not password:
            return apology("must provide password")

        # Query database for username
        rows = db.execute("SELECT * FROM users WHERE username = ?", username)

        # Ensure username exists and password is correct
        if len(rows) != 1 or not check_password_hash(rows[0]["hash"], password):
            return apology("invalid username and/or password")

        # Remember which user has logged in and create folder

        session["user_id"] = rows[0]["id"]

        session['static'] = Path('static')

        session['my-folder'] = session['static'] / str(session['user_id'])
        session['my-image'] = session['my-folder'] / 'image'
        session['my-audio'] = session['my-folder'] / 'audio'

        if not session['my-folder'].exists():
            session['my-folder'].mkdir()
            session['my-image'].mkdir()
            session['my-audio'].mkdir()

        # Redirect user to home page
        return redirect("/")

    return render_template("login.html")


@app.route("/register", methods=["GET", "POST"])
def register():
    """Register user"""

    if request.method == "POST":

        # Ensure username was submitted
        username = request.form.get("username")
        if not username:
            return apology("must provide username")

        # Ensure email was submitted
        email = request.form.get("email")
        if not email:
            return apology("must provide email")

        # Ensure email was validated
        if not email_validation(email):
            return apology("invalid email")

        # Ensure password was submitted
        password = request.form.get("password")
        if not password:
            return apology("must provide password")

        # Ensure confirmation password was submitted
        confirmation = request.form.get("confirmation")
        if not confirmation:
            return apology("must provide password again")

        # If password and confirmation match or not
        if password != confirmation:
            return apology("the password doesn't match")

        # Check username is already inside users database
        rows = db.execute("SELECT * FROM users WHERE username = ?", username)
        if len(rows) == 1:
            return apology("the username already existed")

        # Convert password plaintext to ciphertext
        hash = generate_password_hash(password)

        # Insert the user info into users database
        id = db.execute(
            "INSERT INTO users (username, email, hash) VALUES(?, ?, ?)", username, email, hash)

        # Redirect back to login
        return redirect("/")

    return render_template("register.html")


@app.route("/logout")
def logout():
    """Log user out"""

    # Forget any user_id
    session.clear()

    # Redirect user to login form
    return redirect("/")


@app.route("/note", methods=["GET", "POST"])
@login_required
def note():
    """Save notes and Send back notes"""
    if request.method == "POST":
        title = request.form.get("card-title-name")
        if not title:
            return apology("must provide title")

        text = request.form.get("message-text")
        if not text:
            return apology("must provide text")

        date = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        id = db.execute("INSERT INTO notes(user_id, title, text, date) VALUES(?, ?, ?, ?)",
                        session["user_id"], title, text, date)

        rows = [{"title": title, "text": text, "date": date, "id": id}]

        print(rows)

        return jsonify(rows)

    rows = db.execute("SELECT * FROM notes WHERE user_id = ?",
                      session["user_id"])
    return jsonify(rows)


@app.route("/image", methods=["GET", "POST"])
@login_required
def image():
    """Save iamges and its path, Send back receive message"""
    if request.method == "POST":
        return insert("image", db)
    rows = db.execute(
        "SELECT * FROM images WHERE user_id = ?", session["user_id"])
    return jsonify(rows)


@app.route("/audio", methods=["GET", "POst"])
@login_required
def audio():
    """Save audios and its path, Send back receive message"""
    if request.method == "POST":
        return insert("audio", db)
    rows = db.execute(
        "SELECT * FROM audios WHERE user_id = ?", session["user_id"])
    return jsonify(rows)


@app.route("/delete/<what>", methods=["POST"])
@login_required
def delete(what):
    if what == "note":
        data = request.json
        db.execute("DELETE FROM notes WHERE user_id = ? AND id = ?",
                   session["user_id"], data.get("id"))
    elif what == "image":
        data = request.json
        db.execute("DELETE FROM images WHERE user_id = ? AND id = ?",
                   session["user_id"], data.get("id"))
        path = session['my-image'] / data.get("id")
        path.unlink()
    elif what == "audio":
        data = request.json
        db.execute("DELETE FROM audios WHERE user_id = ? AND id = ?",
                   session["user_id"], data.get("id"))
        path = session['my-audio'] / data.get("id")
        path.unlink()
    return jsonify("yes")


@app.route("/search/<what>", methods=["GET"])
@login_required
def search(what):
    if what == "note":
        date = request.args.get("q")
        rows = db.execute("SELECT * FROM notes WHERE user_id = ? AND date LIKE ?",
                          session["user_id"], "%" + date + "%")
        return jsonify(rows)
    elif what == "image":
        date = request.args.get("q")
        rows = db.execute("SELECT * FROM images WHERE user_id = ? AND date LIKE ?",
                          session["user_id"], "%" + date + "%")
        return jsonify(rows)
    elif what == "audio":
        date = request.args.get("q")
        rows = db.execute("SELECT * FROM audios WHERE user_id = ? AND date LIKE ?",
                          session["user_id"], "%" + date + "%")
        return jsonify(rows)
    return jsonify("yes")
