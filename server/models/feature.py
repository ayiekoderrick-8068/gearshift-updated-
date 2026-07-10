"""
Feature model - Person B.

A "feature" is something like GPS, Bluetooth, AWD - a car amenity that can
be attached to many vehicles (and a vehicle can have many features). See
vehicle_feature.py for the join table that makes this many-to-many.
"""
from extensions import db


class Feature(db.Model):
    __tablename__ = "features"

    id = db.Column(db.Integer, primary_key=True)

    name = db.Column(db.String(100), nullable=False)
    # Short string key used by the frontend to pick an emoji/icon -
    # see client/src/constants.js FEATURE_ICON_MAP.
    icon = db.Column(db.String(50), nullable=True)
    description = db.Column(db.String(255), nullable=True)
    category = db.Column(db.String(50), nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "icon": self.icon,
            "description": self.description,
            "category": self.category,
        }

    def __repr__(self):
        return f"<Feature {self.id} {self.name}>"
