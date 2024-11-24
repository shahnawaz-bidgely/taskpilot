from flask import Flask
from .route import bp as route_bp  # Import the hello blueprint

def create_app():
    app = Flask(__name__)

    # Register the blueprint
    app.register_blueprint(route_bp)

    return app
