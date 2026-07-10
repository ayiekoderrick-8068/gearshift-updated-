"""
Driver routes - self-drive vs chauffeur-driven hire, plus the driver portal.

Public GET so the booking form can populate a driver dropdown, admin-only
POST so new chauffeurs can be added without touching seed.py, and a small
set of driver-portal endpoints (login, view assigned jobs, accept/decline)
gated by driver_required instead of jwt_required/admin_required, since a
Driver logs in with its own credentials rather than a User account - see
models/driver.py and utils/decorators.py.
"""
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify, g
import jwt

from extensions import db, bcrypt
from config import Config
from models import Driver, Booking
from utils.decorators import admin_required, driver_required

drivers_bp = Blueprint("drivers", __name__)


def _make_driver_token(driver):
    payload = {
        "driver_id": driver.id,
        "type": "driver",
        "exp": datetime.utcnow() + Config.JWT_EXPIRY,
    }
    return jwt.encode(payload, Config.JWT_SECRET_KEY, algorithm="HS256")


@drivers_bp.route("/drivers", methods=["GET"])
def list_drivers():
    drivers = Driver.query.filter_by(is_available=True).order_by(Driver.rating.desc()).all()
    return jsonify([d.to_dict() for d in drivers]), 200


@drivers_bp.route("/drivers", methods=["POST"])
@admin_required
def create_driver():
    data = request.get_json() or {}
    if not data.get("name") or not data.get("daily_rate"):
        return jsonify({"error": "name and daily_rate are required"}), 400

    driver = Driver(
        name=data["name"],
        rating=data.get("rating", 4.0),
        daily_rate=data["daily_rate"],
        phone=data.get("phone"),
        license_number=data.get("license_number"),
        bio=data.get("bio"),
    )
    if data.get("email") and data.get("password"):
        driver.email = data["email"].strip().lower()
        driver.password_hash = bcrypt.generate_password_hash(data["password"]).decode("utf-8")

    db.session.add(driver)
    db.session.commit()
    return jsonify(driver.to_dict()), 201


# --- Driver portal ------------------------------------------------------

@drivers_bp.route("/driver-login", methods=["POST"])
def driver_login():
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password")

    driver = Driver.query.filter_by(email=email).first()
    if not driver or not driver.password_hash or not bcrypt.check_password_hash(driver.password_hash, password or ""):
        return jsonify({"error": "Invalid email or password"}), 401

    token = _make_driver_token(driver)
    return jsonify({"token": token, "driver": driver.to_dict()}), 200


@drivers_bp.route("/driver/me", methods=["GET"])
@driver_required
def get_driver_me():
    return jsonify(g.current_driver.to_dict()), 200


@drivers_bp.route("/driver/bookings", methods=["GET"])
@driver_required
def list_driver_bookings():
    # Every booking this driver has ever been assigned to (across both
    # single-vehicle and convoy bookings - they're all just Booking rows
    # with driver_id set to this driver), most recent first.
    bookings = (
        Booking.query.filter_by(driver_id=g.current_driver.id)
        .order_by(Booking.created_at.desc())
        .all()
    )
    return jsonify([b.to_dict() for b in bookings]), 200


@drivers_bp.route("/driver/bookings/<int:booking_id>", methods=["PUT"])
@driver_required
def respond_to_booking(booking_id):
    booking = db.session.get(Booking, booking_id)
    if not booking or booking.driver_id != g.current_driver.id:
        return jsonify({"error": "Booking not found"}), 404

    data = request.get_json() or {}
    new_status = data.get("driver_status")
    if new_status not in ("accepted", "declined"):
        return jsonify({"error": "driver_status must be 'accepted' or 'declined'"}), 400

    booking.driver_status = new_status
    db.session.commit()
    return jsonify(booking.to_dict()), 200
