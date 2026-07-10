"""
Vehicle routes - Person B. 5 endpoints: GET list, GET one, POST, PUT, DELETE.
"""
from flask import Blueprint, request, jsonify, g

from extensions import db
from models import Vehicle, Feature
from utils.decorators import jwt_required

vehicles_bp = Blueprint("vehicles", __name__)


@vehicles_bp.route("/vehicles", methods=["GET"])
def list_vehicles():
    # Public browse endpoint only shows listings that are both approved by
    # an admin AND currently available - unapproved/unavailable cars are
    # only visible on the admin vehicles table (GET /admin/vehicles).
    query = Vehicle.query.filter_by(is_approved=True, is_available=True)

    location = request.args.get("location")
    if location:
        query = query.filter(Vehicle.location == location)

    category = request.args.get("category")
    if category:
        query = query.filter(Vehicle.category == category)

    min_rate = request.args.get("min_rate")
    if min_rate:
        query = query.filter(Vehicle.daily_rate >= float(min_rate))

    max_rate = request.args.get("max_rate")
    if max_rate:
        query = query.filter(Vehicle.daily_rate <= float(max_rate))

    vehicles = query.order_by(Vehicle.created_at.desc()).all()
    return jsonify([v.to_dict() for v in vehicles]), 200


@vehicles_bp.route("/vehicles/<int:vehicle_id>", methods=["GET"])
def get_vehicle(vehicle_id):
    vehicle = db.session.get(Vehicle, vehicle_id)
    if not vehicle:
        return jsonify({"error": "Vehicle not found"}), 404
    return jsonify(vehicle.to_dict()), 200


@vehicles_bp.route("/vehicles", methods=["POST"])
@jwt_required
def create_vehicle():
    data = request.get_json() or {}
    required = ["make", "model", "year", "daily_rate", "location", "category"]
    missing = [f for f in required if not data.get(f)]
    if missing:
        return jsonify({"error": f"Missing required fields: {', '.join(missing)}"}), 400

    vehicle = Vehicle(
        make=data["make"],
        model=data["model"],
        year=data["year"],
        daily_rate=data["daily_rate"],
        location=data["location"],
        category=data["category"],
        image_url=data.get("image_url"),
        description=data.get("description"),
        owner_id=g.current_user.id,
        is_approved=False,  # every new listing needs admin approval first
    )

    feature_ids = data.get("features", [])
    if feature_ids:
        vehicle.features = Feature.query.filter(Feature.id.in_(feature_ids)).all()

    db.session.add(vehicle)
    db.session.commit()
    return jsonify(vehicle.to_dict()), 201


@vehicles_bp.route("/vehicles/<int:vehicle_id>", methods=["PUT"])
@jwt_required
def update_vehicle(vehicle_id):
    vehicle = db.session.get(Vehicle, vehicle_id)
    if not vehicle:
        return jsonify({"error": "Vehicle not found"}), 404

    if vehicle.owner_id != g.current_user.id:
        return jsonify({"error": "You do not own this listing"}), 403

    data = request.get_json() or {}
    editable_fields = [
        "make", "model", "year", "daily_rate", "location",
        "category", "image_url", "description", "is_available",
    ]
    for field in editable_fields:
        if field in data:
            setattr(vehicle, field, data[field])

    if "features" in data:
        vehicle.features = Feature.query.filter(Feature.id.in_(data["features"])).all()

    db.session.commit()
    return jsonify(vehicle.to_dict()), 200


@vehicles_bp.route("/vehicles/<int:vehicle_id>", methods=["DELETE"])
@jwt_required
def delete_vehicle(vehicle_id):
    vehicle = db.session.get(Vehicle, vehicle_id)
    if not vehicle:
        return jsonify({"error": "Vehicle not found"}), 404

    if vehicle.owner_id != g.current_user.id:
        return jsonify({"error": "You do not own this listing"}), 403

    db.session.delete(vehicle)  # cascades to VehicleFeature rows via the relationship
    db.session.commit()
    return jsonify({"message": "Vehicle deleted"}), 200
