// FileUpload.js
import React from 'react';
import './FileUpload.css'; // Optional: Create this file for styles



function FileUpload({ onFileUpload, error }) {
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result.trim(); // Read file content
        if (content) {
          onFileUpload(file, content); // Pass file and content back to parent
        } else {
          onFileUpload(null, null); // Clear file and content on empty upload
        }
      };
      reader.readAsText(file); // Read as text
    } else {
      onFileUpload(null, null); // Clear file and content on no file selected
    }
  };

  return (
    <div className="upload-section">
      <label htmlFor="userSetUpload">Upload User Set:</label>
      <input
        type="file"
        id="userSetUpload"
        name="userSetUpload"
        accept=".csv, .txt"
        onChange={handleFileUpload}
      />
      {error && <div className="error-message">{error}</div>}
    </div>
  );
}

export default FileUpload;
