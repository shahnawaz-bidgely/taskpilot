from flask import Blueprint, jsonify, request
import os
import pandas as pd
from requests.auth import HTTPBasicAuth
import requests
from tempfile import NamedTemporaryFile
import json
from concurrent.futures import ThreadPoolExecutor, as_completed
import logging

interaction_route = Blueprint('interaction_route', __name__)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


