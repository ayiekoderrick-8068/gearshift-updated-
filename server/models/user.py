"""
User model - Person A.

Covers all three account types (guest is just "no user row"; client and
admin are both User rows distinguished by `role`). 10 non-PK columns, well
past the 4-column minimum in the brief.
"""
from datetime import datetime
from extensions import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)

    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)

    # "client" (default) or "admin". Kept as a plain string rather than an
    # Enum table since we only ever have two roles - simpler for a project
    # this size.
    role = db.Column(db.String(20), nullable=False, default="client")

    license_number = db.Column(db.String(50), nullable=True)
    verification_status = db.Column(db.String(20), nullable=False, default="unverified")

    # What a *client* signed up to do: "renter", "owner", or "both" (the
    # signup form's Rent cars / List my car / Both toggle). Purely a UI
    # preference - it changes which nav links/dashboard sections a client
    # sees (see Navbar.jsx), it does NOT gate anything on the backend. An
    # admin's rental_intent is meaningless and left at the default.
    rental_intent = db.Column(db.String(20), nullable=False, default="both")
    rating = db.Column(db.Float, nullable=False, default=0.0)
    is_banned = db.Column(db.Boolean, nullable=False, default=False)

    # Password reset flow (see routes/auth.py POST /reset-password).
    reset_token = db.Column(db.String(255), nullable=True)
    reset_token_expiry = db.Column(db.DateTime, nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # --- Relationships -----------------------------------------------
    # One-to-many: a User (owner) can list many Vehicles.
    vehicles = db.relationship("Vehicle", backref="owner", lazy=True, cascade="all, delete-orphan")
    # One-to-many: a User (renter) can make many Bookings.
    bookings = db.relationship("Booking", backref="renter", lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        """Never include password_hash or reset_token in API responses."""
        return {
            "id": self.id,
            "email": self.email,
            "role": self.role,
            "license_number": self.license_number,
            "rental_intent": self.rental_intent,
            "verification_status": self.verification_status,
            "rating": self.rating,
            "is_banned": self.is_banned,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self):
        return f"<User {self.id} {self.email} ({self.role})>"
