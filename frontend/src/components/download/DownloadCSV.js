// DownloadCSV.js
import React from 'react';
import { saveAs } from 'file-saver';
import './DownloadCSV.css';

const DownloadCSV = ({ userDetails }) => {
  // Function to handle CSV download
  const downloadCSV = () => {
    // Prepare the CSV content
    const rows = [
      Object.keys(userDetails[0]), // Headers
      ...userDetails.map(user => Object.values(user)), // Data rows
    ];

    // Convert rows into CSV string
    const csvContent = rows.map(row => row.join(',')).join('\n');

    // Create a Blob from the CSV content and trigger the download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    saveAs(blob, 'user_details.csv');
  };

  return (
    <button onClick={downloadCSV} className="download-btn">
      <i className="fas fa-download"></i> Download CSV
    </button>
  );
};

export default DownloadCSV;
