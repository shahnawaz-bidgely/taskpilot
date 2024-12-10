import React, { useState } from 'react';
import './ReportAnalysis.css';

// Import API calls
import { 
  apiCallRecommendation, 
  apiCallItemization, 
  apiCallUserDetails, 
  apiCallEvDetails, 
  apiCallClusterDetails 
} from './api';

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

  // Handle selection changes
  const handleSelectionChange = (event) => {
    const { name, checked } = event.target;
    setSelection((prevState) => ({
      ...prevState,
      [name]: checked,
    }));
  };

  // Function to handle "DO Analysis" button click
  const handleAnalysisClick = async () => {
    setLoading(true);
    setMessage('');
    setError('');

    const apiCalls = [];

    if (selection.recommendation) {
      apiCalls.push(apiCallRecommendation());
    }

    if (selection.itemization) {
      apiCalls.push(apiCallItemization());
    }

    if (selection.userDetails) {
      apiCalls.push(apiCallUserDetails());
    }

    if (selection.evDetails) {
      apiCalls.push(apiCallEvDetails());
    }

    if (selection.clusterDetails) {
      apiCalls.push(apiCallClusterDetails());
    }

    try {
      // Execute all selected API calls in parallel
      await Promise.all(apiCalls);
      setMessage('Analysis complete! Data fetched successfully for selected sections.');
    } catch (err) {
      setError('Error occurred during analysis. Please check the console for details.');
    } finally {
      setLoading(false);
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
      </div>

      <div className="card">
        <h3>Details</h3>
        <p>Details about the analysis results will go here.</p>
      </div>

      <button className="do-analysis-btn" onClick={handleAnalysisClick} disabled={loading}>
        {loading ? 'Analyzing...' : 'DO Analysis'}
      </button>

      {message && <div className="analysis-message success">{message}</div>}
      {error && <div className="analysis-message error">{error}</div>}
    </div>
  );
}

export default ReportAnalysis;
