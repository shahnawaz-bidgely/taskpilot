import React, { useState, useEffect, useContext } from 'react';
import './RevokeEmail.css';
import { FileContext } from '../context/FileContext';
import DownloadCSV from '../download/DownloadCSV';

function RevokeEmail() {
  const { uploadedFile, fileContent } = useContext(FileContext);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [userEmailDetails, setEmailDetails] = useState([]);

  useEffect(() => {
    console.log('File Content in Revoke Updated:', fileContent);
    console.log('Uploaded File in Revoke Updated:', uploadedFile);
  }, [fileContent, uploadedFile]);

  const [formData, setFormData] = useState({
    triggerTime: '',
    eventName: '',
    endpointUrl: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handlePreview = (row) => {
  console.log("Preview data:", row);
  // Add logic to display preview (e.g., open modal or navigate to preview page)
};


  /*  API Related Code */

  const emailPreviewAPI = (uploadedFile, fileContent) => {
    return new Promise(async (resolve, reject) => {
      try {
        const combinedData = new FormData();
        combinedData.append('file', uploadedFile);
        combinedData.append('fileContent', fileContent);
        combinedData.append('triggerTime', formData.triggerTime);
        combinedData.append('eventName', formData.eventName);
        combinedData.append('endpoint', formData.endpointUrl);

        const response = await fetch('http://127.0.0.1:5000/analyze-email-preview', {
          method: 'POST',
          body: combinedData,
        });

        if (!response.ok) {
          const error = await response.json();
          reject(`Error from backend: ${error.error}`);
          return;
        }

        const fileBlob = await response.blob();
        const text = await fileBlob.text();
        const rows = text.split('\n').map((row) => row.split(','));
        const emailDetails = rows.slice(1).filter((row) => {
          // Check if all columns are empty
          return row.some((cell) => cell !== null && cell !== undefined && cell !== '');
        }).map((row) => ({
          uuid: row[0],
          ratePlanid: row[1],
          NotificationID: row[2],
          NotificationType: row[3],
          deliveryDestination: row[4],
          GenerationTimestamp: row[5],
          DateStartTimestamp: row[6],
          status: row[7],
        }));
        

        setEmailDetails(emailDetails);
        console.log("email preveiw data - ",emailDetails)
        resolve('Email Preview called successful.');
      } catch (err) {
        reject(`Error during User Details API call: ${err.message}`);
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const results = await Promise.all([emailPreviewAPI(uploadedFile, fileContent)]);
      setMessage('Analysis complete: ' + results.join(', '));
      setMessageStyle('success'); // Green message for success
    } catch (err) {
      setError('Error occurred during analysis: ' + err.message);
      setMessageStyle('error'); // Red message for error
    } finally {
      setLoading(false);
    }
  };

  const [messageStyle, setMessageStyle] = useState(''); // Used for handling success or error messages

  return (
    <div className="revoke-email">
      <div className="card">
        <h3>Email Analysis</h3>
        <div className="form-container">
          {/* Trigger Time Input */}
          <div className="form-group">
            <label htmlFor="triggerTime">Trigger Time</label>
            <input
              type="text"
              id="triggerTime"
              name="triggerTime"
              value={formData.triggerTime}
              onChange={handleChange}
              placeholder="Enter Trigger Time"
            />
          </div>

          {/* Event Name Dropdown */}
          <div className="form-group">
            <label htmlFor="eventName">Event Name</label>
            <select
              id="eventName"
              name="eventName"
              value={formData.eventName}
              onChange={handleChange}
            >
              <option value="">Select Event Name</option>
              <option value="NEIGHBOURHOOD_COMPARISON">NEIGHBOURHOOD_COMPARISON</option>
              <option value="BILL_PROJECTION">BILL_PROJECTION</option>
              <option value="USER_WELCOME">USER_WELCOME</option>
            </select>
          </div>

          {/* Environment Dropdown */}
          <div className="form-group">
            <label htmlFor="endpointUrl">Endpoint Url</label>
            <input
              type="text"
              id="endpointUrl"
              name="endpointUrl"
              value={formData.endpointUrl}
              onChange={handleChange}
              placeholder="Enter Trigger Time"
            />
          </div>

          {/* Submit Button */}
          <button onClick={handleSubmit} className="submit-button">
            {loading ? 'Analyzing...' : 'Submit'}
          </button>
        </div>
      </div>

      <div className="card">
  <h3>Analysis Results</h3>
  {/* Display loader when data is being fetched */}
  {loading && <div className="loader">Loading...</div>}

  {/* Display success or error message */}
  {message && <div className={`analysis-message ${messageStyle}`}>{message}</div>}
  {error && <div className={`analysis-message ${messageStyle}`}>{error}</div>}

  <div className="download-buttons">
    {userEmailDetails.length > 0 && (
      <DownloadCSV data={userEmailDetails} filename="user_details.csv" label="Download Email Preview Details" />
    )}
  </div>

  {userEmailDetails.length > 0 && (
    <div className="user-details-section">
      <h2>User Details Data</h2>
      <table className="user-details-table">
        <thead>
          <tr>
            {Object.keys(userEmailDetails[0]).map((key, idx) => (
              <th key={idx}>{key}</th>
            ))}
          </tr>
        </thead>

        <tbody>
          {userEmailDetails
            .filter((row) => row && Object.keys(row).length > 0) // Exclude empty rows
            .map((row, idx) => (
              <tr key={idx}>
                {Object.values(row).map((value, valIdx) => (
                  <td key={valIdx}>{value}</td>
                ))}
                <td>
                  <button
                    className="preview-button"
                    onClick={() => {
                      // Ensure `yourEndpoint` is available in your component
                      const url = `http://127.0.0.1:5000/generate-email-view?endpoint=${encodeURIComponent(formData.endpointUrl)}&NotificationID=${row.NotificationID}`;
                      window.open(url, '_blank'); // Open URL in new tab
                    }}
                    title="Preview"
                  >
                    <i className="icon-preview" /> View
                  </button>
                </td>
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

export default RevokeEmail;
