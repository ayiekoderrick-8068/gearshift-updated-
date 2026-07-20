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

    condition = request.args.get("condition")
    if condition:
        query = query.filter(Vehicle.condition == condition)

    make = request.args.get("make")
    if make:
        query = query.filter(Vehicle.make == make)

    model = request.args.get("model")
    if model:
        query = query.filter(Vehicle.model == model)

    max_mileage = request.args.get("max_mileage")
    if max_mileage:
        query = query.filter(Vehicle.mileage <= int(max_mileage))

    fuel_type = request.args.get("fuel_type")
    if fuel_type:
        query = query.filter(Vehicle.fuel_type == fuel_type)

    year = request.args.get("year")
    if year:
        query = query.filter(Vehicle.year == int(year))

    transmission = request.args.get("transmission")
    if transmission:
        query = query.filter(Vehicle.transmission == transmission)

    drive = request.args.get("drive")
    if drive:
        query = query.filter(Vehicle.drive == drive)

    exterior_color = request.args.get("exterior_color")
    if exterior_color:
        query = query.filter(Vehicle.exterior_color == exterior_color)

    keyword = request.args.get("q")
    if keyword:
        like = f"%{keyword}%"
        query = query.filter(
            db.or_(
                Vehicle.make.ilike(like),
                Vehicle.model.ilike(like),
                Vehicle.description.ilike(like),
            )
        )

    vehicles = query.order_by(Vehicle.created_at.desc()).all()
    return jsonify([v.to_dict() for v in vehicles]), 200


@vehicles_bp.route("/vehicles/mine", methods=["GET"])
@jwt_required
def my_vehicles():
    # Every listing the current user owns, regardless of approval/
    # availability status - unlike the public list above (which only shows
    # approved + available cars), an owner needs to see their own pending
    # and currently-unavailable listings too.
    vehicles = (
        Vehicle.query.filter_by(owner_id=g.current_user.id)
        .order_by(Vehicle.created_at.desc())
        .all()
    )
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
        condition=data.get("condition", "Used"),
        mileage=data.get("mileage", 0),
        fuel_type=data.get("fuel_type", "Petrol"),
        transmission=data.get("transmission", "Automatic"),
        drive=data.get("drive", "FWD"),
        exterior_color=data.get("exterior_color", "White"),
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
        "condition", "mileage", "fuel_type", "transmission", "drive", "exterior_color",
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
