"""
Feature routes - Person B. 4 endpoints: GET list, POST, PUT, DELETE (admin only).
"""
from flask import Blueprint, request, jsonify

from extensions import db
from models import Feature
from utils.decorators import jwt_required, admin_required

features_bp = Blueprint("features", __name__)


@features_bp.route("/features", methods=["GET"])
def list_features():
    features = Feature.query.order_by(Feature.name).all()
    return jsonify([f.to_dict() for f in features]), 200


@features_bp.route("/features", methods=["POST"])
@jwt_required
def create_feature():
    # Any logged-in user can suggest a new feature (e.g. an owner listing a
    # car with an amenity that isn't in the list yet).
    data = request.get_json() or {}
    if not data.get("name"):
        return jsonify({"error": "name is required"}), 400

    feature = Feature(
        name=data["name"],
        icon=data.get("icon"),
        description=data.get("description"),
        category=data.get("category"),
    )
    db.session.add(feature)
    db.session.commit()
    return jsonify(feature.to_dict()), 201


@features_bp.route("/features/<int:feature_id>", methods=["PUT"])
@jwt_required
def update_feature(feature_id):
    feature = db.session.get(Feature, feature_id)
    if not feature:
        return jsonify({"error": "Feature not found"}), 404

    data = request.get_json() or {}
    for field in ["name", "icon", "description", "category"]:
        if field in data:
            setattr(feature, field, data[field])

    db.session.commit()
    return jsonify(feature.to_dict()), 200


@features_bp.route("/features/<int:feature_id>", methods=["DELETE"])
@admin_required
def delete_feature(feature_id):
    feature = db.session.get(Feature, feature_id)
    if not feature:
        return jsonify({"error": "Feature not found"}), 404

    db.session.delete(feature)
    db.session.commit()
    return jsonify({"message": "Feature deleted"}), 200
