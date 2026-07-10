"""
Join table for the Vehicle <-> Feature many-to-many relationship.

Using a plain db.Table (rather than a full model class) since this table
has no extra data of its own - it's purely two foreign keys. This is the
project's one required many-to-many relationship.
"""
from extensions import db

vehicle_features = db.Table(
    "vehicle_features",
    db.Column("vehicle_id", db.Integer, db.ForeignKey("vehicles.id"), primary_key=True),
    db.Column("feature_id", db.Integer, db.ForeignKey("features.id"), primary_key=True),
)
