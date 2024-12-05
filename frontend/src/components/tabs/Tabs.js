import React, { useState, useContext } from 'react';
import './Tabs.css';
import { FileContext } from '../context/FileContext';

function Tabs({ activeTab, setActiveTab }) {
  const { setUploadedFile, setFileContent } = useContext(FileContext); // Access FileContext methods
  const tabs = ['Report Analysis', 'Revoke Email', 'TOD Analysis'];
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');

  const handleFileChange = (event) => {
    const uploadedFile = event.target.files[0];

    // Check if the file is valid
    if (uploadedFile && (uploadedFile.type === 'text/csv' || uploadedFile.type === 'text/plain')) {
      setFile(uploadedFile);
      setUploadedFile(uploadedFile); // Save to context
      setError('');
      readFileContent(uploadedFile);
    } else {
      setFile(null);
      setFileContent(''); // Clear content in context
      setError('Please upload a valid .csv or .txt file.');
      console.error('Invalid file type:', uploadedFile?.type);
    }
  };

  const readFileContent = (file) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const content = e.target.result;
      setFileContent(content); // Save content to context
      console.log('File Content in Tabs:', content); // Debug: Log content to console
    };

    reader.onerror = (e) => {
      setError('Error reading file.');
      console.error('File reading error:', e);
    };

    reader.readAsText(file);
  };

  return (
    <div>
      <div className="tabs">
        {tabs.map((tab) => (
          <div
            key={tab}
            className={`tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </div>
        ))}
      </div>
      <div className="file-upload-section">
  <h4>Upload a File</h4>
  {/* File input with custom button */}
  <label htmlFor="file-upload" className="file-upload-button">
    Choose File
  </label>
  <input
    type="file"
    id="file-upload"
    accept=".csv,.txt"
    onChange={handleFileChange}
    style={{ display: 'none' }} // Hide the default file input
  />
  
  {/* Display file details when file is selected */}
  {file ? (
    <div className="file-details">
      <p className="file-name"><strong>File Name:</strong> {file.name}</p>
      <p><strong>File Size:</strong> {(file.size / 1024).toFixed(2)} KB</p>
      <p><strong>File Type:</strong> {file.type}</p>
    </div>
  ) : (
    <p className="no-file">No file chosen</p> // Message when no file is selected
  )}

  {error && <p className="error-text">{error}</p>}
</div>
    </div>
  );
}

export default Tabs;
