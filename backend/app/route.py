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

# bp = Blueprint('analysis', __name__)


# Create a blueprint for hello world endpoint
bp = Blueprint('hello', __name__)

# Define a route for the Hello World API

UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
ACCESS_TOKEN = "56b02db5-b83c-4c5c-b75d-3b6eaee03438"

OUTPUT_FOLDER = 'outputs'

@bp.route('/hello', methods=['GET'])
def hello_world():
    print("hello called")
    return jsonify({"message": "Hello, World!2"})



@bp.route('/analyze-users', methods=['POST'])
def analyse_user():
    print("API called")
    file = request.files.get('file')
    if not file:
        return jsonify({'message': 'No file part'}), 400
    if file.filename == '':
        return jsonify({'message': 'No selected file'}), 400

    # Use the helper function to get users from the file
    users = get_users_from_file(file)
    print("user list API -",users);
    if not users:
        return jsonify({'message': 'Error processing file'}), 500

    try:
        results = []
        api_url = "https://pseguatapi.bidgely.com/v2.0/users"
        headers = {
            'Authorization': f'Bearer {ACCESS_TOKEN}',
            'Content-Type': 'application/json'
        }

        for uuid in users:
            try:
                response = requests.get(f"{api_url}/{uuid}", headers=headers)
                if response.status_code == 200:
                    data = response.json()
                    results.append({
                        'uuid': uuid,
                        'accountId': data['payload']['userName'],  # accountId
                        'firstName': data['payload']['firstName'],
                        'lastName': data['payload']['lastName'],
                        'status': data['payload']['status'],
                        'ratePlanId': data['payload']['homeAccounts']['rate']['ratePlanId'],
                        'notificationUserType': data['payload']['notificationUserType'],
                        'hasSolar': data['payload']['homeAccounts']['hasSolar']
                    })
                else:
                    print(f"Failed to fetch data for UUID: {uuid}, Status Code: {response.status_code}")
            except Exception as e:
                print(f"Error while calling API for UUID: {uuid}. Error: {e}")

        # Generate CSV file
        output = io.StringIO()
        fieldnames = ['uuid', 'accountId', 'firstName', 'lastName', 'status', 'ratePlanId', 'notificationUserType',
                      'hasSolar']
        writer = csv.DictWriter(output, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(results)
        output.seek(0)

        # Send CSV as response
        return send_file(
            io.BytesIO(output.getvalue().encode('utf-8')),
            mimetype='text/csv',
            as_attachment=True,
            download_name='user_analysis.csv'
        )

    except Exception as e:
        return jsonify({'message': 'Error processing file', 'error': str(e)}), 500


@bp.route('/analyze-users-redshift', methods=['POST'])
def analyse_user_from_redshift():
    file = request.files.get('file')
    if not file:
        return jsonify({'message': 'No file part'}), 400
    if file.filename == '':
        return jsonify({'message': 'No selected file'}), 400

    users_list = get_users_from_file(file)
    #print("user list redshift- ", users_list);
    conn_rs = connect_to_redshift()

    if not conn_rs:
        return jsonify({'message': 'Failed to connect to Redshift', 'error': 'Connection error'}), 500

    try:
        # Fetch the user list from Redshift
        cursor = conn_rs.cursor()

        formatted_user_list = ", ".join([f"'{user_id}'" for user_id in users_list])

        # Basic query
        query = f"SELECT * FROM public.user_meta_data WHERE uuid IN ({formatted_user_list});"

        #query = "select * from public.user_meta_data  limit 3"  # Example query, modify as needed
        print("final query - ",query)
        cursor.execute(query)

        rows = cursor.fetchall()
        if not rows:
            return jsonify({'message': 'No data found in Redshift for the given query'}), 404

        columns = [desc[0] for desc in cursor.description]  # Get column names
        query_result = [dict(zip(columns, row)) for row in rows]
        cursor.close()
        conn_rs.close()

        result = []
        for data in query_result:

            #print("data- ",data['is_solar_user'],data['notification_user_type'],data['partner_user_id'],data['pilot_id'],data['user_status'],data['uuid'])
            result.append({
                'uuid': data['uuid'],
                'partner_user_id': data['partner_user_id'],
                'is_solar_user': data['is_solar_user'],
                'pilot_id': data['pilot_id'],
                'notification_user_type': data['notification_user_type'],
                'user_status': data['user_status']
            })


        print("final data processed - ", result)
        output = io.StringIO()
        fieldnames = ['uuid', 'partner_user_id', 'is_solar_user', 'pilot_id', 'notification_user_type', 'user_status']
        writer = csv.DictWriter(output, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(result)
        output.seek(0)

        # Send CSV as response
        return send_file(
            io.BytesIO(output.getvalue().encode('utf-8')),
            mimetype='text/csv',
            as_attachment=True,
            download_name='user_analysis_redshift.csv'
        )


    except Exception as e:
        return jsonify({'message': 'Error fetching data from Redshift', 'error': str(e)}), 500


@bp.route('/analyze-cluster-redshift', methods=['POST'])
def analyse_cluster_from_redshift():
    file = request.files.get('file')
    if not file:
        return jsonify({'message': 'No file part'}), 400
    if file.filename == '':
        return jsonify({'message': 'No selected file'}), 400

    users_list = get_users_from_file(file)
    print("user list redshift- ", users_list);
    #users_list = ['5c8f9778-5a6c-4cea-9a7f-7f16e2f83725', 'c5c993d2-d016-4cfa-88fe-554f95419aae']
    conn_rs = connect_to_redshift()

    if not conn_rs:
        return jsonify({'message': 'Failed to connect to Redshift', 'error': 'Connection error'}), 500

    try:
        # Fetch the user list from Redshift
        cursor = conn_rs.cursor()

        formatted_user_list = ", ".join([f"'{user_id}'" for user_id in users_list])

        # Basic query
        query = f"SELECT * FROM public.cluster_user_info WHERE user_id IN ({formatted_user_list}) ORDER BY user_id;"

        #query = "select * from public.user_meta_data  limit 3"  # Example query, modify as needed
        print("final query - ",query)
        cursor.execute(query)

        rows = cursor.fetchall()
        if not rows:
            return jsonify({'message': 'No data found in Redshift for the given query'}), 404

        columns = [desc[0] for desc in cursor.description]  # Get column names
        query_result = [dict(zip(columns, row)) for row in rows]
        cursor.close()
        conn_rs.close()

        result = []
        for data in query_result:
            print("data- ",data['user_id'],data['cluster_id'],data['pilot_id'],data['update_type'],data['last_updated_timestamp'])
            result.append({
                'user_id': data['user_id'],
                'cluster_id': data['cluster_id'],
                'pilot_id': data['pilot_id'],
                'update_type': data['update_type'],
                'last_updated_timestamp': data['last_updated_timestamp']
            })


        print("final data processed - ", result)
       # return jsonify(query_result)
        output = io.StringIO()
        fieldnames = ['user_id','cluster_id', 'pilot_id', 'update_type','last_updated_timestamp']

        writer = csv.DictWriter(output, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(result)
        output.seek(0)

        # Send CSV as response
        return send_file(
            io.BytesIO(output.getvalue().encode('utf-8')),
            mimetype='text/csv',
            as_attachment=True,
            download_name='cluster_analysis_redshift.csv'
        )


    except Exception as e:
        return jsonify({'message': 'Error fetching data from Redshift', 'error': str(e)}), 500





########### Email Module Analysis ########################

@bp.route('/analyze-email-preview', methods=['POST'])
def analyse_email_preview():
    file = request.files.get('file')
    if not file:
        return jsonify({'message': 'No file part'}), 400
    if file.filename == '':
        return jsonify({'message': 'No selected file'}), 400

    file_content = request.form.get('fileContent')
    trigger_time = request.form.get('triggerTime')
    event_name = request.form.get('eventName')
    endpoint = request.form.get('endpoint')

    # Logging or validating other inputs (optional)
    # print(f"File content: {file_content}")
    # print(f"Trigger time: {trigger_time}")
    # print(f"Event name: {event_name}")
    # print(f"Endpoint: {endpoint}")

    # Use the helper function to get users from the file
    users = get_users_from_file(file)
    # print("user list API -", users)

    if not users:
        return jsonify({'message': 'Error processing file'}), 500

    results = []
    ACCESS_TOKEN = get_access_token(endpoint)
    headers = {
        'Authorization': f'Bearer {ACCESS_TOKEN}',
        'Content-Type': 'application/json'
    }

    try:
        for uuid in users:
            home_api = f"{endpoint}/meta/users/{uuid}/homes/1"
            notification_api = f"{endpoint}/2.1/utility_notifications/users/{uuid}"

            print(f'complete url {home_api} notification {notification_api} and  header {headers}')

            # Make API calls for home and notifications
            home_response = requests.get(home_api, headers=headers)
            notification_response = requests.get(notification_api, headers=headers)

            # Check if both responses are successful
            if home_response.status_code == 200 and notification_response.status_code == 200:
                response_JSON_home = home_response.json()
                ratePlanid = response_JSON_home.get("ratePlanId", "N/A")
                response_JSON_notification = notification_response.json()

                # Iterate through notifications and filter based on event name and trigger time
                for notification in response_JSON_notification.get("payload", {}).get("notificationsList", []):
                    if (notification.get("notificationType") == event_name and
                        notification.get("generationTimestamp") > int(trigger_time)):

                        # Extract relevant notification data
                        User_id = notification.get("userId")
                        NotificationID = notification.get("notificationId")
                        NotificationType = notification.get("notificationType")
                        deliveryDestination = notification.get("deliveryDestination")
                        GenerationTimestamp = notification.get("generationTimestamp")
                        status = notification.get("status")

                        # Convert timestamp to datetime
                        ConvertTimeGenerated = str(GenerationTimestamp)[:-3]  # Remove last 3 digits for seconds
                        datetime_object = datetime.fromtimestamp(int(ConvertTimeGenerated))
                        DateStartTimestamp = str(datetime_object).split(" ")[0]

                        # Append the extracted data to results
                        results.append({
                            "uuid": uuid,
                            "ratePlanid": ratePlanid,
                            "NotificationID": NotificationID,
                            "NotificationType": NotificationType,
                            "Email": deliveryDestination,
                            "GenerationTimestamp": GenerationTimestamp,
                            "DateStartTimestamp": DateStartTimestamp,
                            "status": status
                        })

            else:
                print(f"API call failed for UUID: {uuid}, Status Codes: {home_response.status_code}, {notification_response.status_code}")

        # After processing all users, generate and return the CSV
        if results:
            print("final result", results)
            output = io.StringIO()
            fieldnames = ["uuid", "ratePlanid", "NotificationID", "NotificationType", "Email", "GenerationTimestamp", "DateStartTimestamp", "status"]
            writer = csv.DictWriter(output, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(results)
            output.seek(0)

            # Send the generated CSV as a response
            return send_file(
                io.BytesIO(output.getvalue().encode('utf-8')),
                mimetype='text/csv',
                as_attachment=True,
                download_name='user_email_preview.csv'
            )
        else:
            return jsonify({'message': 'No matching notifications found.'}), 404

    except Exception as e:
        # Catch any other unexpected errors
        return jsonify({'message': 'Error processing file', 'error': str(e)}), 500



@bp.route('/generate-email-view', methods=['GET'])
def generate_html():
    # Extract parameters from the query string
    endpoint = request.args.get('endpoint')
    NotificationID = request.args.get('NotificationID')

    if not endpoint or not NotificationID:
        return jsonify({"error": "Missing required parameters: 'endpoint' and 'NotificationID'"}), 400

    # Fetch the access token (assumes `get_access_token` is implemented elsewhere)
    ACCESS_TOKEN = get_access_token(endpoint)
    headers = {
        'Authorization': f'Bearer {ACCESS_TOKEN}',
        'Content-Type': 'application/json'
    }

    # Fetch the notification body from the API
    Notif_html_api = f"{endpoint}/v3.0/internal/notifications/{NotificationID}/body"
    Notif_html_response = requests.get(Notif_html_api, headers=headers)

    if Notif_html_response.status_code != 200:
        return jsonify({"error": "Failed to fetch notification body"}), Notif_html_response.status_code

    try:
        Notif_html_json = Notif_html_response.json()
        notifBody = Notif_html_json["payload"]["notificationData"]["notificationBody"].strip()
        # Clean up the HTML content
        notifBody = notifBody.replace("\n", " ").replace("\t", " ").replace("'", " ").replace(",", " ")
    except (KeyError, ValueError):
        return jsonify({"error": "Invalid response format from the notification API"}), 500

    # Return the HTML content directly
    return Response(notifBody, mimetype='text/html')




# Helper function to extract user list from file
def get_users_from_file(file):
    users = []
    try:
        file_path = os.path.join(UPLOAD_FOLDER, file.filename)
        file.save(file_path)

        if file.filename.endswith('.csv'):
            # If the file is a CSV, use pandas to read it
            df = pd.read_csv(file_path)
            users = df.to_dict(orient='records')  # Convert rows to a list of dictionaries
        else:
            # For text files, read line by line
            with open(file_path, 'r') as f:
                users = [line.strip() for line in f.readlines()]

        return users
    except Exception as e:
        print(f"Error processing file: {e}")
        return None

def connect_to_redshift():
    try:
        conn_rs = redshift_connector.connect(
            host='na-rs1.ctxwwf9dwnm1.us-east-1.redshift.amazonaws.com',
            database='bdw',
            port=5439,
            user='lookerdev',
            password='68grA5eJtGvr23LE'
        )
        return conn_rs
    except Exception as e:
        print(f"Connection failed: {e}")
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