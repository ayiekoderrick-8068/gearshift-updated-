"""
Contact routes - the "drop us a message" form at the bottom of the /faq
page (see client/src/pages/FAQ.jsx). Public and unauthenticated on purpose:
a tourist asking a question shouldn't need a GearShift account first. Phone
isn't validated against the Kenyan +254 pattern used elsewhere in the app
(see routes/bookings.py) since this form is aimed at tourists, who may be
messaging from a foreign number.
"""
from flask import Blueprint, request, jsonify

from extensions import db
from models import ContactMessage
from utils.decorators import admin_required

contact_bp = Blueprint("contact", __name__)


@contact_bp.route("/contact", methods=["POST"])
def create_contact_message():
    data = request.get_json() or {}
    full_name = data.get("full_name")
    email = data.get("email")
    phone = data.get("phone")
    message = data.get("message")

    if not all([full_name, email, message]):
        return jsonify({"error": "full_name, email, and message are required"}), 400

    contact_message = ContactMessage(
        full_name=full_name,
        email=email,
        phone=phone,
        message=message,
    )
    db.session.add(contact_message)
    db.session.commit()

    return jsonify(contact_message.to_dict()), 201


@contact_bp.route("/admin/contact-messages", methods=["GET"])
@admin_required
def list_contact_messages():
    messages = ContactMessage.query.order_by(ContactMessage.created_at.desc()).all()
    return jsonify([m.to_dict() for m in messages]), 200


@contact_bp.route("/admin/contact-messages/<int:message_id>", methods=["PUT"])
@admin_required
def update_contact_message(message_id):
    contact_message = db.session.get(ContactMessage, message_id)
    if not contact_message:
        return jsonify({"error": "Message not found"}), 404

    data = request.get_json() or {}
    if "is_read" in data:
        contact_message.is_read = bool(data["is_read"])

    db.session.commit()
    return jsonify(contact_message.to_dict()), 200


@contact_bp.route("/admin/contact-messages/<int:message_id>", methods=["DELETE"])
@admin_required
def delete_contact_message(message_id):
    contact_message = db.session.get(ContactMessage, message_id)
    if not contact_message:
        return jsonify({"error": "Message not found"}), 404

    db.session.delete(contact_message)
    db.session.commit()
    return jsonify({"message": "Message deleted"}), 200
