from flask import Flask
from .route import analysis_route as analysis_route  # Import the hello blueprint
from .her_route import her_route as her_route
from .chat_boat_route import chatbot_route as chat_boat
from .interaction_route import interaction_route as interaction_route
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
    app.register_blueprint(analysis_route)
    app.register_blueprint(her_route)
    app.register_blueprint(chat_boat)
    app.register_blueprint(interaction_route)

    return app
