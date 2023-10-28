import os
import requests
import urllib.parse

from email_validator import validate_email, EmailNotValidError
from flask import redirect, render_template, request, session, jsonify
from functools import wraps
from datetime import datetime


def apology(message, code=400):
    """Render message as an apology to user."""
    def escape(s):
        """
        Escape special characters.

        https://github.com/jacebrowning/memegen#special-characters
        """
        for old, new in [("-", "--"), (" ", "-"), ("_", "__"), ("?", "~q"),
                         ("%", "~p"), ("#", "~h"), ("/", "~s"), ("\"", "''")]:
            s = s.replace(old, new)
        return s
    return render_template("apology.html", top=code, bottom=escape(message)), code


def login_required(f):
    """
    Decorate routes to require login.

    https://flask.palletsprojects.com/en/1.1.x/patterns/viewdecorators/
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if session.get("user_id") is None:
            return redirect("/login")
        return f(*args, **kwargs)
    return decorated_function


def lookup(symbol):
    """Look up quote for symbol."""

    # Contact API
    try:
        api_key = os.environ.get("API_KEY")
        url = f"https://cloud.iexapis.com/stable/stock/{urllib.parse.quote_plus(symbol)}/quote?token={api_key}"
        response = requests.get(url)
        response.raise_for_status()
    except requests.RequestException:
        return None

    # Parse response
    try:
        quote = response.json()
        return {
            "name": quote["companyName"],
            "price": float(quote["latestPrice"]),
            "symbol": quote["symbol"]
        }
    except (KeyError, TypeError, ValueError):
        return None


def usd(value):
    """Format value as USD."""
    return f"${value:,.2f}"


def email_validation(email):
    """Accept email and check it is valid or not"""
    try:
        validation = validate_email(email, check_deliverability=False)
        email = validation.email
    except EmailNotValidError as e:
        print(str(e))
        return False

    # API Validation from https://mailvalidation.io/
    api_key = os.environ.get("API_KEY")
    team_slug = os.environ.get("TEAM_SLUG")

    response = requests.post(
        "https://app.mailvalidation.io/a/" + team_slug + "/validate/api/validate/",
        json={'email': email},
        headers={
            'content-type': 'application/json',
            'accept': 'application/json',
            'Authorization': 'Api-Key ' + api_key,
        })

    valid = response.json()["is_valid"]

    return valid


def insert(route, db):
    title = request.form.get(route + "-title-name")
    if not title:
        return apology("must prove title")

    if route not in request.files:
        return apology("must provide " + route + " file")
    file = request.files[route]
    if file.filename == "":
        return apology("must provide image file")

    date = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    id = db.execute("INSERT INTO ?(user_id, title, date) VALUES(?, ?, ?)",
                    route + "s", session['user_id'], title, date)

    path = str(session[f"my-{route}"] / str(id))
    rows = [{"id": id, "user_id": session["user_id"],
             "title": title, "date": date}]
    file.save(path)

    return jsonify(rows)
