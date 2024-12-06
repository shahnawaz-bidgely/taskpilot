import React from 'react';
import { saveAs } from 'file-saver';
import './DownloadCSV.css';

const DownloadCSV = ({ data, filename, label }) => {
  // Function to handle CSV download
  const downloadCSV = () => {
    // Prepare the CSV content
    const rows = [
      Object.keys(data[0]), // Headers
      ...data.map(item => Object.values(item)), // Data rows
    ];

    // Convert rows into CSV string
    const csvContent = rows.map(row => row.join(',')).join('\n');

    // Create a Blob from the CSV content and trigger the download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    saveAs(blob, filename);
  };

  return (
    <button onClick={downloadCSV} className="download-btn">
      <i className="fas fa-download"></i> {label}
    </button>
  );
};

export default DownloadCSV;
