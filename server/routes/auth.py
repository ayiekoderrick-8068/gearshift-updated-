"""
Auth routes - Person A. 5 endpoints (register, login, me GET/PUT,
reset-password, reset-password/confirm counts as 6 - either way, well past
what's needed).
"""
import secrets
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify, g
import jwt

from extensions import db, bcrypt
from config import Config
from models import User
from utils.decorators import jwt_required

auth_bp = Blueprint("auth", __name__)


def _make_token(user):
    payload = {
        "user_id": user.id,
        "role": user.role,
        "exp": datetime.utcnow() + Config.JWT_EXPIRY,
    }
    return jwt.encode(payload, Config.JWT_SECRET_KEY, algorithm="HS256")


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password")
    role = data.get("role", "client")
    rental_intent = data.get("rental_intent", "both")

    if not email or not password:
        return jsonify({"error": "email and password are required"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "An account with that email already exists"}), 409

    if role not in ("client", "admin"):
        role = "client"

    if rental_intent not in ("renter", "owner", "both"):
        rental_intent = "both"

    password_hash = bcrypt.generate_password_hash(password).decode("utf-8")
    user = User(email=email, password_hash=password_hash, role=role, rental_intent=rental_intent)
    db.session.add(user)
    db.session.commit()

    token = _make_token(user)
    return jsonify({"token": token, "user": user.to_dict()}), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password")

    user = User.query.filter_by(email=email).first()
    if not user or not bcrypt.check_password_hash(user.password_hash, password or ""):
        return jsonify({"error": "Invalid email or password"}), 401

    if user.is_banned:
        return jsonify({"error": "This account has been banned"}), 403

    token = _make_token(user)
    return jsonify({"token": token, "user": user.to_dict()}), 200


@auth_bp.route("/me", methods=["GET"])
@jwt_required
def get_me():
    return jsonify(g.current_user.to_dict()), 200


@auth_bp.route("/me", methods=["PUT"])
@jwt_required
def update_me():
    data = request.get_json() or {}
    user = g.current_user

    if "license_number" in data:
        user.license_number = data["license_number"]
    if "rental_intent" in data and data["rental_intent"] in ("renter", "owner", "both"):
        user.rental_intent = data["rental_intent"]
    if "email" in data and data["email"]:
        new_email = data["email"].strip().lower()
        existing = User.query.filter(User.email == new_email, User.id != user.id).first()
        if existing:
            return jsonify({"error": "That email is already in use"}), 409
        user.email = new_email

    db.session.commit()
    return jsonify(user.to_dict()), 200


@auth_bp.route("/reset-password", methods=["POST"])
def request_reset():
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()
    user = User.query.filter_by(email=email).first()

    if not user:
        return jsonify({"message": "If that email exists, a reset token was generated"}), 200

    token = secrets.token_urlsafe(32)
    user.reset_token = token
    user.reset_token_expiry = datetime.utcnow() + timedelta(hours=1)
    db.session.commit()

    return jsonify({"message": "Reset token generated", "reset_token": token}), 200


@auth_bp.route("/reset-password/confirm", methods=["POST"])
def confirm_reset():
    data = request.get_json() or {}
    token = data.get("token")
    new_password = data.get("new_password")

    if not token or not new_password:
        return jsonify({"error": "token and new_password are required"}), 400

    user = User.query.filter_by(reset_token=token).first()
    if not user or not user.reset_token_expiry or user.reset_token_expiry < datetime.utcnow():
        return jsonify({"error": "Invalid or expired reset token"}), 400

    user.password_hash = bcrypt.generate_password_hash(new_password).decode("utf-8")
    user.reset_token = None
    user.reset_token_expiry = None
    db.session.commit()

    return jsonify({"message": "Password updated successfully"}), 200
