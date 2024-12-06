from flask import Blueprint, jsonify, request, send_file
import redshift_connector
import os
import pandas as pd
import requests
import csv
import io

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
    return jsonify({"message": "Hello, World!2"})

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

@bp.route('/analyze-users', methods=['POST'])
def analyse_user():
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