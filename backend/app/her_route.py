from pyexpat.errors import messages

from flask import Blueprint, jsonify, request
import os
import pandas as pd
from requests.auth import HTTPBasicAuth
import requests
from tempfile import NamedTemporaryFile
import json
from concurrent.futures import ThreadPoolExecutor, as_completed
import logging

her_route = Blueprint('her_route', __name__)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@her_route.route('/hello2', methods=['GET'])
def hello_world():
    print("hello called")
    return jsonify({"message": "Hello, World!2"})


@her_route.route('/her-sections-validations', methods=['POST'])
def her_validation_report():
    logger.info("API called")

    # Parse input
    file = request.files.get('file')
    if not file or file.filename == '':
        logger.info("Reading from text box")
        users = ["df79f2b6-3c1d-442e-b65c-1f526b40117d"]
    else:
        logger.info("Reading from file")
        users = get_users_from_file(file)

    fuelType = request.form.get('fuelType')
    reportName = request.form.get('reportName')
    endpoint = "https://" + request.form.get('endpoint')

    logger.info(f"User list - {users}, {fuelType}, {reportName}, {endpoint}")

    if not users:
        return jsonify({'message': 'Error processing file'}), 500

    ACCESS_TOKEN = get_access_token(endpoint)
    headers = {
        'Authorization': f'Bearer {ACCESS_TOKEN}',
        'Content-Type': 'application/json'
    }

    validation_list = []
    try:
        # Use ThreadPoolExecutor for concurrent user processing
        with ThreadPoolExecutor(max_workers=10) as executor:
            future_to_user = {executor.submit(process_user_for_her_validation, user, headers, endpoint, fuelType, reportName): user for user in users}

            for future in as_completed(future_to_user):
                user = future_to_user[future]
                try:
                    result = future.result()
                    validation_list.append(result)
                except Exception as e:
                    logger.error(f"Error processing user {user}: {e}")

        logger.info(f"Validation list: {json.dumps(validation_list, indent=4)}")
        return jsonify(validation_list), 200

    except Exception as e:
        logger.error(f"An error occurred: {e}")
        return jsonify({"error": str(e)}), 500


#### Utility Functions

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
        response = requests.get(header_api, headers=headers, params=params)
        if response.status_code == 200:
            header_failure_reasons = []
            data = response.json()
            # logger.info(f"Response fetched successfully: {json.dumps(data, indent=4)}")

            request_id = data.get("requestId")
            payload = data.get("payload", {})
            error = data.get("error")

            if not payload.get("userFirstName") and not payload.get("userLastName"):
                header_failure_reasons.append("Both first name and last name cannot be empty.")

            if not payload.get("userAddress"):
                header_failure_reasons.append("User address cannot be empty.")

            if not payload.get("utilityAddress"):
                header_failure_reasons.append("Utility address cannot be empty.")

            if not payload.get("accountId"):
                header_failure_reasons.append("Account ID cannot be empty.")

            if not payload.get("generationTime"):
                header_failure_reasons.append("Generation time cannot be empty.")

            print("header_failure_reasons", header_failure_reasons)

            return {
                "status": "success",
                "data": header_failure_reasons,
                "message": "Header validated successfully."
            }
        else:
            return {"status": "error", "data": [],"message":  str(f"Api faiure {response.status_code})")}


    except requests.exceptions.RequestException as e:
        return {"status": "error", "data": [],"message":  str(e)}

    except json.JSONDecodeError as e:
        return {"status": "error", "data": [],"message":  str(e)}


def process_user_for_her_validation(user, headers, endpoint, fuelType, reportName):
    try:
        header_response = validate_header(user, headers, endpoint, fuelType, reportName)
        logger.info(f"Header failure reasons for user {user}: {header_response}")
    except Exception as e:
        logger.error(f"Error in validate_header for user {user}: {e}")
        header_response = [{"error": str(e)}]

    try:
        footer_reponse = validate_footer(user, headers, endpoint, fuelType, reportName)
        logger.info(f"Footer failure reasons for user {user}: {footer_reponse}")
    except Exception as e:
        logger.error(f"Error in validate_footer for user {user}: {e}")
        footer_reponse = [{"error": str(e)}]

    try:
        shc_graph_widget_response = validate_shc_graph_widget(user, headers, endpoint, fuelType, reportName)
        # logger.info(f"SHC graph widget failure reasons for user {user}: {shc_graph_widget_response}")
    except Exception as e:
        logger.error(f"Error in validate_shc_graph_widget for user {user}: {e}")
        shc_graph_widget_response = [{"error": str(e)}]

    try:
        itemization_shc_failure_reasons = validate_itemization_shc(user, headers, endpoint, fuelType, reportName)
        logger.info(f"Itemization SHC failure reasons for user {user}: {itemization_shc_failure_reasons}")
    except Exception as e:
        logger.error(f"Error in validate_itemization_shc for user {user}: {e}")
        itemization_shc_failure_reasons = [{"error": str(e)}]

    api_combines_reponse = {
        'uuid': user,
        "sections": {
            "header": {
                "status": "error" if header_response['status'] == 'error' else "success",
                "reasons": header_response['data'],
                "messages": header_response['message']
            },
            "shc_graph_widget": {
                "status": "error" if header_response['status'] == 'error' else "success",
                "reasons": shc_graph_widget_response,
                "messages": shc_graph_widget_response['message']
            },
            "itemization_shc": {
                "status": "success" if not itemization_shc_failure_reasons else "failure",
                "reasons": itemization_shc_failure_reasons,
                "messages": itemization_shc_failure_reasons['message']
            }
        }
    }
    return api_combines_reponse

def validate_footer(uuid, headers, endpoint, fuelType, reportName):
    return {
        "status": "success",
        "data": [],
        "message": "Footer validated successfully."
    }
def validate_shc_graph_widget(uuid, headers, endpoint, fuelType, reportName):
    return {
        "status": "success",
        "data": [],
        "message": "SHC validated successfully."
    }


def validate_itemization_shc(uuid, headers, endpoint, fuelType, reportName):
    return {
        "status": "success",
        "data": [],
        "message": "Itemization validated successfully."
    }

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
