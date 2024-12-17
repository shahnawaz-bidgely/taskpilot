import React, { useState, useEffect, useContext } from 'react';
import './RevokeEmail.css';
import { FileContext } from '../context/FileContext';
import DownloadCSV from '../download/DownloadCSV';
import ChatMate from '../chatmate/ChatMate'

function RevokeEmail() {
  const { uploadedFile, fileContent } = useContext(FileContext);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [userEmailDetails, setEmailDetails] = useState([]);

  const [showFilter, setShowFilter] = useState(false); // Controls filter popup visibility
  const [filterColumn, setFilterColumn] = useState(''); // The column being filtered
  const [filters, setFilters] = useState({}); // Holds all applied filters



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

//   const handlePreview = (row) => {
//   console.log("Preview data:", row);
//   // Add logic to display preview (e.g., open modal or navigate to preview page)
// };


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
      <div className='input-section'>
        <div className="card">
          <h1>Email Analysis</h1>
          
        


    <div className="form-container">
  {/* Trigger Time Input */}
  <div className="form-group">
    <input
      type="text"
      id="triggerTime"
      name="triggerTime"
      value={formData.triggerTime}
      onChange={handleChange}
      placeholder=" "
      className="form-input"
    />
    <label htmlFor="triggerTime">Trigger Time *</label>
  </div>

  {/* Event Name Dropdown */}
  <div className="form-group">
    <select
      id="eventName"
      name="eventName"
      value={formData.eventName}
      onChange={handleChange}
      className="form-select"
    >
      <option value="" disabled>Select Event Name</option>
      <option value="NEIGHBOURHOOD_COMPARISON">NEIGHBOURHOOD_COMPARISON</option>
      <option value="BILL_PROJECTION">BILL_PROJECTION</option>
      <option value="USER_WELCOME">USER_WELCOME</option>
    </select>
    <label htmlFor="eventName">Event Name *</label>
  </div>

  {/* Endpoint URL Input */}
  <div className="form-group">
    <input
      type="text"
      id="endpointUrl"
      name="endpointUrl"
      value={formData.endpointUrl}
      onChange={handleChange}
      placeholder=" "
      className="form-input"
    />
    <label htmlFor="endpointUrl">Endpoint URL *</label>
  </div>

  {/* Loader */}
  {loading && <div className="loader">Loading...</div>}

  {/* Display success or error message */}
  {message && <div className={`analysis-message ${messageStyle}`}>{message}</div>}
  {error && <div className={`analysis-message ${messageStyle}`}>{error}</div>}

  {/* Submit Button */}
  <button onClick={handleSubmit} className="submit-button">
    {loading ? 'Analyzing...' : 'Submit'}
  </button>
</div>
        </div>
        <div className="chatmate-container">
           <ChatMate />
        </div>
      </div>
      
      <div className='output-section'>
      <div className="card">
      <h2>Analysis Results</h2>
      <div className="download-buttons">
        {userEmailDetails.length > 0 && (
          <DownloadCSV data={userEmailDetails} filename="email_prev_details.csv" label="Download Email Preview Details" />
        )}
      </div>

      {userEmailDetails.length > 0 && (
  <div className="user-details-section">
    <table className="user-details-table">
      <thead>
        <tr>
          {Object.keys(userEmailDetails[0]).map((key, idx) => (
            <th
              key={idx}
              onClick={() => {
                setFilterColumn(key); // Set the current column
                setShowFilter(true); // Show the filter popup
              }}
              style={{ cursor: 'pointer' }}
              title="Click to filter this column"
            >
              {key}
            </th>
          ))}
        </tr>
      </thead>

      <tbody>
        {userEmailDetails
          .filter((row) => {
            // Apply multiple filters
            return Object.entries(filters).every(([column, value]) =>
              String(row[column]).toLowerCase().includes(value.toLowerCase())
            );
          })
          .filter((row) => row && Object.keys(row).length > 0) // Exclude empty rows
          .map((row, idx) => (
            <tr key={idx}>
              {Object.entries(row).map(([key, value], valIdx) => (
                <td
                  key={valIdx}
                  style={{
                    backgroundColor:
                      filters[key] &&
                      String(value).toLowerCase().includes(filters[key].toLowerCase())
                        ? '#ffdddd' // Highlight filtered cells
                        : 'transparent',
                  }}
                >
                  {value}
                </td>
              ))}
              <td>
                <button
                  className="preview-button"
                  onClick={() => {
                    const url = `http://127.0.0.1:5000/generate-email-view?endpoint=${encodeURIComponent(
                      formData.endpointUrl
                    )}&NotificationID=${row.NotificationID}`;
                    window.open(url, '_blank');
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

    {/* Filter Popup */}
    {showFilter && (
      <div className="filter-popup">
        <div className="filter-popup-content">
          <h3>Apply Filter</h3>
          <p className="filter-column-name">Filtering on: <strong>{filterColumn}</strong></p>
          <input
            type="text"
            placeholder={`Enter value for ${filterColumn}`}
            value={filters[filterColumn] || ''}
            onChange={(e) =>
              setFilters({ ...filters, [filterColumn]: e.target.value })
            }
            className="filter-input"
          />
          <div className="filter-popup-buttons">
            <button
              onClick={() => setShowFilter(false)}
              className="apply-filter-button"
            >
              Apply
            </button>
            <button
              onClick={() => {
                const updatedFilters = { ...filters };
                delete updatedFilters[filterColumn]; // Remove the current filter
                setFilters(updatedFilters);
                setShowFilter(false);
              }}
              className="clear-filter-button"
            >
              Clear Filter
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
)}



       </div>
      </div>

    </div>
  );
}

export default RevokeEmail;
