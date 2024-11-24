from flask import Blueprint, jsonify

# Create a blueprint for hello world endpoint
bp = Blueprint('hello', __name__)

# Define a route for the Hello World API
@bp.route('/hello', methods=['GET'])
def hello_world():
    return jsonify({"message": "Hello, World!"})
