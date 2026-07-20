"""
Vehicle model - Person B.

Owner side of the one-to-many User -> Vehicle relationship (backref="owner"
is defined on User.vehicles in user.py). Also the "many" side of the
Vehicle <-> Feature many-to-many via the vehicle_features join table.
"""
from datetime import datetime
from extensions import db
from .vehicle_feature import vehicle_features


class Vehicle(db.Model):
    __tablename__ = "vehicles"

    id = db.Column(db.Integer, primary_key=True)

    make = db.Column(db.String(50), nullable=False)
    model = db.Column(db.String(50), nullable=False)
    year = db.Column(db.Integer, nullable=False)
    daily_rate = db.Column(db.Float, nullable=False)
    location = db.Column(db.String(100), nullable=False)
    is_available = db.Column(db.Boolean, nullable=False, default=True)
    image_url = db.Column(db.String(500), nullable=True)
    description = db.Column(db.Text, nullable=True)
    category = db.Column(db.String(30), nullable=False)  # SUV, Sedan, Truck, Convertible, Van

    # Search Options filter fields (see SearchFilter.jsx on /vehicles).
    condition = db.Column(db.String(10), nullable=False, default="Used")  # New, Used
    mileage = db.Column(db.Integer, nullable=False, default=0)  # km
    fuel_type = db.Column(db.String(20), nullable=False, default="Petrol")  # Petrol, Diesel, Hybrid, Electric
    transmission = db.Column(db.String(20), nullable=False, default="Automatic")  # Automatic, Manual
    drive = db.Column(db.String(10), nullable=False, default="FWD")  # FWD, RWD, AWD, 4WD
    exterior_color = db.Column(db.String(20), nullable=False, default="White")

    # Admin must approve a listing before it shows up in public GET /vehicles.
    is_approved = db.Column(db.Boolean, nullable=False, default=False)

    owner_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Many-to-many with Feature through the vehicle_features join table.
    features = db.relationship("Feature", secondary=vehicle_features, lazy="subquery", backref="vehicles")

    # One-to-many: a Vehicle can have many Bookings over time.
    bookings = db.relationship("Booking", backref="vehicle", lazy=True, cascade="all, delete-orphan")

    def to_dict(self, include_features=True):
        data = {
            "id": self.id,
            "make": self.make,
            "model": self.model,
            "year": self.year,
            "daily_rate": self.daily_rate,
            "location": self.location,
            "is_available": self.is_available,
            "image_url": self.image_url,
            "description": self.description,
            "category": self.category,
            "condition": self.condition,
            "mileage": self.mileage,
            "fuel_type": self.fuel_type,
            "transmission": self.transmission,
            "drive": self.drive,
            "exterior_color": self.exterior_color,
            "is_approved": self.is_approved,
            "owner_id": self.owner_id,
            "owner_name": self.owner.email.split("@")[0] if self.owner else None,
            "owner_rating": self.owner.rating if self.owner else None,
        }
        if include_features:
            data["features"] = [f.to_dict() for f in self.features]
        return data

    def __repr__(self):
        return f"<Vehicle {self.id} {self.make} {self.model}>"
