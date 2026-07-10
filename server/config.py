"""
App configuration, pulled from environment variables (see .env.example).
Using python-dotenv + os.environ keeps secrets out of the codebase - never
commit a real .env file (it's in .gitignore).
"""
import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()


class Config:
    # Falls back to a local SQLite file for development so nobody needs to
    # install Postgres just to run the project on their laptop. In
    # production (Render) set DATABASE_URL and it'll use that instead.
    #
    # NOTE: this uses `os.environ.get("DATABASE_URL") or "sqlite:///..."`
    # rather than `os.environ.get("DATABASE_URL", "sqlite:///...")`. Those
    # are NOT the same thing - .env.example ships with a blank
    # "DATABASE_URL=" line (intentionally, so you have somewhere to paste
    # the Render URL later). python-dotenv loads that as an empty string,
    # and os.environ.get(key, default) only falls back to `default` when
    # the key is completely absent - an empty string still counts as "set",
    # so the two-argument form would hand SQLAlchemy an empty string and
    # crash with "Could not parse SQLAlchemy URL". `or` treats the empty
    # string as falsy and correctly falls back to SQLite instead.
    _database_url = os.environ.get("DATABASE_URL") or "sqlite:///gearshift.db"
    # Render's Postgres URLs start with "postgres://" but SQLAlchemy 1.4+
    # requires "postgresql://" - patch it here so deployment doesn't break.
    if _database_url.startswith("postgres://"):
        _database_url = _database_url.replace("postgres://", "postgresql://", 1)

    SQLALCHEMY_DATABASE_URI = _database_url
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    SECRET_KEY = os.environ.get("SECRET_KEY") or "dev-secret-change-me"
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY") or "dev-jwt-secret-change-me"
    JWT_EXPIRY = timedelta(days=7)

    # Comma-separated list of allowed frontend origins, e.g.
    # "http://127.0.0.1:5173,https://gearshift.vercel.app"
    CORS_ORIGINS = (os.environ.get("CORS_ORIGINS") or "http://127.0.0.1:5173").split(",")

    # Where uploaded driver-application CVs get saved (see
    # routes/driver_applications.py). Lives outside version control - see
    # .gitignore - since it holds real applicants' documents, not demo data.
    UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads", "cvs")
    MAX_CONTENT_LENGTH = 5 * 1024 * 1024  # 5MB cap on any uploaded file
