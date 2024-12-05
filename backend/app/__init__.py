from flask import Flask
from .route import bp as route_bp  # Import the hello blueprint
import os
from flask_cors import CORS

def create_app():
    app = Flask(__name__)
    app.config['UPLOAD_FOLDER'] = 'uploads'
    app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024
    CORS(app, supports_credentials=True)


    # Ensure the upload folder exists
    if not os.path.exists(app.config['UPLOAD_FOLDER']):
        os.makedirs(app.config['UPLOAD_FOLDER'])

    # Register the blueprint
    app.register_blueprint(route_bp)

    return app
