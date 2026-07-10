"""
DriverApplication model - "Chauffeur for hire / want to be a driver?"

A public applicant fills this in on pages/BecomeDriver.jsx and uploads a
CV. It's deliberately a separate model from Driver (models/driver.py) -
this is a job APPLICATION (unreviewed, could be rejected), Driver is an
actual active chauffeur GearShift dispatches for bookings. An admin
reviews applications on /admin/driver-applications and can download the
CV; approving one doesn't automatically create a Driver row (kept as a
manual step so the admin sets the new driver's rate deliberately, matching
"the higher the rating, the more expensive the driver" from the brief -
there's no rating yet for a brand new applicant).
"""
from datetime import datetime
from extensions import db


class DriverApplication(db.Model):
    __tablename__ = "driver_applications"

    id = db.Column(db.Integer, primary_key=True)

    full_name = db.Column(db.String(100), nullable=False)
    id_number = db.Column(db.String(30), nullable=False)
    email = db.Column(db.String(255), nullable=False)
    phone = db.Column(db.String(20), nullable=False)
    license_number = db.Column(db.String(50), nullable=False)
    # Which vehicle category they want to drive - SUV, Limousine, Bus, etc.
    # (see client/src/constants.js VEHICLE_CATEGORIES - kept as a plain
    # string rather than a FK since it's a preference, not a real relation).
    preferred_category = db.Column(db.String(30), nullable=False)

    # CV file, saved to Config.UPLOAD_FOLDER under a generated filename
    # (never trust the original filename - see routes/driver_applications.py).
    cv_filename = db.Column(db.String(255), nullable=False)
    cv_original_name = db.Column(db.String(255), nullable=True)

    status = db.Column(db.String(20), nullable=False, default="pending")  # pending / approved / rejected
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "full_name": self.full_name,
            "id_number": self.id_number,
            "email": self.email,
            "phone": self.phone,
            "license_number": self.license_number,
            "preferred_category": self.preferred_category,
            "cv_original_name": self.cv_original_name,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self):
        return f"<DriverApplication {self.id} {self.full_name} ({self.status})>"
