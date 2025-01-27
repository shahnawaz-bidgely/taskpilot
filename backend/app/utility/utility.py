from flask import Blueprint, jsonify, request, send_file
import redshift_connector
import os
import pandas as pd
from flask import Response
from requests.auth import HTTPBasicAuth
import requests
import csv
import io
from datetime import datetime
from tempfile import NamedTemporaryFile

bp = Blueprint('her_route', __name__)


def get_users_from_file(file):
    users = []
    try:
        # Save the file to a temporary location
        with NamedTemporaryFile(delete=False) as temp_file:
            file.save(temp_file.name)
            temp_file_path = temp_file.name

        if file.filename.endswith('.csv'):
            # Process CSV in chunks
            for chunk in pd.read_csv(temp_file_path, chunksize=1000):
                users.extend(chunk.to_dict(orient='records'))  # Append each chunk's records
        else:
            # Read text file line by line
            with open(temp_file_path, 'r') as f:
                users = [line.strip() for line in f]

        # Clean up the temporary file
        os.remove(temp_file_path)

        return users
    except Exception as e:
        print(f"Error processing file: {e}")
        return None

