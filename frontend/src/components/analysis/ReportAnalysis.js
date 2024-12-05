import React, { useState, useEffect, useContext } from 'react';
import Switch from 'react-switch'; 
import './ReportAnalysis.css';
import DownloadCSV from '../download/DownloadCSV';
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
  const [toggleValue, setToggleValue] = useState('API'); // default to API

  const { uploadedFile, fileContent } = useContext(FileContext);

  useEffect(() => {
    console.log('userDetails state has been updated:', userDetails);
    console.log('File Content in ReportAnalysis Updated:', fileContent);
    console.log('Uploaded File in ReportAnalysis Updated:', uploadedFile);
  }, [fileContent, uploadedFile,userDetails]);


  
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

  // API-related functions
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

  // Handle the analysis for API
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

  // Handle the analysis for Redshift
  const handleRedshiftAnalysis = async () => {
    setLoading(true);
    setMessage('');
    setError('');
  
    try {
      const response = await fetch('http://127.0.0.1:5000/execute-redshift-query'); // Backend API call
      if (!response.ok) {
        throw new Error('Failed to fetch data from Redshift');
      }
  
      const data = await response.json();  // The query result from the backend
      setMessage('Redshift analysis complete.');
      console.log('Query results:', data);  // Log the data or use it as required
    } catch (err) {
      setError('Error connecting to Redshift or executing query: ' + err.message);
    } finally {
      setLoading(false);
    }
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
        {userDetails.length > 0 && <DownloadCSV userDetails={userDetails} />}
        {userDetails.length > 0 ? (
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
        ) : (
          <p>No Details to display.</p>
        )}
      </div>
    </div>
  );
}

export default ReportAnalysis;
