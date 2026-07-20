"""
Driver application routes - "Chauffeur for hire / want to be a driver?"

POST /driver-applications is public and accepts multipart/form-data (not
JSON) because it includes a CV file upload - see
client/src/pages/BecomeDriver.jsx for the matching frontend form.

The admin-only routes let GearShift's admin review applications and
download the CV without exposing uploaded files to the public internet -
GET /admin/driver-applications/<id>/cv streams the file through Flask
rather than serving the uploads folder directly as static files.
"""
import os
import uuid
from flask import Blueprint, request, jsonify, current_app, send_from_directory
from werkzeug.utils import secure_filename

from extensions import db
from models import DriverApplication
from utils.decorators import admin_required

driver_applications_bp = Blueprint("driver_applications", __name__)

ALLOWED_CV_EXTENSIONS = {"pdf", "doc", "docx"}


def _allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_CV_EXTENSIONS


@driver_applications_bp.route("/driver-applications", methods=["POST"])
def create_driver_application():
    # Regular form fields (not JSON - this is a multipart request because
    full_name = request.form.get("full_name")
    id_number = request.form.get("id_number")
    email = request.form.get("email")
    phone = request.form.get("phone")
    license_number = request.form.get("license_number")
    preferred_category = request.form.get("preferred_category")

    required = [full_name, id_number, email, phone, license_number, preferred_category]
    if not all(required):
        return jsonify({"error": "All fields are required"}), 400

    if "cv" not in request.files or request.files["cv"].filename == "":
        return jsonify({"error": "A CV file is required"}), 400

    cv_file = request.files["cv"]
    if not _allowed_file(cv_file.filename):
        return jsonify({"error": "CV must be a PDF, DOC, or DOCX file"}), 400

    original_name = secure_filename(cv_file.filename)
    stored_name = f"{uuid.uuid4().hex}_{original_name}"

    os.makedirs(current_app.config["UPLOAD_FOLDER"], exist_ok=True)
    cv_file.save(os.path.join(current_app.config["UPLOAD_FOLDER"], stored_name))

    application = DriverApplication(
        full_name=full_name,
        id_number=id_number,
        email=email,
        phone=phone,
        license_number=license_number,
        preferred_category=preferred_category,
        cv_filename=stored_name,
        cv_original_name=original_name,
    )
    db.session.add(application)
    db.session.commit()

    return jsonify(application.to_dict()), 201


@driver_applications_bp.route("/admin/driver-applications", methods=["GET"])
@admin_required
def list_driver_applications():
    applications = DriverApplication.query.order_by(DriverApplication.created_at.desc()).all()
    return jsonify([a.to_dict() for a in applications]), 200


@driver_applications_bp.route("/admin/driver-applications/<int:application_id>", methods=["PUT"])
@admin_required
def update_driver_application(application_id):
    application = db.session.get(DriverApplication, application_id)
    if not application:
        return jsonify({"error": "Application not found"}), 404

    data = request.get_json() or {}
    if data.get("status") in ("pending", "approved", "rejected"):
        application.status = data["status"]

    db.session.commit()
    return jsonify(application.to_dict()), 200


@driver_applications_bp.route("/admin/driver-applications/<int:application_id>/cv", methods=["GET"])
@admin_required
def download_cv(application_id):
    application = db.session.get(DriverApplication, application_id)
    if not application:
        return jsonify({"error": "Application not found"}), 404

    return send_from_directory(
        current_app.config["UPLOAD_FOLDER"],
        application.cv_filename,
        as_attachment=True,
        download_name=application.cv_original_name or application.cv_filename,
    )
