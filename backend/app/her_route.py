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
import json

bp = Blueprint('her_route', __name__)



@bp.route('/myhello', methods=['GET'])
def hello_world():
    print("hello called")
    return jsonify({"message": "Hello, World!2"})


import requests


def validate_header(uuid, headers, endpoint, fuelType, reportName):

    header_api = f"{endpoint}/v2.0/pdf-report/users/{uuid}/header"

    # Query parameters
    params = {
        "measurement-type": fuelType,
        "locale": "en_US",
        "report-type": reportName
    }

    print(f"Making API call to: {header_api} with params: {params}")

    try:
        # Make the GET request
        response = requests.get(header_api, headers=headers, params=params)

        # Log the response
        print(f"Response Status Code: {response.status_code}")
        print(f"Response Data: {response.text}")

        # Handle the response based on status code
        if response.status_code == 200:
            # Parse the JSON response if successful
            return ["User name missing"]
        else:
            # Handle errors
            return ["Utility address is missing"]

    except requests.exceptions.RequestException as e:
        # Log and handle network-related errors
        print(f"API call failed: {e}")
        return {"error": str(e)}


def validate_shc_graph_widget(user, header):
    return []


def validate_itemization_shc(user, header):
    return []


@bp.route('/her-sections-validations', methods=['POST'])
def her_validation_report():
    print("API called")
    file = request.files.get('file')
    if not file or file.filename == '':
        print("Reading from text box")
        users = ["df79f2b6-3c1d-442e-b65c-1f526b40117d"]
    else:
        print("Reading from file")
        users = get_users_from_file(file)

    fuelType = request.form.get('fuelType')
    reportName = request.form.get('reportName')
    endpoint = request.form.get('endpoint')

    # print("User list - ",users, fuelType, reportName, endpoint);
    # return jsonify({'message': 'Success'}), 200

    if not users:
        return jsonify({'message': 'Error processing file'}), 500

    ACCESS_TOKEN = get_access_token(endpoint)
    headers = {
        'Authorization': f'Bearer {ACCESS_TOKEN}',
        'Content-Type': 'application/json'
    }

    try:
        validation_list = []
        for user in users:
            print(f"Processing user: {user}")

            try:
                header_failure_reasons = validate_header(user, headers, endpoint, fuelType, reportName)
                print(f"Header failure reasons for user {user}: {header_failure_reasons}")
            except Exception as e:
                print(f"Error in validate_header for user {user}: {e}")
                header_failure_reasons = [{"error": str(e)}]

            try:
                shc_graph_widget_failure_reasons = validate_shc_graph_widget(user, headers, endpoint, fuelType,
                                                                             reportName)
                print(f"SHC graph widget failure reasons for user {user}: {shc_graph_widget_failure_reasons}")
            except Exception as e:
                print(f"Error in validate_shc_graph_widget for user {user}: {e}")
                shc_graph_widget_failure_reasons = [{"error": str(e)}]

            try:
                itemization_shc_failure_reasons = validate_itemization_shc(user, headers, endpoint, fuelType,
                                                                           reportName)
                print(f"Itemization SHC failure reasons for user {user}: {itemization_shc_failure_reasons}")
            except Exception as e:
                print(f"Error in validate_itemization_shc for user {user}: {e}")
                itemization_shc_failure_reasons = [{"error": str(e)}]

            validation_list.append({
                'uuid': user,
                "sections": {
                    "header": {
                        "status": "success" if not header_failure_reasons else "failure",
                        "reasons": header_failure_reasons
                    },
                    "shc_graph_widget": {
                        "status": "success" if not shc_graph_widget_failure_reasons else "failure",
                        "reasons": shc_graph_widget_failure_reasons
                    },
                    "itemization_shc": {
                        "status": "success" if not itemization_shc_failure_reasons else "failure",
                        "reasons": itemization_shc_failure_reasons
                    }
                }
            })

        print(f"Validation list: {json.dumps(validation_list, indent=4)}")
        return jsonify(validation_list), 200

    except Exception as e:
        print(f"An error occurred: {e}")
        return jsonify({"error": str(e)}), 500


#### Utility Functions

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
def get_access_token(endpoint):
    try:
        # Replace these with your actual username and password
        USERNAME = "shahnawaz@bidgely.com"
        PASSWORD = "PyAmsFJe"

        # Replace this with your actual token URL
        TOKEN_URL = f"{endpoint}/oauth/token"

        payload = {
            "grant_type": "client_credentials",
            "scope": "all"
        }

        # Make the POST request with basic authentication
        response = requests.post(TOKEN_URL, data=payload, auth=HTTPBasicAuth(USERNAME, PASSWORD))

        # Raise an exception if the response status code is not 200
        response.raise_for_status()

        # Parse the JSON response
        token_data = response.json()

        # Return the access token and other details
        return token_data['access_token']
    except requests.exceptions.RequestException as e:
        return {"error": str(e)}