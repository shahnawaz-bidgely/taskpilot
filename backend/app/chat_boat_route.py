from flask import Blueprint, jsonify, request
from requests.auth import HTTPBasicAuth
from tempfile import NamedTemporaryFile
import os
import pandas as pd
# from pandasai import Agent

chatbot_route = Blueprint('chat_route', __name__)

@chatbot_route.route('/hello3', methods=['GET'])
def hello_world():
    print("hello called")
    return jsonify({"message": "Hello, World!3"})


import requests



@chatbot_route.route('/chat-boat-promp', methods=['POST'])
def her_validation_report():
    print("API called chat")

    data = request.json
    if data and 'message' in data:
        message = data['message']
        print(f"Message received: {message}")
    else:
        print("No message received in request")
        return jsonify({"error": "No message received in request"}), 400

    import pandas as pd

    # Data for the dataframe
    data = {
        "uuid": [
            "fcc675c9-968a-4f54-8b17-d7307c65b2c2", "fcc675c9-968a-4f54-8b17-d7307c65b2c2",
            "fcc675c9-968a-4f54-8b17-d7307c65b2c2", "fcc675c9-968a-4f54-8b17-d7307c65b2c2",
            "55e7cc8b-060d-4787-b1f0-5f10762b2ea4", "55e7cc8b-060d-4787-b1f0-5f10762b2ea4",
            "55e7cc8b-060d-4787-b1f0-5f10762b2ea4", "55e7cc8b-060d-4787-b1f0-5f10762b2ea4",
            "9b9f7e5c-2f3e-43fb-afb1-955093e801a7", "9b9f7e5c-2f3e-43fb-afb1-955093e801a7",
            "9b9f7e5c-2f3e-43fb-afb1-955093e801a7", "9b9f7e5c-2f3e-43fb-afb1-955093e801a7",
            "a6d32682-f16d-436f-beb5-e35cc53ec74f", "a6d32682-f16d-436f-beb5-e35cc53ec74f",
            "a6d32682-f16d-436f-beb5-e35cc53ec74f", "a6d32682-f16d-436f-beb5-e35cc53ec74f",
            "db1976bb-09dc-452d-ba3c-e55d5ebbbb1a", "db1976bb-09dc-452d-ba3c-e55d5ebbbb1a",
            "db1976bb-09dc-452d-ba3c-e55d5ebbbb1a", "db1976bb-09dc-452d-ba3c-e55d5ebbbb1a"
        ],
        "ratePlanid": [180] * 20,
        "NotificationID": [
            "1ccacec0-cf19-11ef-bccd-65020db4a21d", "47c36030-b5d6-11ef-b8ec-ff9aa9a3ffa5",
            "9ff82e20-8598-11ef-823a-13492b2f4a8e", "c44f0600-0d51-11ef-959d-53aa15246221",
            "3c06eeb0-cf08-11ef-9d05-9f0bed316655", "405979a0-b5d2-11ef-b8ec-ff9aa9a3ffa5",
            "e23d2510-8584-11ef-b5ab-859757ba8e9a", "b03d6080-0c89-11ef-9453-5be84e004ae1",
            "5a11a280-ce52-11ef-ab33-c3077b3cbc53", "95f2b480-b44c-11ef-ae62-6d1b89ec6893",
            "3c2711c0-8586-11ef-880e-9f8989d298a2", "11964480-0d9a-11ef-a22e-8d99ec45254f",
            "54c17760-ce52-11ef-bfa3-0924a3e76f19", "3c132b70-b474-11ef-92e0-89448a116563",
            "3938f8e0-858e-11ef-ab1d-f75cb1e147d5", "81dab930-0c8a-11ef-a0e7-b55bb35c8fc1",
            "4ee008c0-ce52-11ef-968b-0dee20dd8482", "394e29f0-b472-11ef-91ea-b58763930012",
            "904350d0-8585-11ef-abec-6114b2526a89", "84994780-0c8b-11ef-9394-c7f493f4c57e"
        ],
        "NotificationType": ["NEIGHBOURHOOD_COMPARISON"] * 20,
        "deliveryDestination": [
            "mustapha6000@yahoo.com", "mustapha6000@yahoo.com", "mustapha6000@yahoo.com", "mustapha6000@yahoo.com",
            "karval5@aol.com", "karval5@aol.com", "karval5@aol.com", "karval5@aol.com",
            "rdewnarayan@gmail.com", "rdewnarayan@gmail.com", "rdewnarayan@gmail.com", "rdewnarayan@gmail.com",
            "JASON.DEVAENIER@GMAIL.COM", "JASON.DEVAENIER@GMAIL.COM", "JASON.DEVAENIER@GMAIL.COM",
            "JASON.DEVAENIER@GMAIL.COM",
            "vctrlws@hotmail.com", "vctrlws@hotmail.com", "vctrlws@hotmail.com", "vctrlws@hotmail.com"
        ],
        "GenerationTimestamp": [
            1736489223596, 1733711740339, 1728407603714, 1715183030880,
            1736481974555, 1733710009914, 1728399124961, 1715097097864,
            1736403856552, 1733542649800, 1728399705308, 1715214084296,
            1736403847638, 1733559678887, 1728403136366, 1715097449539,
            1736403837772, 1733558815247, 1728399416925, 1715097883640
        ],
        "DateStartTimestamp": [
            "2025-01-10", "2024-12-09", "2024-10-08", "2024-05-08",
            "2025-01-10", "2024-12-09", "2024-10-08", "2024-05-07",
            "2025-01-09", "2024-12-07", "2024-10-08", "2024-05-09",
            "2025-01-09", "2024-12-07", "2024-10-08", "2024-05-07",
            "2025-01-09", "2024-12-07", "2024-10-08", "2024-05-07"
        ],
        "status": [
            "DELIVERED", "DELIVERED", "DELIVERED", "DELIVERED",
            "DELIVERED", "DELIVERED", "DELIVERED", "DELIVERED",
            "DELIVERED", "DELIVERED", "DELIVERED", "DELIVERED",
            "BOUNCED", "BOUNCED", "BOUNCED", "BOUNCED",
            "DELIVERED", "DELIVERED", "DELIVERED", "DELIVERED"
        ]
    }

    # Creating the dataframe
    df = pd.DataFrame(data)
    os.environ["PANDASAI_API_KEY"] = "$2a$10$Hvo9CEt05i4fp.2cR5SsGOc/eKs5.ghs3GMn1CGDuggu.xSwyQRWW"

    # agent = Agent(df)
    # print(agent.chat(message))

    return jsonify({}), 200




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
