from flask import Blueprint, jsonify, request
import os
import json
import logging
from collections import OrderedDict
import requests
from numpy.ma.core import append
from requests.auth import HTTPBasicAuth

from backend.app.route import ACCESS_TOKEN

interaction_route = Blueprint('interaction_route', __name__)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MASTER_FILE_PATH_PROGRAM_NBI = "app/resources/master_program_nbi.json"
MASTER_FILE_PATH_TEST = "app/resources/test.json"
MASTER_FILE_PATH_EE_NBI = "app/resources/master_ee_nbi.json"
RANK_COUNTER = 0



@interaction_route.route('/prep-interactions', methods=['POST'])
def update_interactions():
    fuels = request.form.get('fuelType')
    # reportName = request.form.get('reportName')
    endpoint_url = "https://" + request.form.get('endpoint')
    uuid = request.form.get('uuid')
    fuels = fuels.split(",")

    # uuid = "751e298e-7e54-4bb5-a4f2-17bfd0931e61"
    # endpoint_url = "https://avistauatapi.bidgely.com"
    ACCESS_TOKEN = "56b02db5-b83c-4c5c-b75d-3b6eaee03438"
    pilotId = 10046

    print(f"User Data - {fuels},{uuid}, {endpoint_url}, {ACCESS_TOKEN}")

    try:

        if not os.path.exists(MASTER_FILE_PATH_PROGRAM_NBI):
            return jsonify({"error": "Master Program file not found at the specified path."}), 400

        if not os.path.exists(MASTER_FILE_PATH_EE_NBI):
            return jsonify({"error": "Master EE file not found at the specified path."}), 400

        INTERACTION_FILE_FINAL = {
            "interactions": [],
            "nbi_delivery_helper_dict": {
                "billing_info": {
                    "last_electric_billing_cycle_info": {
                        "last_billing_start": 1730793600,
                        "last_billing_end": 1733472000
                    },
                    "last_gas_billing_cycle_info": {
                        "last_billing_start": 1730793600,
                        "last_billing_end": 1733472000
                    }
                }
            }
        }

        endpoint_map = getEndPoint(uuid, endpoint_url, ACCESS_TOKEN, fuels)
        unique_nbi_set = set()
        unique_action_Set = set()

        for fuel in fuels:
            if fuel in endpoint_map:
                bc_start_time, bc_end_time = get_latest_bill_cycle(uuid, endpoint_url, ACCESS_TOKEN, fuel)

                topAppliance = get_itemization_data(uuid, endpoint_url, ACCESS_TOKEN,10046, bc_start_time, bc_end_time,  endpoint_map.get(fuel), fuel.lower())
                print("fuel", fuel, endpoint_map.get(fuel), topAppliance)
                if topAppliance is None:
                    print(f"Top appliance not found for fuel {fuel} with billing cycle {bc_start_time} {bc_end_time}")
                    continue
                prepare_generic_app_based_data(MASTER_FILE_PATH_EE_NBI, INTERACTION_FILE_FINAL, fuel, topAppliance, unique_nbi_set, unique_action_Set)
                #prepare_eenbi_data(MASTER_FILE_PATH_EE_NBI, INTERACTION_FILE_FINAL, fuel, 3, unique_nbi_set, unique_action_Set)
                prepare_program_data(MASTER_FILE_PATH_PROGRAM_NBI,INTERACTION_FILE_FINAL, fuel, 3,unique_nbi_set, unique_action_Set)

            else:
                print("fuel", fuel.lower(), "not found")

        print("final interaction", INTERACTION_FILE_FINAL)
        if not INTERACTION_FILE_FINAL["interactions"]:  # Check if interactions list is empty
            return jsonify({"error": "No interactions found", "success": False}), 200  # Still returning 200

        return jsonify({"data": INTERACTION_FILE_FINAL, "success": True}), 200  # Success response


    except Exception as e:
        return jsonify({"error": str(e)}), 500

def prepare_generic_app_based_data(MASTER_FILE_PATH_EE_NBI, INTERACTION_FILE_FINAL, fuelType, topAppliance,  unique_nbi_set, unique_action_Set):
    with open(MASTER_FILE_PATH_EE_NBI, 'r') as f:
        master_ee_nbi_data = json.load(f)

    print(f"Processing app based actionable Reco NBI data")
    #print("current interaction = ", INTERACTION_FILE_FINAL)

    # data = remove_duplicates_by_action_id(master_ee_nbi_data)
    # print("data", data)

    for interaction in master_ee_nbi_data:
        print(f"processing for appliance {interaction.get("applianceId")}")
        #print(interaction)

        if interaction.get("id") in unique_nbi_set or interaction.get("action").get("id") in unique_action_Set:
            print(f"Skipping interaction with id {interaction.get('id')} and action id {interaction.get('action').get('id')}")
            continue

        if ("Summer" in interaction.get("nbiType") or "Winter" in interaction.get("nbiType")) and (
                interaction.get("fuelType") == fuelType):
            #print("Found summer or Winter")
            assign_rank(interaction, INTERACTION_FILE_FINAL)
            unique_nbi_set.add(interaction.get("id"))
            unique_action_Set.add(interaction.get("action").get("id"))

        else:
            if (int(interaction.get("applianceId")) in topAppliance and interaction.get("fuelType") == fuelType):
                #print(f"Found Non summer or Winter with top appliance {topAppliance} and fuel {fuelType}")
                assign_rank(interaction, INTERACTION_FILE_FINAL)
                unique_nbi_set.add(interaction.get("id"))
                unique_action_Set.add(interaction.get("action").get("id"))

def prepare_eenbi_data(MASTER_FILE_PATH, INTERACTION_FILE_FINAL, fuelType, topAppliance, unique_nbi_set, unique_action_Set):
    with open(MASTER_FILE_PATH, 'r') as f:
        master_ee_nbi_data = json.load(f)

    print("Processing EE NBI data")
    print("current interaction = ", INTERACTION_FILE_FINAL)

    #data = remove_duplicates_by_action_id(master_ee_nbi_data)
    #print("data", data)

    for interaction in master_ee_nbi_data:
        print(interaction)
        if ("Summer" in interaction.get("nbiType") or "Winter" in interaction.get("nbiType")) and (interaction.get("fuelType") == fuelType):
            print("Found summer or Winter")
            assign_rank(interaction, INTERACTION_FILE_FINAL)

        else:
            if (interaction.get("applianceId") == str(topAppliance) and interaction.get("fuelType") == fuelType):
                print(f"Found Non summer or Winter with top appliance {topAppliance} and fuel {fuelType}")
                assign_rank(interaction, INTERACTION_FILE_FINAL)
                break


def prepare_program_data(MASTER_FILE_PATH, INTERACTION_FILE_FINAL, fuelType, topAppliance, unique_nbi_set, unique_action_Set):

    with open(MASTER_FILE_PATH, 'r') as f:
        master_program_data = json.load(f, object_pairs_hook=OrderedDict)
    print("Processing PROGRAM NBI data")

    for interaction in master_program_data:
        print(interaction)
        if interaction.get("id") in unique_nbi_set or interaction.get("action").get("id") in unique_action_Set:
            print(
                f"Skipping interaction with id {interaction.get('id')} and action id {interaction.get('action').get('id')}")
            continue

        if ("Summer" in interaction.get("nbiType") or "Winter" in interaction.get("nbiType")) and (
                interaction.get("fuelType") == fuelType):
            assign_rank(interaction, INTERACTION_FILE_FINAL)
            unique_nbi_set.add(interaction.get("id"))
            unique_action_Set.add(interaction.get("action").get("id"))

        else:
            if (interaction.get("fuelType") == fuelType):
                assign_rank(interaction, INTERACTION_FILE_FINAL)
                unique_nbi_set.add(interaction.get("id"))
                unique_action_Set.add(interaction.get("action").get("id"))



################### Common ############################

import requests
import logging

logger = logging.getLogger(__name__)


def get_latest_bill_cycle(uuid, BaseURL, ACCESS_TOKEN, measurementType):
    # uuid = "751e298e-7e54-4bb5-a4f2-17bfd0931e61"
    # BaseURL = "https://avistauatapi.bidgely.com"
    # ACCESS_TOKEN = "56b02db5-b83c-4c5c-b75d-3b6eaee03438"
    # pilotId = 10046

    logger.info("billing cycle process started for UUID: %s", uuid)
    headers = {
        'Authorization': f'Bearer {ACCESS_TOKEN}',
        'Content-Type': 'application/json'
    }

    billing_cycle_api = (
        f"{BaseURL}/billingdata/users/{uuid}/homes/1/utilitydata?t0=0&t1=1956177599&measurementType={measurementType}"
    )

    # "{{url}}/billingdata/users/{{uuid3}}/homes/{{hid}}/utilitydata?t0=0&t1=1956177599&measurementType=GAS"

    logger.debug("Billing Cycle API URL: %s", billing_cycle_api)

    try:
        response = requests.get(billing_cycle_api, headers=headers)
        response.raise_for_status()

        response_JSON = response.json()

        sorted_keys = sorted(response_JSON.keys(), reverse=True)

        for key in sorted_keys:
            billing_data = response_JSON[key]
            if not billing_data.get("bidgelyGeneratedInvoice", True):  # Default to True if not present
                bc_start_time = billing_data.get("billingStartTs")
                bc_end_time = billing_data.get("billingEndTs")

                if bc_start_time and bc_end_time:
                    print(f"Latest billing cycle {bc_start_time} {bc_end_time}")
                    return bc_start_time, bc_end_time

        # if response_JSON:
        #     bc_start_time = response_JSON[-2]["key"]
        #     bc_end_time = response_JSON[-2]["value"]
        #
        # billing_list = []
        # billing_list.append(bc_start_time)
        # billing_list.append(bc_end_time)
        #
        # print(f"latest billing cycle {bc_start_time} {bc_end_time}")
        #
        # return bc_start_time,bc_end_time

        # return jsonify(billing_list), 200

    except requests.exceptions.RequestException as req_err:
        logger.error("API request failed: %s", req_err)
        return None
    except (KeyError, TypeError, ValueError) as parse_err:
        logger.error("Failed to parse Billing Cycle response: %s", parse_err)
        return None
    except Exception as general_err:
        logger.error("Unexpected error during Billing Cycle: %s", general_err)
        return None


def get_itemization_data(uuid, BaseURL, ACCESS_TOKEN, pilot_id, bc_start_prev, bc_end_prev, endpoint, measurementType):

    logger.info("Itemization process started for UUID: %s", uuid)
    headers = {
        'Authorization': f'Bearer {ACCESS_TOKEN}',
        'Content-Type': 'application/json'
    }

    # Construct API URL
    itemisation_api = (
        f"{BaseURL}/v2.0/users/{uuid}/endpoints/{endpoint}/itemizationDetails"
        f"?extended=true&t0={bc_start_prev}&t1={bc_end_prev}&mode=month&measurementType={measurementType}"
    )

    logger.debug("Itemization API URL: %s", itemisation_api)

    try:
        # Make the API request
        response = requests.get(itemisation_api, headers=headers)
        response.raise_for_status()  # Raise an HTTPError for bad responses (4xx or 5xx)

        # Parse the JSON response
        data = response.json()
        payload = data.get("payload", {})
        itemization_details_list = payload.get("itemizationDetails", [])


        if not itemization_details_list:
            logger.error("No itemization details found in the response: %s", data)
            return None


        itemization_data_for_cycle = itemization_details_list[0]

        if not itemization_data_for_cycle:
            logger.error("No itemization data found in the response: %s", data)
            return None
        itemization_data_for_measurement = itemization_data_for_cycle[measurementType]

        #print(f" size {len(itemization_data_for_measurement)} itemization detail for measurement {measurementType} {itemization_data_for_measurement}")

        app_list = []
        for i in range(len(itemization_data_for_measurement)):
            #print(f"processing for {i} with data {itemization_data_for_measurement[i]}")

            if itemization_data_for_measurement[i].get("id"):
                #print("itemization_data_for_measurement[i].get('id')", itemization_data_for_measurement[i].get("id"))
                app_list.append(int(itemization_data_for_measurement[i].get("id")))


        result = app_list[0:2] if len(app_list)>2 else app_list
        print("final applinace result ", result)
        return result

    except requests.exceptions.RequestException as req_err:
        logger.error("API request failed: %s", req_err)
        return None
    except (KeyError, TypeError, ValueError) as parse_err:
        logger.error("Failed to parse itemization response: %s", parse_err)
        return None
    except Exception as general_err:
        logger.error("Unexpected error during itemization: %s", general_err)
        return None


def assign_rank(interaction, INTERACTION_FILE_FINAL):
    global RANK_COUNTER
    RANK_COUNTER = RANK_COUNTER + 1

    interaction["rank"] = RANK_COUNTER
    INTERACTION_FILE_FINAL["interactions"].append(interaction)
    print(f"Added interaction with app {interaction.get("applianceId")} in with fuel and {interaction.get("nbiType")}")


def getEndPoint(uuid, BaseURL, ACCESS_TOKEN, fuels):
    logger.info("endpoint started")
    # uuid = "751e298e-7e54-4bb5-a4f2-17bfd0931e61"
    # BaseURL = "https://avistauatapi.bidgely.com"
    # ACCESS_TOKEN = "56b02db5-b83c-4c5c-b75d-3b6eaee03438"

    headers = {
        'Authorization': f'Bearer {ACCESS_TOKEN}',
        'Content-Type': 'application/json'
    }
    endpoint_api = f"{BaseURL}/v2.0/users/{uuid}/endpoints"


    try:

        endpoint_response = requests.get(f"{endpoint_api}", headers=headers)

        # Check if the response status is OK
        if endpoint_response.status_code != 200:
            logging.error(
                "API request failed with status code %s: %s",
                endpoint_response.status_code,
                endpoint_response.text
            )
            return None

        response_JSON = endpoint_response.json()

        if "payload" not in response_JSON:
            logging.error("Missing 'payload' in API response: %s", response_JSON)
            return None

        payload = response_JSON["payload"]
        endpoint_map = {}

        if not isinstance(payload, list):
            print("Error: 'payload' is not a list.")
        else:
            for data in payload:
                try:
                    data = dict(data)
                    measurement_type = "ELECTRIC" if data.get('measurementType') == "Electricity" else "GAS" if data.get('measurementType') == "Gas" else None
                    endpoint_id = data.get('endpointId')

                    if measurement_type and endpoint_id:
                        endpoint_map[measurement_type] = endpoint_id
                    else:
                        print("Skipping entry with missing keys:", data)

                except Exception as e:
                    print("Error processing entry:", data, "Error:", str(e))

        print(f"endpoint details - {endpoint_map}")
        return endpoint_map

    except requests.exceptions.RequestException as e:
        logging.error("RequestException occurred: %s", str(e))
        return None
    except Exception as e:
        logging.error("Unexpected error: %s", str(e))
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


def remove_duplicates_by_action_id(interactions):

    seen = {}
    deduplicated = []

    for interaction in interactions:
        action_id = interaction["action"]["id"]
        rank = interaction["rank"]

        if action_id not in seen:
            # Add to seen and deduplicated list
            seen[action_id] = len(deduplicated)
            deduplicated.append(interaction)
        else:
            # Check and update if the current interaction has a lower rank
            existing_index = seen[action_id]
            if rank < deduplicated[existing_index]["rank"]:
                deduplicated[existing_index] = interaction

    print("deduplicated", deduplicated)

    return deduplicated
