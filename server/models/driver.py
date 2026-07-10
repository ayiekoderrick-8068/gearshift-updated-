"""
Driver model - for the self-drive vs chauffeur-driven hire option.

A Driver is a separate entity from User - drivers are GearShift's own
professional chauffeurs (not renters/owners), booked alongside a vehicle
when a renter chooses "with driver" instead of "self-drive" on
BookingNew.jsx or the event/convoy booking page.

daily_rate scales with rating - "the higher the rating, the more expensive
the driver" per the brief, so a 5-star driver costs more per day than a
3.5-star one. This is set explicitly in seed.py rather than computed on
the fly, so an admin could still hand-adjust an individual driver's rate
later without the number silently snapping back to a formula.

A Driver can also log in to their own portal (see routes/drivers.py's
POST /driver-login, and pages/DriverPortal.jsx on the frontend) to see the
jobs they've been assigned and accept or decline each one - hence the
email/password_hash columns, alongside the existing profile fields.
"""
from extensions import db


class Driver(db.Model):
    __tablename__ = "drivers"

    id = db.Column(db.Integer, primary_key=True)

    name = db.Column(db.String(100), nullable=False)
    rating = db.Column(db.Float, nullable=False, default=4.0)
    daily_rate = db.Column(db.Float, nullable=False)
    phone = db.Column(db.String(30), nullable=True)
    license_number = db.Column(db.String(50), nullable=True)
    bio = db.Column(db.String(255), nullable=True)
    is_available = db.Column(db.Boolean, nullable=False, default=True)

    # Driver portal login - separate credential space from User (a driver
    # is not a client/admin account). Nullable so a Driver created directly
    # via admin tooling without portal access still works (they just can't
    # log in until an email/password are set).
    email = db.Column(db.String(255), unique=True, nullable=True)
    password_hash = db.Column(db.String(255), nullable=True)

    # One-to-many: a Driver can be assigned to many Bookings over time.
    bookings = db.relationship("Booking", backref="driver", lazy=True)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "rating": self.rating,
            "daily_rate": self.daily_rate,
            "phone": self.phone,
            "license_number": self.license_number,
            "bio": self.bio,
            "is_available": self.is_available,
            "email": self.email,
        }

    def __repr__(self):
        return f"<Driver {self.id} {self.name} ({self.rating}★)>"
