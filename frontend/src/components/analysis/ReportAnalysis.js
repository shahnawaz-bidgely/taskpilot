import React, { useState, useEffect, useContext } from 'react';
import Switch from 'react-switch'; 
import './ReportAnalysis.css';
import DownloadCSV from '../download/DownloadCSV';
import { downloadAll } from '../common/DownloadAll';
import { FileContext } from '../context/FileContext';


function ReportAnalysis() {
  const [selection, setSelection] = useState({
    recommendation: false,
    itemization: false,
    userDetails: false,
    evDetails: false,
    clusterDetails: false,
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [userDetails, setUserDetails] = useState([]);
  const [clusterDetails, seClusterDetails] = useState([]);
  const [toggleValue, setToggleValue] = useState('API'); // default to API

  const { uploadedFile, fileContent } = useContext(FileContext);

  useEffect(() => {
    console.log('userDetails state has been updated:', userDetails);
    console.log('File Content in ReportAnalysis Updated:', fileContent);
    console.log('Uploaded File in ReportAnalysis Updated:', uploadedFile);
  }, [fileContent, uploadedFile,userDetails,clusterDetails]);


  
  const handleSelectionChange = (event) => {
    const { name, checked } = event.target;
    setSelection((prevState) => ({
      ...prevState,
      [name]: checked,
    }));
  };
  // Toggle between API and Redshift
  const handleToggleChange = (checked) => {
    const newValue = checked ? 'Redshift' : 'API';
    setToggleValue(newValue);
  };

  // API-Calss related functions
  const callRecommendationApi = () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve('RECOMMENDATION API call successful');
      }, 1000);
    });
  };

  const callItemizationApi = () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve('ITEMIZATION API call successful');
      }, 1000);
    });
  };

  const callEvDetailsApi = () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve('EV DETAILS API call successful');
      }, 1000);
    });
  };

  const callClusterDetailsApi = (file) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve('CLUSTER DETAILS API call successful');
      }, 1000);
    });
  };

  const callUserDetailsApi = (uploadedFile, fileContent) => {
    return new Promise(async (resolve, reject) => {
      try {
        const formData = new FormData();
        formData.append('file', uploadedFile);
        formData.append('content', fileContent);

        const response = await fetch('http://127.0.0.1:5000/analyze-users', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          reject(`Error from backend: ${error.error}`);
          return;
        }

        const fileBlob = await response.blob();
        const text = await fileBlob.text();
        const rows = text.split('\n').map((row) => row.split(','));
        const newUserDetails = rows.slice(1).map((row) => ({
          uuid: row[0],
          accountId: row[1],
          firstName: row[2],
          lastName: row[3],
          status: row[4],
          ratePlanId: row[5],
          notificationUserType: row[6],
          hasSolar: row[7],
        }));

        setUserDetails(newUserDetails);
        resolve('USER DETAILS API call successful.');
      } catch (err) {
        reject(`Error during User Details API call: ${err.message}`);
      }
    });
  };

  const handleApiAnalysis = async () => {
    const isApiSelected = Object.values(selection).some((value) => value);
    if (!isApiSelected) {
      setError('Please select at least one API for analysis.');
      setLoading(false);
      return;
    }
    console.log("File content",fileContent)

    if (!fileContent) {
      setError('Please upload a non-empty .csv or .txt file.');
      setLoading(false);
      return;
    }

    const apiCalls = [];
    if (selection.recommendation) apiCalls.push(callRecommendationApi());
    if (selection.itemization) apiCalls.push(callItemizationApi());
    if (selection.userDetails) apiCalls.push(callUserDetailsApi(uploadedFile, fileContent));
    if (selection.evDetails) apiCalls.push(callEvDetailsApi());
    if (selection.clusterDetails) apiCalls.push(callClusterDetailsApi(uploadedFile));

    try {
      const results = await Promise.all(apiCalls);
      setMessage('Analysis complete: ' + results.join(', '));
    } catch (err) {
      setError('Error occurred during analysis: ' + err.message);
    } finally {
      setLoading(false);
    }
  };






  // Redhsift Related API calls

  const callUserDetailsRedshift = async (uploadedFile, fileContent) => {
    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);
      formData.append('content', fileContent);
  
      const response = await fetch('http://127.0.0.1:5000/analyze-users-redshift', {
        method: 'POST',
        body: formData,
      });
  
      if (!response.ok) {
        throw new Error('Failed to fetch data from Redshift');
      }
  
      const fileBlob = await response.blob();
      const text = await fileBlob.text();
      const rows = text.split('\n').map((row) => row.split(','));
      const newUserDetails = rows.slice(1).map((row) => ({
        uuid: row[0],
        partner_user_id: row[1],
        is_solar_user: row[2],
        pilot_id: row[3],
        notification_user_type: row[4],
        user_status: row[5],
      }));
  
      setUserDetails(newUserDetails);
      setMessage('Redshift analysis complete.');
      console.log('Query results:', newUserDetails);
    } catch (err) {
      setError('Error connecting to Redshift or executing query: ' + err.message);
      throw err; // Re-throw the error to allow it to be caught in Promise.all
    }
  };
  

  const callClusterDetailsRedshift = async (uploadedFile, fileContent) => {
    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);
      formData.append('content', fileContent);
  
      const response = await fetch('http://127.0.0.1:5000/analyze-cluster-redshift', {
        method: 'POST',
        body: formData,
      });
  
      if (!response.ok) {
        throw new Error('Failed to fetch data from Redshift');
      }
  
      const fileBlob = await response.blob();
      const text = await fileBlob.text();
      const rows = text.split('\n').map((row) => row.split(','));
      const clusterDetails = rows.slice(1).map((row) => ({
        uuid: row[0],
        cluster_id: row[1],
        pilot_id: row[2],
        update_type: row[3],
        last_updated_timestamp: row[4],
      }));
  
      seClusterDetails(clusterDetails);
      setMessage('Redshift analysis complete.');
      console.log('Query results:', clusterDetails);
    } catch (err) {
      setError('Error connecting to Redshift or executing query: ' + err.message);
      throw err; // Re-throw the error to allow it to be caught in Promise.all
    }
  };
  

  const handleRedshiftAnalysis = async () => {
    setLoading(true);
    setMessage('');
    setError('');

    const apiCallsRedshift = []
    if (selection.userDetails) {
        apiCallsRedshift.push(callUserDetailsRedshift(uploadedFile, fileContent));
    }

    if (selection.clusterDetails) {
        apiCallsRedshift.push(callClusterDetailsRedshift(uploadedFile, fileContent));
    }

      

    Promise.all(apiCallsRedshift)
        .then(() => {
          console.log('All API calls completed successfully.');
          setLoading(false)
        })
        .catch((error) => {
          console.error('One or more API calls failed:', error);
        });
  };



  const handleAnalysisClick = async () => {
    setLoading(true);
    setMessage('');
    setError('');

    if (toggleValue === 'API') {
      await handleApiAnalysis(); // Call the API analysis function
    } else {
      handleRedshiftAnalysis(); // Call the Redshift-specific function
    }
  };

  return (
    <div className="report-analysis">
      <h2>Report Analysis</h2>

      {/* Toggle Section */}
      <div className="toggle-container">
        <span className="toggle-label">API</span>
        <Switch
          checked={toggleValue === 'Redshift'}
          onChange={handleToggleChange}
          onColor="#4caf50"
          offColor="#f44336"
          checkedIcon={<div style={{ padding: '5px', color: 'white' }}>Redshift</div>}
          uncheckedIcon={<div style={{ padding: '5px', color: 'white' }}>API</div>}
        />
        <span className="toggle-label">Redshift</span>
      </div>

      <div className="card">
        <h3>Select Components</h3>
        <div className="selection-container">
          {Object.keys(selection).map((key) => (
            <div className="selection-option" key={key}>
              <input
                type="checkbox"
                id={key}
                name={key}
                checked={selection[key]}
                onChange={handleSelectionChange}
              />
              <label htmlFor={key}>{key.toUpperCase()}</label>
            </div>
          ))}
        </div>
        <button className="do-analysis-btn" onClick={handleAnalysisClick} disabled={loading}>
          {loading ? 'Analyzing...' : 'DO Analysis'}
        </button>
        {message && <div className="analysis-message success">{message}</div>}
        {error && <div className="analysis-message error">{error}</div>}
      </div>

    <div className="card">
  <h3>Analysis Results</h3>

  {/* Download Buttons */}
  <div className="download-buttons">
     {userDetails.length > 0 && clusterDetails.length > 0 && (
        <button onClick={() => downloadAll(userDetails, clusterDetails)} className="download-btn">
        <i className="fas fa-download"></i> Download All
      </button>
     )}
    {userDetails.length > 0 && (
       <DownloadCSV data={userDetails} filename="user_details.csv" label="Download User Details" />
   )}
   {clusterDetails.length > 0 && (
       <DownloadCSV data={clusterDetails} filename="cluster_details.csv" label="Download Cluster Details" />
    )}

  </div>

  {/* User Details Section */}
  {userDetails.length > 0 && (
    <div className="user-details-section">
      <h2>User Details Data</h2>
      <table className="user-details-table">
        <thead>
          <tr>{Object.keys(userDetails[0]).map((key, idx) => <th key={idx}>{key}</th>)}</tr>
        </thead>
        <tbody>
          {userDetails.map((row, idx) => (
            <tr key={idx}>
              {Object.values(row).map((value, valIdx) => (
                <td key={valIdx}>{value}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )}

  {/* Cluster Details Section */}
  {clusterDetails.length > 0 && (
    <div className="cluster-details-section">
      <h2>Cluster Details Data</h2>
      <table className="cluster-details-table">
        <thead>
          <tr>{Object.keys(clusterDetails[0]).map((key, idx) => <th key={idx}>{key}</th>)}</tr>
        </thead>
        <tbody>
          {clusterDetails.map((row, idx) => (
            <tr key={idx}>
              {Object.values(row).map((value, valIdx) => (
                <td key={valIdx}>{value}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )}
</div>

    </div>
  );
}

export default ReportAnalysis;
