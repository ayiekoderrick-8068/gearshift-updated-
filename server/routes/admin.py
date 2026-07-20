"""
Admin routes - Person C. 7 endpoints, all behind @admin_required (imported
from Person A's utils/decorators.py).
"""
from flask import Blueprint, request, jsonify

from extensions import db
from models import User, Vehicle, Booking
from utils.decorators import admin_required

admin_bp = Blueprint("admin", __name__)


@admin_bp.route("/admin/stats", methods=["GET"])
@admin_required
def stats():
    total_users = User.query.count()
    total_vehicles = Vehicle.query.count()
    total_bookings = Booking.query.count()
    total_revenue = (
        db.session.query(db.func.coalesce(db.func.sum(Booking.total_price), 0))
        .filter(Booking.status == "completed")
        .scalar()
    )
    return jsonify({
        "total_users": total_users,
        "total_vehicles": total_vehicles,
        "total_bookings": total_bookings,
        "total_revenue": total_revenue,
    }), 200


@admin_bp.route("/admin/users", methods=["GET"])
@admin_required
def list_users():
    users = User.query.all()
    result = []
    for u in users:
        data = u.to_dict()
        data["vehicle_count"] = len(u.vehicles)
        data["booking_count"] = len(u.bookings)
        result.append(data)
    return jsonify(result), 200


@admin_bp.route("/admin/users/<int:user_id>", methods=["PUT"])
@admin_required
def update_user(user_id):
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json() or {}
    if "is_banned" in data:
        user.is_banned = bool(data["is_banned"])
    if "verification_status" in data:
        user.verification_status = data["verification_status"]
    if "role" in data and data["role"] in ("client", "admin"):
        user.role = data["role"]

    db.session.commit()
    return jsonify(user.to_dict()), 200


@admin_bp.route("/admin/users/<int:user_id>", methods=["DELETE"])
@admin_required
def delete_user(user_id):
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    db.session.delete(user)
    db.session.commit()
    return jsonify({"message": "User and their listings/bookings deleted"}), 200


@admin_bp.route("/admin/bookings", methods=["GET"])
@admin_required
def list_all_bookings():
    bookings = Booking.query.order_by(Booking.created_at.desc()).all()
    return jsonify([b.to_dict() for b in bookings]), 200


@admin_bp.route("/admin/vehicles", methods=["GET"])
@admin_required
def list_all_vehicles():
    vehicles = Vehicle.query.order_by(Vehicle.created_at.desc()).all()
    return jsonify([v.to_dict() for v in vehicles]), 200


@admin_bp.route("/admin/vehicles/<int:vehicle_id>", methods=["PUT"])
@admin_required
def review_vehicle(vehicle_id):
    vehicle = db.session.get(Vehicle, vehicle_id)
    if not vehicle:
        return jsonify({"error": "Vehicle not found"}), 404

    data = request.get_json() or {}
    if "is_approved" in data:
        vehicle.is_approved = bool(data["is_approved"])

    db.session.commit()
    return jsonify(vehicle.to_dict()), 200
