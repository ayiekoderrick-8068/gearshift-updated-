"""
Shared Flask extension instances.

Kept in their own module (separate from app.py) purely to avoid circular
imports: models/*.py need `db`, routes/*.py need `db` and `bcrypt`, and
app.py needs to wire everything together. If db lived inside app.py,
models.py would have to import app.py, which imports models.py -> circular
import error. This file has no dependencies on the rest of the app, so
everyone can safely import from here.
"""
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_cors import CORS

db = SQLAlchemy()
bcrypt = Bcrypt()
cors = CORS()
