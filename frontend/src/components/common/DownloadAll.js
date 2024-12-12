import { saveAs } from 'file-saver';

export const downloadAll = (userDetails, clusterDetails) => {
  // Helper function to convert data to CSV and download
  const downloadCSV = (data, filename) => {
    const rows = [
      Object.keys(data[0]), // Headers
      ...data.map(row => Object.values(row)), // Data rows
    ];

    // Convert rows to CSV string
    const csvContent = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    saveAs(blob, filename);
  };

  // Download User Details CSV
  if (userDetails.length > 0) {
    downloadCSV(userDetails, 'user_details.csv');
  }

  // Download Cluster Details CSV
  if (clusterDetails.length > 0) {
    downloadCSV(clusterDetails, 'cluster_details.csv');
  }
};
