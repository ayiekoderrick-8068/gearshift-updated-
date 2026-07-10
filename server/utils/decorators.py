"""
Auth decorators - Person A.

These two decorators gate every protected route in the app. If either of
these is broken, every protected route breaks with it, so they're kept in
one small, easy-to-test file. Test both in Postman (see SETUP_GUIDE.md)
before building anything that depends on them.

Usage:
    @app.route("/me")
    @jwt_required
    def me():
        user = g.current_user
        ...

    @app.route("/admin/stats")
    @admin_required
    def stats():
        ...
"""
from functools import wraps
from flask import request, g, jsonify
import jwt
from extensions import db
from config import Config
from models import User, Driver


def _decode_token(token):
    """Returns the decoded payload, or None if the token is missing/invalid/expired."""
    try:
        return jwt.decode(token, Config.JWT_SECRET_KEY, algorithms=["HS256"])
    except jwt.PyJWTError:
        return None


def jwt_required(fn):
    """
    Reads `Authorization: Bearer <token>` from the request header, decodes
    it, looks the user up in the DB, and attaches them to flask.g.current_user
    for the rest of the request. Every protected route uses this.
    """
    @wraps(fn)
    def wrapper(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")

        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Unauthorized"}), 401

        token = auth_header.split(" ", 1)[1]
        payload = _decode_token(token)
        if not payload:
            return jsonify({"error": "Unauthorized"}), 401

        user = db.session.get(User, payload.get("user_id"))
        if not user:
            return jsonify({"error": "Unauthorized"}), 401

        # A banned user shouldn't be able to use a still-valid token.
        if user.is_banned:
            return jsonify({"error": "Account banned"}), 403

        g.current_user = user
        return fn(*args, **kwargs)

    return wrapper


def admin_required(fn):
    """
    Same as jwt_required, but also checks the user's role is "admin".
    Every /admin/* route uses this instead of jwt_required.
    """
    @wraps(fn)
    @jwt_required
    def wrapper(*args, **kwargs):
        if g.current_user.role != "admin":
            return jsonify({"error": "Forbidden"}), 403
        return fn(*args, **kwargs)

    return wrapper


def driver_required(fn):
    """
    Gates the driver portal routes (see routes/drivers.py). Deliberately
    separate from jwt_required/admin_required - a Driver is not a User row,
    it's its own table/login (see models/driver.py), so this decorator
    decodes the token, checks it was issued with `"type": "driver"` (set by
    POST /driver-login), and attaches the Driver to flask.g.current_driver
    instead of flask.g.current_user.
    """
    @wraps(fn)
    def wrapper(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")

        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Unauthorized"}), 401

        token = auth_header.split(" ", 1)[1]
        payload = _decode_token(token)
        if not payload or payload.get("type") != "driver":
            return jsonify({"error": "Unauthorized"}), 401

        driver = db.session.get(Driver, payload.get("driver_id"))
        if not driver:
            return jsonify({"error": "Unauthorized"}), 401

        g.current_driver = driver
        return fn(*args, **kwargs)

    return wrapper
