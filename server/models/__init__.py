"""
Importing every model here means `from models import User, Vehicle, ...`
works from anywhere, and it guarantees SQLAlchemy sees every model class
before db.create_all() runs (otherwise it silently skips tables for models
that were never imported).
"""
from .user import User
from .vehicle import Vehicle
from .feature import Feature
from .vehicle_feature import vehicle_features
from .driver import Driver
from .driver_application import DriverApplication
from .booking import Booking

__all__ = ["User", "Vehicle", "Feature", "vehicle_features", "Driver", "DriverApplication", "Booking"]
