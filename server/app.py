"""
App factory - Person A. This is the file you run: `flask run` or
`python app.py`. Wires together config, extensions, models and blueprints.

Using create_app() (a factory function) rather than a bare module-level
Flask app makes testing easier later and avoids import-order headaches -
extensions get initialised with the app instead of importing a half-built
app object.
"""
from flask import Flask, jsonify

from config import Config
from extensions import db, bcrypt, cors


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    bcrypt.init_app(app)
    cors.init_app(app, resources={r"/*": {"origins": Config.CORS_ORIGINS}})

    # Blueprints - one per teammate's area. Importing them here (rather than
    # at the top of the file) avoids a circular import with `db`.
    from routes.auth import auth_bp
    from routes.vehicles import vehicles_bp
    from routes.features import features_bp
    from routes.drivers import drivers_bp
    from routes.driver_applications import driver_applications_bp
    from routes.bookings import bookings_bp
    from routes.admin import admin_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(vehicles_bp)
    app.register_blueprint(features_bp)
    app.register_blueprint(drivers_bp)
    app.register_blueprint(driver_applications_bp)
    app.register_blueprint(bookings_bp)
    app.register_blueprint(admin_bp)

    @app.route("/")
    def health_check():
        # Handy for confirming the API is up - hit this in Postman or a
        # browser at http://localhost:5000/
        return jsonify({"status": "ok", "message": "GearShift API is running"})

    return app


app = create_app()

if __name__ == "__main__":
    with app.app_context():
        db.create_all()  # creates gearshift.db tables on first run if they don't exist
    app.run(debug=True, port=5000)
