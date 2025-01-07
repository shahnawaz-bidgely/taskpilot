import React, { useState, useEffect, useContext } from 'react';
// import DownloadCSV from '../download/DownloadCSV';
// import { downloadAll } from '../common/DownloadAll';
import { FileContext } from '../../context/FileContext'

import "./ValidationPaper.css"; // Import CSS for styling

const ValidationPaper = () => {
  const { uploadedFile, fileContent } = useContext(FileContext);
  const [error, setError] = useState('');
  const [messageStyle, setMessageStyle] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({
    fuelType: '',
    reportName: '',
    endpointUrl: ''
  });


  useEffect(() => {
    console.log('File Content in ReportAnalysis Updated:', fileContent);
    console.log('Uploaded File in ReportAnalysis Updated:', uploadedFile);
  }, [fileContent, uploadedFile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };


  const handleValidate = async () => {
    try {
   

    const combinedData = new FormData();
    combinedData.append('file', uploadedFile);
    combinedData.append('fileContent', fileContent);
    combinedData.append('fuelType', formData.fuelType);
    combinedData.append('reportName', formData.reportName);
    combinedData.append('endpoint', formData.endpointUrl);
  
    const response = await fetch('http://127.0.0.1:5000/her-sections-validations', {
        method: 'POST',
        body: combinedData,
      });

      console.log(response)
  
      if (!response.ok) {
        throw new Error('Failed to fetch data of HER validation');
      }
  
      // const fileBlob = await response.blob();
      // const text = await fileBlob.text();
      // const rows = text.split('\n').map((row) => row.split(','));
      // const newUserDetails = rows.slice(1).filter((row) => {
      //   // Check if all columns are empty
      //   return row.some((cell) => cell !== null && cell !== undefined && cell !== '');
      // })
      // .map((row) => ({
      //   uuid: row[0],
      //   partner_user_id: row[1],
      //   is_solar_user: row[2],
      //   pilot_id: row[3],
      //   notification_user_type: row[4],
      //   user_status: row[5],
      // }));
  
     
      // setMessage('Redshift analysis complete.');
      // console.log('Query results:', newUserDetails);
    } catch (err) {
      setError('Error connecting to Redshift or executing query: ' + err.message);
      throw err; // Re-throw the error to allow it to be caught in Promise.all
    }
  };



  // Mock Data
  const validations = [
    {
      username: "8ddb5a00-5ebf-42b1-89ad-b76ea731b7fc",
      sections: {
        HEADER: {
          failure: ["Username does not exist",
            "Utility address does not exist"]
          
        },
        SHC_GRAPH_AND_WIDGET: {
          failure: []
        },
        ITEMIZATION_SHC: {
          failure: []
        },
        ITEMIZATION: {
          failure: []
        },
        PROGRAM_NBI: {
          failure: []
        },
        EE_NBI: {
          failure: []
        },
        QR_CODE: {
          failure: []
        },
        FOOTER: {
          failure: [],
        },
      },
    },
    {
      username: "caf51017-c6b9-4ab8-b218-291a2a923c05",
      sections: {
        HEADER: {
          failure: []
        },
        SHC_GRAPH_AND_WIDGET: {
          failure: []
        },
        ITEMIZATION_SHC: {
          failure: []
        },
        ITEMIZATION: {
          failure: []
        },
        PROGRAM_NBI: {
          failure: []
        },
        EE_NBI: {
          failure: {
            "failure1" : "test failure",
            "failure2" : "test failure2"
          }
        },
        QR_CODE: {
          failure: {
            "QR Code" : "QR code is missing"
          }
        },
        FOOTER: {
          failure: [],
        },
      },
    },
    {
      username: "df79f2b6-3c1d-442e-b65c-1f526b40117d",
      sections: {
        HEADER: {
          failure: []
        },
        SHC_GRAPH_AND_WIDGET: {
          failure: []
        },
        ITEMIZATION_SHC: {
          failure: []
        },
        ITEMIZATION: {
          failure: []
        },
        PROGRAM_NBI: {
          failure: []
        },
        EE_NBI: {
          failure: []
        },
        QR_CODE: {
          failure: []
        },
        FOOTER: {
          failure: [],
        },
      },
    },
  ];

  // State to track the expanded user details
  const [expandedUser, setExpandedUser] = useState(null);

  const toggleUserDetails = (userIndex) => {
    setExpandedUser(expandedUser === userIndex ? null : userIndex);
  };

  // Function to count passed and failed sections
  const countSectionStatus = (sections) => {
    let passed = 0;
    let failed = 0;
    Object.values(sections).forEach((section) => {
      if (section.failure && Object.keys(section.failure).length > 0) {
        failed++;
      } else {
        passed++;
      }
    });
    return { passed, failed };
  };

  return (
    <div className="validation-paper">
      {/* <h1>Validation Dashboard</h1> */}



  <div className="form-container">
  {/* Trigger Time Input */}
  <div className="form-group">
    <select
      id="fuelType"
      name="fuelType"
      value={formData.fuelType}
      onChange={handleChange}
      className="form-select"
    >
      <option value="" disabled>select HER fuel type</option>
      <option value="ELECTRIC">ELECTRIC</option>
      <option value="GAS">GAS</option>
      <option value="ELECTRIC, GAS">ELECTRIC, GAS (for DF HER)</option>
    </select>
    <label htmlFor="fuelType">Fuel Type*</label>
  </div>

  {/* Event Name Dropdown */}
  <div className="form-group">
    <select
      id="reportName"
      name="reportName"
      value={formData.reportName}
      onChange={handleChange}
      className="form-select"
    >
      <option value="" disabled>select PDF report type</option>
      <option value="HER_MONTHLY_REPORT">HER_MONTHLY_REPORT</option>
      <option value="HER_SEASONAL_WINTER">HER_SEASONAL_WINTER</option>
      <option value="HER_SEASONAL_SUMMER">HER_SEASONAL_SUMMER</option>
      <option value="DFHER_MONTHLY_REPORT">DFHER_MONTHLY_REPORT</option>
    </select>
    <label htmlFor="reportName">Report Type*</label>
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
  <button onClick={handleValidate} className="submit-button">
    {loading ? 'Analyzing...' : 'Validate Report'}
  </button>
      
  </div>

















      {validations.length === 0 ? (
        <p className="no-data-message">No validation data available.</p>
      ) : (
        <div className="users-container">
          {validations.map((user, userIndex) => {
            const { passed, failed } = countSectionStatus(user.sections);
            return (
              <div key={userIndex} className="user-card">
                <div className="user-summary" onClick={() => toggleUserDetails(userIndex)}>
                  <h2 className="user-title">{user.username}</h2>
                  <p className="status-summary">Sections Passed: {passed}, Failed: {failed}</p>
                </div>
                {expandedUser === userIndex && (
                  <div className="sections-container">
                    {Object.entries(user.sections).map(([sectionName, sectionData]) => (
                      <div
                        key={sectionName}
                        className={`section-card ${
                          sectionData.failure && Object.keys(sectionData.failure).length > 0
                            ? "section-failed"
                            : "section-passed"
                        }`}
                      >
                        <h3>{sectionName.toUpperCase()}</h3>
                        {sectionData.failure && Object.keys(sectionData.failure).length > 0 ? (
                          <ul className="failure-list" style={{ listStyleType: "none", paddingLeft: 0 }}>
                            {Object.entries(sectionData.failure).map(([key, message], idx) => (
                              <li key={idx} className="failure-item">
                                <strong>{key}</strong>: {message}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="success-message">All validations passed!</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ValidationPaper;

