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

# app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
OUTPUT_FOLDER = 'outputs'

@bp.route('/hello', methods=['GET'])
def hello_world():
    return jsonify({"message": "Hello, World!2"})


@bp.route('/analyze-users', methods=['POST'])
def analyse_user():

    print("Headers:", request.headers)
    file = request.files.get('file')
    content = request.form.get('content')

    if file:
        print(f"Received file: {file.filename}")
    else:
        print("No file received.")

    if content:
        print(f"Received content: {content[:100]}...")  # Print first 100 characters for debug
    else:
        print("No content received.")


    if 'file' not in request.files:
        return jsonify({'message': 'No file part'}), 400

    if file.filename == '':
        return jsonify({'message': 'No selected file'}), 400

    # Save file to server
    file_path = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(file_path)
    try:
        users = []
        if file.filename.endswith('.csv'):
            # If the file is a CSV, use pandas to read it
            df = pd.read_csv(file_path)
            users = df.to_dict(orient='records')  # Convert rows to a list of dictionaries
        else:
            # For text files, read line by line
            with open(file_path, 'r') as f:
                users = [line.strip() for line in f.readlines()]

        # Debug: Print all users to the console
        # print("Users from the uploaded file:")
        api_url = "https://pseguatapi.bidgely.com/v2.0/users"
        headers = {
            'Authorization': f'Bearer {ACCESS_TOKEN}',
            'Content-Type': 'application/json'
        }
        results = []

        for uuid in users:
            try:
                print("API - ",api_url)
                response = requests.get(f"{api_url}/{uuid}", headers=headers)
                if response.status_code == 200:
                    data = response.json()
                    first_name = data['payload']['firstName']
                    last_name = data['payload']['lastName']
                    status = data['payload']['status']
                    rate_plan_id = data['payload']['homeAccounts']['rate']['ratePlanId']
                    notification_user_type = data['payload']['notificationUserType']
                    has_solar = data['payload']['homeAccounts']['hasSolar']
                    account_id = data['payload']['userName']  # Assuming 'userName' as accountId

                    # Append the extracted data into the results list
                    results.append({
                        'uuid': uuid,
                        'accountId': account_id,
                        'firstName': first_name,
                        'lastName': last_name,
                        'status': status,
                        'ratePlanId': rate_plan_id,
                        'notificationUserType': notification_user_type,
                        'hasSolar': has_solar
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
        print(f"Error processing file: {e}")
        return jsonify({'message': 'Error processing file', 'error': str(e)}), 500



@bp.route('/analyze-users-redshift', methods=['GET'])
def analyse_user_from_redshift():
    conn_rs = connect_to_redshift()

    if not conn_rs:
        # If connection failed, return an error response
        return jsonify({'message': 'Failed to connect to Redshift', 'error': 'Connection error'}), 500

    try:
        # Create a cursor and execute the query
        cursor = conn_rs.cursor()
        query = "SELECT * from public.users limit 3"  # Example query, modify as needed

        # Fetch results
        cursor.execute(query)

        # Check if results were returned
        rows = cursor.fetchall()
        if not rows:
            return jsonify({'message': 'No data found in Redshift for the given query'}), 404

        # Process the results
        columns = [desc[0] for desc in cursor.description]  # Get column names
        result = [dict(zip(columns, row)) for row in rows]

        # Close the cursor and connection
        cursor.close()
        conn_rs.close()

        # Return the result as JSON
        return jsonify(result)
    except Exception as e:
        # Handle errors during query execution or result processing
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