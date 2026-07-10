"""
Booking model - Person C.

The transactional core of the app - links a renter (User) to a Vehicle for
a date range. Originally 10 non-PK columns; now extended with self-drive
vs chauffeur hire and event/convoy support (weddings, funerals, corporate
events booking multiple vehicles at once with a volume discount) - see the
column comments below and routes/bookings.py's `create_convoy_booking`.
"""
from datetime import datetime
from extensions import db


class Booking(db.Model):
    __tablename__ = "bookings"

    id = db.Column(db.Integer, primary_key=True)

    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    total_price = db.Column(db.Float, nullable=False)

    # pending -> confirmed/cancelled -> active -> completed
    status = db.Column(db.String(20), nullable=False, default="pending")

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    notes = db.Column(db.Text, nullable=True)
    # 1-5 star rating left by the renter after a completed booking.
    review_rating = db.Column(db.Integer, nullable=True)

    vehicle_id = db.Column(db.Integer, db.ForeignKey("vehicles.id"), nullable=False)
    renter_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)

    # Contact number for THIS booking specifically (may differ from the
    # renter's account - e.g. booking on behalf of a family member for a
    # funeral). Validated both client-side and in routes/bookings.py
    # against ^\+254\d{9}$ - Kenyan format, +254 followed by exactly 9 digits.
    contact_phone = db.Column(db.String(20), nullable=False)

    # --- Self-drive vs chauffeur-driven hire ---------------------------
    # "self_drive" (default) or "chauffeur". driver_id is only set when
    # hire_type is "chauffeur" - see routes/bookings.py for the price calc
    # (driver's daily_rate gets added on top of the vehicle's daily_rate).
    hire_type = db.Column(db.String(20), nullable=False, default="self_drive")
    driver_id = db.Column(db.Integer, db.ForeignKey("drivers.id"), nullable=True)
    # Set to "pending" the moment a driver_id is assigned (booking creation
    # or later re-assignment), then "accepted" or "declined" once the
    # driver responds from their own portal (see routes/drivers.py's
    # PUT /driver/bookings/<id>). Null when there's no driver on this
    # booking at all (self-drive).
    driver_status = db.Column(db.String(20), nullable=True)

    # --- Event / convoy bookings ----------------------------------------
    # A wedding, funeral, or corporate event can book several vehicles at
    # once as one "convoy" - each vehicle still gets its own Booking row
    # (so all the normal per-vehicle logic - conflicts, owner confirm,
    # reviews - keeps working unmodified), but they share a convoy_id so
    # the frontend can group them together and show one combined summary.
    event_type = db.Column(db.String(20), nullable=True)  # "wedding" / "funeral" / "safari" / "group_transportation" / "other"
    is_convoy = db.Column(db.Boolean, nullable=False, default=False)
    convoy_id = db.Column(db.String(36), nullable=True, index=True)
    # Percentage discount applied to this booking's total_price for being
    # part of a convoy (0 for a normal single-vehicle booking). Tiered by
    # how many vehicles were booked together - see routes/bookings.py.
    discount_percent = db.Column(db.Float, nullable=False, default=0.0)

    def to_dict(self):
        return {
            "id": self.id,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "end_date": self.end_date.isoformat() if self.end_date else None,
            "total_price": self.total_price,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "notes": self.notes,
            "review_rating": self.review_rating,
            "vehicle_id": self.vehicle_id,
            "renter_id": self.renter_id,
            "contact_phone": self.contact_phone,
            "hire_type": self.hire_type,
            "driver_id": self.driver_id,
            "driver_status": self.driver_status,
            "event_type": self.event_type,
            "is_convoy": self.is_convoy,
            "convoy_id": self.convoy_id,
            "discount_percent": self.discount_percent,
            # Nested vehicle/renter/driver summary so the booking cards on
            # the frontend don't need extra round trips (avoids N+1 fetches).
            "vehicle_make": self.vehicle.make if self.vehicle else None,
            "vehicle_model": self.vehicle.model if self.vehicle else None,
            "vehicle_image": self.vehicle.image_url if self.vehicle else None,
            "vehicle_daily_rate": self.vehicle.daily_rate if self.vehicle else None,
            "renter_name": self.renter.email.split("@")[0] if self.renter else None,
            "owner_id": self.vehicle.owner_id if self.vehicle else None,
            "driver_name": self.driver.name if self.driver else None,
            "driver_rating": self.driver.rating if self.driver else None,
        }

    def __repr__(self):
        return f"<Booking {self.id} vehicle={self.vehicle_id} renter={self.renter_id} {self.status}>"
