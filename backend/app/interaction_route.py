from flask import Blueprint, jsonify, request, send_file
import os
import json
import logging
from collections import OrderedDict
import pandas as pd
from requests.auth import HTTPBasicAuth
import zipfile

interaction_route = Blueprint('interaction_route', __name__)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MASTER_FILE_PATH_PROGRAM_NBI = "app/resources/master_program_nbi.json"
MASTER_FILE_PATH_TEST = "app/resources/test.json"
MASTER_FILE_PATH_MASTER_NBI = "app/resources/master_nbi_data.json"
RANK_COUNTER = 0

EXCEL_FILE = "app/resources/nbi_content_sheet_filtered.xlsx"
# SQL_FILE = "app/resources/DB_final.sql"
# SH_FILE = "app/resources/String_final.sh"
# ZIP_FILE = "app/resources/interactions_bundle.zip"


@interaction_route.route('/prep-interactions', methods=['POST'])
def update_interactions():
    fuels = request.form.get('fuelType')
    reportName = request.form.get('reportName')
    endpoint_url = "https://" + request.form.get('endpoint')
    uuid = request.form.get('uuid')
    fuels = fuels.split(",")

    # uuid = "751e298e-7e54-4bb5-a4f2-17bfd0931e61"
    # endpoint_url = "https://avistauatapi.bidgely.com"
    ACCESS_TOKEN = "56b02db5-b83c-4c5c-b75d-3b6eaee03438"
    PILOT_ID = 10046

    print(f"User Data - {fuels},{uuid}, {endpoint_url}, {ACCESS_TOKEN} {reportName}")

    season_report_name = ""
    is_season_report = False
    topAppliance = []

    if("WINTER" in reportName) :
        season_report_name = "Winter"
        is_season_report = True
        topAppliance.append(3)
    elif ("SUMMER" in reportName):
        season_report_name = "Summer"
        is_season_report = True
        topAppliance.append(4)
    else:
        season_report = "Non Seasonal"
        is_season_report = False


    try:

        if not os.path.exists(MASTER_FILE_PATH_MASTER_NBI):
            return jsonify({"error": "Master EE file not found at the specified path."}), 400

        INTERACTION_FILE_FINAL = {
            "interactions": [],
            "nbi_delivery_helper_dict": {
                "billing_info": {
                    "last_electric_billing_cycle_info": {
                        "last_billing_start": -1,
                        "last_billing_end": -1
                    },
                    "last_gas_billing_cycle_info": {
                        "last_billing_start": -1,
                        "last_billing_end": -1
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

                itemization_top_app = get_itemization_data(uuid, endpoint_url, ACCESS_TOKEN,10046, bc_start_time, bc_end_time,  endpoint_map.get(fuel), fuel.lower())
                topAppliance.extend(itemization_top_app)
                applince_set = set()
                final_app_list = []

                for app in topAppliance:
                    if app not in applince_set:
                        final_app_list.append(app)
                        applince_set.add(app)

                print("fuel", fuel, endpoint_map.get(fuel), topAppliance, final_app_list)

                if final_app_list is None:
                    print(f"Top appliance not found for fuel {fuel} with billing cycle {bc_start_time} {bc_end_time}")
                    continue
                if fuel == "ELECTRIC":
                    INTERACTION_FILE_FINAL["nbi_delivery_helper_dict"]["billing_info"]["last_electric_billing_cycle_info"]["last_billing_start"]= bc_start_time
                    INTERACTION_FILE_FINAL["nbi_delivery_helper_dict"]["billing_info"]["last_electric_billing_cycle_info"]["last_billing_end"] = bc_end_time
                else:
                    INTERACTION_FILE_FINAL["nbi_delivery_helper_dict"]["billing_info"][
                        "last_gas_billing_cycle_info"]["last_billing_start"] = bc_start_time
                    INTERACTION_FILE_FINAL["nbi_delivery_helper_dict"]["billing_info"][
                        "last_gas_billing_cycle_info"]["last_billing_end"] = bc_end_time

                prepare_generic_app_based_data(MASTER_FILE_PATH_MASTER_NBI, INTERACTION_FILE_FINAL, fuel, final_app_list, unique_nbi_set, unique_action_Set, uuid, season_report_name, is_season_report, PILOT_ID)

            else:
                print("fuel", fuel.lower(), "not found")

        print("final interaction", INTERACTION_FILE_FINAL)
        if not INTERACTION_FILE_FINAL["interactions"]:  # Check if interactions list is empty
            return jsonify({"error": "No interactions found", "success": False}), 200  # Still returning 200

            # Save the JSON interaction data
        INTERACTION_OUTPUT_PATH = f"app/resources/{uuid}_interaction.json"
        SQL_OUTPUT_PATH = f"app/resources/{uuid}_sql.sql"
        SH_OUTPUT_PATH = f"app/resources/{uuid}_sh.sh"

        with open(INTERACTION_OUTPUT_PATH, "w") as json_file:
            json.dump(INTERACTION_FILE_FINAL, json_file, indent=2)

        # Ensure `.sql` and `.sh` files exist
        if not os.path.exists(SQL_OUTPUT_PATH) or not os.path.exists(SH_OUTPUT_PATH):
            return jsonify({"error": "SQL or SH file not found.", "success": False}), 400

        # Create a ZIP file containing JSON, SQL, and SH files
        ZIP_FILE = f"app/resources/interactions_bundle.zip"

        with zipfile.ZipFile(ZIP_FILE, 'w') as zipf:
            zipf.write(INTERACTION_OUTPUT_PATH, os.path.basename(INTERACTION_OUTPUT_PATH))
            zipf.write(SQL_OUTPUT_PATH, os.path.basename(SQL_OUTPUT_PATH))
            zipf.write(SH_OUTPUT_PATH, os.path.basename(SH_OUTPUT_PATH))

        print("ZIP file created successfully:", ZIP_FILE)

        return send_file(ZIP_FILE, as_attachment=True, download_name="interactions_bundle.zip")

    except Exception as e:
        return jsonify({"error": str(e)}), 500

def prepare_generic_app_based_data(MASTER_FILE_PATH_MASTER_NBI, INTERACTION_FILE_FINAL, fuelType, final_app_list,  unique_nbi_set, unique_action_Set, uuid, season_report_name, is_season_report, PILOT_ID):
    with open(MASTER_FILE_PATH_MASTER_NBI, 'r') as f:
        master_ee_nbi_data = json.load(f)

    print(f"Processing app based actionable Reco NBI data")
    #print("current interaction = ", INTERACTION_FILE_FINAL)
    # data = remove_duplicates_by_action_id(master_ee_nbi_data)

    for interaction in master_ee_nbi_data:
        print(f"processing for appliance {interaction.get('applianceId')}")

        action = interaction.get("action")

        if interaction.get("id") in unique_nbi_set or (action and action.get("id") in unique_action_Set):
            print(
                f"Skipping interaction with id {interaction.get('id')} and action id {action.get('id') if action else 'None'}")
            continue

        # If it is a seasonal report, check for seasonal conditions
        if is_season_report and season_report_name in interaction.get("nbiType") and interaction.get(
                "fuelType") == fuelType:
            assign_rank(interaction, INTERACTION_FILE_FINAL, uuid, PILOT_ID)
            unique_nbi_set.add(interaction.get("id"))
            if action:
                unique_action_Set.add(action.get("id"))

        # If it is not a seasonal report, check for "Program" type interactions
        elif not is_season_report and interaction.get("nbiType") == "Program" and interaction.get(
                "fuelType") == fuelType:
            assign_rank(interaction, INTERACTION_FILE_FINAL, uuid, PILOT_ID)
            unique_nbi_set.add(interaction.get("id"))
            if action:
                unique_action_Set.add(action.get("id"))

        # Common condition for both cases: Top appliance check
        elif int(interaction.get("applianceId")) in final_app_list and interaction.get("fuelType") == fuelType:
            assign_rank(interaction, INTERACTION_FILE_FINAL, uuid, PILOT_ID)
            unique_nbi_set.add(interaction.get("id"))
            if action:
                unique_action_Set.add(action.get("id"))


################### Common ############################

import requests
import logging

logger = logging.getLogger(__name__)


def process_nbi_data(provided_nbi_ids, provided_insight_ids, provided_action_ids, PILOT_ID, uuid):
    try:
        if not os.path.exists(EXCEL_FILE):
            print(f"Error: File '{EXCEL_FILE}' not found.")
            return False

        # Read Excel file safely
        try:
            df = pd.read_excel(EXCEL_FILE)
        except Exception as e:
            print(f"Error reading Excel file: {e}")
            return False

        # Check if required columns exist
        required_columns = {"Interaction ID", "Insight ID", "Action ID",
                            "Action Paper Title Text (en_US)", "Insight Paper Text (en_US)",
                            "Action Paper Short Text (en_US)", "Action.res.image"}

        processed_insight_ids = set()
        if not required_columns.issubset(df.columns):
            print("Error: Required columns are missing in the Excel file.")
            return False

        # Open output files in append mode

        SQL_OUTPUT_PATH = f"app/resources/{uuid}_sql.sql"
        SH_OUTPUT_PATH = f"app/resources/{uuid}_sh.sh"

        with open(SQL_OUTPUT_PATH, "a") as sql_file, open(SH_OUTPUT_PATH, "a") as sh_file:
            processed = False  # Flag to track if any records are processed

            for _, row in df.iterrows():
                # Extract required columns
                nbi_id = str(row["Interaction ID"]).strip()
                insight_id = str(row["Insight ID"]).strip()
                action_id = str(row["Action ID"]).strip()

                # Check if all provided IDs match
                if nbi_id in provided_nbi_ids and insight_id in provided_insight_ids and action_id in provided_action_ids:
                    processed = True  # At least one record was processed

                    nbi_title = str(row["Action Paper Title Text (en_US)"]).strip().replace("\n", " ").replace("'",
                                                                                                               "\\u0027")
                    insight_text = str(row["Insight Paper Text (en_US)"]).strip().replace("\n", " ").replace("'",
                                                                                                             "\\u0027")
                    nbi_long_text = str(row["Action Paper Short Text (en_US)"]).strip().replace("\n", " ").replace("'",
                                                                                                                   "\\u0027")
                    nbi_short_text = str(row["Action Paper Short Text (en_US)"]).strip().replace("\n", " ").replace("'",
                                                                                                                    "\\u0027")
                    circle_icon = str(row["Action.res.image"]).strip().replace("\n", " ").replace("'", "\\u0027")
                    rectangle_icon = str(row["Action.res.image"]).strip().replace("\n", " ").replace("'", "\\u0027")

                    # Generate SQL Insert statements
                    sql_statements = [
                        f'INSERT INTO nbi_asset_data (entity_id, asset_id, asset_key, asset_value, asset_value_type, asset_type) VALUES ("{PILOT_ID}", "{nbi_id}", "title", "com.bidgely.cloud.core.lib.paper.nbi.{nbi_id}.title", "STRING_RESOURCE","PAPER_NBI");',
                        f'INSERT INTO nbi_asset_data (entity_id, asset_id, asset_key, asset_value, asset_value_type, asset_type) VALUES ("{PILOT_ID}", "{nbi_id}", "shortText", "com.bidgely.cloud.core.lib.paper.nbi.{nbi_id}.shortText", "STRING_RESOURCE","PAPER_NBI");',
                        f'INSERT INTO nbi_asset_data (entity_id, asset_id, asset_key, asset_value, asset_value_type, asset_type) VALUES ("{PILOT_ID}", "{nbi_id}", "longText", "com.bidgely.cloud.core.lib.paper.nbi.{nbi_id}.longText", "STRING_RESOURCE","PAPER_NBI");',
                        f'INSERT INTO nbi_asset_data (entity_id, asset_id, asset_key, asset_value, asset_value_type, asset_type) VALUES ("{PILOT_ID}", "{nbi_id}", "circleIcon", "{circle_icon}", "IMAGE","PAPER_NBI");',
                        f'INSERT INTO nbi_asset_data (entity_id, asset_id, asset_key, asset_value, asset_value_type, asset_type) VALUES ("{PILOT_ID}", "{nbi_id}", "rectangleIcon", "{rectangle_icon}", "IMAGE","PAPER_NBI");'
                    ]


                    # Write to SQL file
                    sql_file.write("\n".join(sql_statements) + "\n")
                    if insight_id not in processed_insight_ids:
                        sql_file.write(
                            f'INSERT INTO nbi_asset_data (entity_id, asset_id, asset_key, asset_value, asset_value_type, asset_type) '
                            f'VALUES ("{PILOT_ID}", "{insight_id}", "insightText", "com.bidgely.cloud.core.lib.paper.nbi.{insight_id}.insightText", "STRING_RESOURCE", "PAPER_NBI");\n'
                        )
                        print(f"adding insight sql statement for {insight_id}")
                        processed_insight_ids.add(insight_id)
                    else:
                        print(f"Skipping duplicate insight ID: {insight_id}")

                    # Generate and write SH file content
                    sh_statements = [
                        f' echo `curl -X PUT -H "Authorization: Bearer $2" -H "Content-Type: application/json" $1/2.1/stringResources/{PILOT_ID}/resource/com.bidgely.cloud.core.lib.paper.nbi.{nbi_id}.title -d \'[{{ "locale": "en_US","text": "{nbi_title}","tags": "her_ui,LP_COMPONENT_HER"}}]\'`',
                        f' echo `curl -X PUT -H "Authorization: Bearer $2" -H "Content-Type: application/json" $1/2.1/stringResources/{PILOT_ID}/resource/com.bidgely.cloud.core.lib.paper.nbi.{nbi_id}.shortText -d \'[{{ "locale": "en_US","text": "{nbi_short_text}","tags": "her_ui,LP_COMPONENT_HER"}}]\'`',
                        f' echo `curl -X PUT -H "Authorization: Bearer $2" -H "Content-Type: application/json" $1/2.1/stringResources/{PILOT_ID}/resource/com.bidgely.cloud.core.lib.paper.nbi.{nbi_id}.longText -d \'[{{ "locale": "en_US","text": "{nbi_long_text}","tags": "her_ui,LP_COMPONENT_HER"}}]\'`',
                        f' echo `curl -X PUT -H "Authorization: Bearer $2" -H "Content-Type: application/json" $1/2.1/stringResources/{PILOT_ID}/resource/com.bidgely.cloud.core.lib.paper.nbi.{insight_id}.insightText -d \'[{{ "locale": "en_US","text": "{insight_text}","tags": "her_ui,LP_COMPONENT_HER"}}]\'`'
                    ]

                    sh_file.write("\n".join(sh_statements) + "\n")

                    print(f"Processed: {nbi_id}, {insight_id}, {action_id}")

            if not processed:
                print("No matching records found for the given IDs.")
                return False

        return True  # Successfully processed at least one record

    except Exception as e:
        print(f"Unexpected error: {e}")
        return False


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


def assign_rank(interaction, INTERACTION_FILE_FINAL, uuid, PILOT_ID):
    global RANK_COUNTER

    status  = process_nbi_data(interaction.get("id"), interaction.get("insight").get("id"), interaction.get("action").get("id"), PILOT_ID, uuid)

    if status:
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
