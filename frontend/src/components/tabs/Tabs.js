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
        <h4>Upload a File (.csv or .txt)</h4>
        <input type="file" accept=".csv,.txt" onChange={handleFileChange} />
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {file && (
          <div>
            <p><strong>File Name:</strong> {file.name}</p>
            <p><strong>File Size:</strong> {(file.size / 1024).toFixed(2)} KB</p>
            <p><strong>File Type:</strong> {file.type}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Tabs;
