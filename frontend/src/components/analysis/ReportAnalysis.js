import React, { useState, useEffect } from 'react';

import './ReportAnalysis.css';
import DownloadCSV from '../download/DownloadCSV'

function ReportAnalysis() {
  const [selection, setSelection] = useState({
    recommendation: false,
    itemization: false,
    userDetails: false,
    evDetails: false,
    clusterDetails: false,
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [fileContent, setFileContent] = useState(null);
  const [userDetails, setUserDetails] = useState([]); 

  useEffect(() => {
    console.log("userDetails state has been updated:", userDetails);
  }, [userDetails]); // This will run every time userDetails changes

  // Handle selection changes
  const handleSelectionChange = (event) => {
    const { name, checked } = event.target;
    setSelection((prevState) => ({
      ...prevState,
      [name]: checked,
    }));
  };

  // Function to simulate an API call
  const callRecommendationApi = () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve('RECOMMENDATION API call successful');
      }, 1000); // 1 second delay
    });
  };

  const callItemizationApi = () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve('ITEMIZATION API call successful');
      }, 1000); // 1 second delay
    });
  };

  const callEvDetailsApi = () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve('EV DETAILS API call successful');
      }, 1000); // 1 second delay
    });
  };

  const callClusterDetailsApi = (file) => {

  };

  const callUserDetailsApi = (uploadedFile,fileContent) => {
    return new Promise(async (resolve, reject) => {
      if (!uploadedFile) {
        reject('No file uploaded for User Details analysis.');
        return;
      }

      try {
        const formData = new FormData();
        formData.append('file', uploadedFile); // Append the file
        formData.append('content', fileContent);

        // if (fileContent) {
        //     formData.append('content', fileContent);
        //     //console.log("Appended content:", fileContent);
        //   } else {
        //     console.log("No content to append.");
        //   }

        // for (let [key, value] of formData.entries()) {
        //     console.log('hello', `${key}:`, value); // This will now log each entry in the FormData object
        //   }


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
        const text = await fileBlob.text(); // Convert Blob to text (CSV content)
        const rows = text.split("\n").map((row) => row.split(","));
        const newUserDetails = rows.slice(1).map((row) => ({
            uuid: row[0], // Assuming the first column is 'uuid'
            accountId: row[1], // Assuming the second column is 'accountId'
            firstName: row[2], // Assuming the third column is 'firstName'
            lastName: row[3], // Assuming the fourth column is 'lastName'
            status: row[4], // Assuming the fifth column is 'status'
            ratePlanId: row[5], // Assuming the sixth column is 'ratePlanId'
            notificationUserType: row[6], // Assuming the seventh column is 'notificationUserType'
            hasSolar: row[7], // Assuming the eighth column is 'hasSolar'
          }));
          
  
        // Log to verify data before updating state
        console.log("New user details:", newUserDetails);
  
        // Update the state with the new user details
        setUserDetails(newUserDetails);
  


        resolve("USER DETAILS API call successful. Data rendered below.");




      } catch (err) {
        reject(`Error during User Details API call: ${err.message}`);
      }
    });
  };


  const handleAnalysisClick = async () => {
    setLoading(true);
    setMessage('');
    setError('');
    const isApiSelected = Object.values(selection).some((value) => value);
    if (!isApiSelected) {
      setError("Please select at least one API for analysis.");
      setLoading(false);
      return;
    }


    if (!fileContent) {
        setError("Please upload a non-empty .csv or .txt file.");
        setLoading(false);
        return;
    }

    const apiCalls = [];

    if (selection.recommendation) {
      apiCalls.push(callRecommendationApi());
    }

    if (selection.itemization) {
      apiCalls.push(callItemizationApi());
    }

    if (selection.userDetails) {
      apiCalls.push(callUserDetailsApi(uploadedFile,fileContent));
    }

    if (selection.evDetails) {
      apiCalls.push(callEvDetailsApi());
    }

    if (selection.clusterDetails) {
      apiCalls.push(callClusterDetailsApi(uploadedFile));
    }

    try {
      // Execute all selected API calls in parallel
      const results = await Promise.all(apiCalls);
      setMessage('Analysis complete: ' + results.join(', '));
    } catch (err) {
      setError('Error occurred during analysis: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    // console.log("file data", file)
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result.trim(); // Read file content
        if (content) {
          setUploadedFile(file);
          setFileContent(content);
        //   console.log("File content:", content);
        } else {
          setUploadedFile(null);
          setFileContent(null);
          setError("The uploaded file is empty.");
        }
      };
      reader.readAsText(file); // Read as text
    } else {
      setUploadedFile(null);
      setFileContent(null);
    }
  };


  
  return (
    <div className="report-analysis">
      <h2>Report Analysis</h2>

      <div className="card">
        <h3>Select Components</h3>
        <div className="selection-container">
          <div className="selection-option">
            <input
              type="checkbox"
              id="recommendation"
              name="recommendation"
              checked={selection.recommendation}
              onChange={handleSelectionChange}
            />
            <label htmlFor="recommendation">RECOMMENDATION</label>
          </div>
          <div className="selection-option">
            <input
              type="checkbox"
              id="itemization"
              name="itemization"
              checked={selection.itemization}
              onChange={handleSelectionChange}
            />
            <label htmlFor="itemization">ITEMIZATION</label>
          </div>
          <div className="selection-option">
            <input
              type="checkbox"
              id="userDetails"
              name="userDetails"
              checked={selection.userDetails}
              onChange={handleSelectionChange}
            />
            <label htmlFor="userDetails">USER DETAILS</label>
          </div>
          <div className="selection-option">
            <input
              type="checkbox"
              id="evDetails"
              name="evDetails"
              checked={selection.evDetails}
              onChange={handleSelectionChange}
            />
            <label htmlFor="evDetails">EV DETAILS</label>
          </div>
          <div className="selection-option">
            <input
              type="checkbox"
              id="clusterDetails"
              name="clusterDetails"
              checked={selection.clusterDetails}
              onChange={handleSelectionChange}
            />
            <label htmlFor="clusterDetails">CLUSTER DETAILS</label>
          </div>
        </div>

        {/* File upload section */}
      <div className="upload-section">
        <label htmlFor="userSetUpload">Upload User Set:</label>
        <input
          type="file"
          id="userSetUpload"
          name="userSetUpload"
          accept=".csv, .txt"
          onChange={handleFileUpload}
        />
      </div>

        <button className="do-analysis-btn" onClick={handleAnalysisClick} disabled={loading}>
        {loading ? 'Analyzing...' : 'DO Analysis'}
      </button>

      {message && <div className="analysis-message success">{message}</div>}
      {error && <div className="analysis-message error">{error}</div>}
      </div>
      <div className="card">
  <h3>Analysis Results</h3>
  {userDetails.length > 0 && (
        <DownloadCSV userDetails={userDetails} /> // Pass data to DownloadCSV component
     )}

  {userDetails.length > 0 ? (
    <>
      {/* Header row that contains column headers */}
      <div className="user-details-header">
        {Object.keys(userDetails[0]).map((header, idx) => (
          <div key={idx} className="user-details-header-item">
            {header}
          </div>
        ))}
      </div>

      {/* Rows of user data */}
      <div className="user-details-data">
        {userDetails.map((row, rowIdx) => (
          <div key={rowIdx} className="user-details-row">
            {Object.values(row).map((value, idx) => (
              <div key={idx} className="user-details-data-item">
                {value}
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  ) : (
    <p>No user details to display.</p>
  )}
</div>


    </div>
  );
}

export default ReportAnalysis;
