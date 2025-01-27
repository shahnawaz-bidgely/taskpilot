import React, { useState, useEffect, useContext } from "react";
import { FileContext } from "../../context/FileContext";
import "./ValidationPaper.css";

const ValidationPaper = () => {
  const { uploadedFile, fileContent } = useContext(FileContext);
  const [error, setError] = useState("");
  const [messageStyle, setMessageStyle] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [validations, setValidation] = useState([]);
  const [formData, setFormData] = useState({
    fuelType: "",
    reportName: "",
    endpointUrl: "",
  });

  useEffect(() => {
    console.log("File Content in ReportAnalysis Updated:", fileContent);
    console.log("Uploaded File in ReportAnalysis Updated:", uploadedFile);
  }, [fileContent, uploadedFile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const getInteractions = async (user) => {
    try {
      console.log("Row data:", user.username);
      console.log("Form data:", formData.endpointUrl);

      const combinedData = new FormData();

      combinedData.append("fuelType", formData.fuelType);
      combinedData.append("reportName", formData.reportName);
      combinedData.append("endpoint", formData.endpointUrl);
      combinedData.append("uuid", user.username);

      // alert(user.username + " " + formData.reportName);

      const response = await fetch("http://127.0.0.1:5000/prep-interactions", {
        method: "POST",
        body: combinedData,
      });

      if (!response.ok) {
        throw new Error("Failed to fetch data of HER validation");
      }

      const responseData = await response.json(); // Assuming the response is JSON
      console.log("Response Data:", responseData);

      // Create a Blob with the JSON data
      const blob = new Blob([JSON.stringify(responseData, null, 2)], {
        type: "application/json",
      });

      // Create a temporary link element
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "interaction.json";

      // Append the link to the DOM and trigger the download
      document.body.appendChild(link);
      link.click();

      // Clean up the DOM
      document.body.removeChild(link);
    } catch (err) {
      setError(
        "Error connecting to Redshift or executing query: " + err.message
      );
      throw err;
    }
  };

  const handleValidate = async () => {
    try {
      const combinedData = new FormData();
      combinedData.append("file", uploadedFile);
      combinedData.append("fileContent", fileContent);
      combinedData.append("fuelType", formData.fuelType);
      combinedData.append("reportName", formData.reportName);
      combinedData.append("endpoint", formData.endpointUrl);

      const validations = [
        {
          username: "751e298e-7e54-4bb5-a4f2-17bfd0931e61",
          sections: {
            HEADER: {
              failure: [
                "Username does not exist",
                "Utility address does not exist",
              ],
            },
            SHC_GRAPH_AND_WIDGET: {
              failure: [],
            },
            ITEMIZATION_SHC: {
              failure: [],
            },
            ITEMIZATION: {
              failure: [],
            },
            PROGRAM_NBI: {
              failure: [],
            },
            EE_NBI: {
              failure: [],
            },
            QR_CODE: {
              failure: [],
            },
            FOOTER: {
              failure: [],
            },
          },
        },
        {
          username: "377da01e-86a5-487e-ac36-81e1a322f50b",
          sections: {
            HEADER: {
              failure: [],
            },
            SHC_GRAPH_AND_WIDGET: {
              failure: [],
            },
            ITEMIZATION_SHC: {
              failure: [],
            },
            ITEMIZATION: {
              failure: [],
            },
            PROGRAM_NBI: {
              failure: [],
            },
            EE_NBI: {
              failure: {
                failure1: "test failure",
                failure2: "test failure2",
              },
            },
            QR_CODE: {
              failure: {
                "QR Code": "QR code is missing",
              },
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
              failure: [],
            },
            SHC_GRAPH_AND_WIDGET: {
              failure: [],
            },
            ITEMIZATION_SHC: {
              failure: [],
            },
            ITEMIZATION: {
              failure: [],
            },
            PROGRAM_NBI: {
              failure: [],
            },
            EE_NBI: {
              failure: [],
            },
            QR_CODE: {
              failure: [],
            },
            FOOTER: {
              failure: [],
            },
          },
        },
      ];

      setValidation(validations);

      // const response = await fetch(
      //   "http://127.0.0.1:5000/her-sections-validations",
      //   {
      //     method: "POST",
      //     body: combinedData,
      //   }
      // );

      // console.log(response);

      // if (!response.ok) {
      //   throw new Error("Failed to fetch data of HER validation");
      // }
    } catch (err) {
      setError(
        "Error connecting to Redshift or executing query: " + err.message
      );
      throw err;
    }
  };

  const [expandedUser, setExpandedUser] = useState(null);

  const toggleUserDetails = (userIndex) => {
    setExpandedUser(expandedUser === userIndex ? null : userIndex);
  };

  const countSectionStatus = (sections) => {
    let passed = 0,
      failed = 0;
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
      <div className="form-container">
        <div className="form-group">
          <select
            id="fuelType"
            name="fuelType"
            value={formData.fuelType}
            onChange={handleChange}
            className="form-select"
          >
            <option value="" disabled>
              select HER fuel type
            </option>
            <option value="ELECTRIC">ELECTRIC</option>
            <option value="GAS">GAS</option>
            <option value="ELECTRIC,GAS">ELECTRIC, GAS (for DF HER)</option>
          </select>
          <label htmlFor="fuelType">Fuel Type*</label>
        </div>

        <div className="form-group">
          <select
            id="reportName"
            name="reportName"
            value={formData.reportName}
            onChange={handleChange}
            className="form-select"
          >
            <option value="" disabled>
              select PDF report type
            </option>
            <option value="HER_MONTHLY_REPORT">HER_MONTHLY_REPORT</option>
            <option value="HER_SEASONAL_WINTER">HER_SEASONAL_WINTER</option>
            <option value="HER_SEASONAL_SUMMER">HER_SEASONAL_SUMMER</option>
            <option value="DFHER_MONTHLY_REPORT">DFHER_MONTHLY_REPORT</option>
          </select>
          <label htmlFor="reportName">Report Type*</label>
        </div>

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

        <button onClick={handleValidate} className="submit-button">
          {loading ? "Analyzing..." : "Validate Report"}
        </button>
      </div>

      {validations.length === 0 ? (
        <p className="no-data-message">No validation data available.</p>
      ) : (
        <table className="validation-table">
          <thead>
            <tr>
              <th>UUID</th>
              <th>Passed</th>
              <th>Failed</th>
              <th>Data Quality</th>
              <th>Mock Interaction</th>
            </tr>
          </thead>
          <tbody>
            {validations.map((user, userIndex) => {
              const { passed, failed } = countSectionStatus(user.sections);
              const isExpanded = expandedUser === userIndex;

              return (
                <React.Fragment key={userIndex}>
                  <tr
                    className="summary-row"
                    onClick={() => toggleUserDetails(userIndex)}
                  >
                    <td>{user.username}</td>
                    <td>{passed}</td>
                    <td>{failed}</td>
                    <td>
                      {failed === 0 ? (
                        <span className="data-quality success">&#10004;</span>
                      ) : (
                        <span className="data-quality failure">&#10008;</span>
                      )}
                    </td>
                    <td>
                      <button
                        className="preview-button"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent row expansion
                          getInteractions(user);
                        }}
                      >
                        Mock the Interactions
                        <i className="icon-preview" /> View
                      </button>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr>
                      <td colSpan="4">
                        <div className="sections-container">
                          {Object.entries(user.sections).map(
                            ([sectionName, sectionData]) => (
                              <div
                                key={sectionName}
                                className={`section-card ${
                                  sectionData.failure &&
                                  Object.keys(sectionData.failure).length > 0
                                    ? "section-failed"
                                    : "section-passed"
                                }`}
                              >
                                <h3>{sectionName.toUpperCase()}</h3>
                                {sectionData.failure &&
                                Object.keys(sectionData.failure).length > 0 ? (
                                  <ul className="failure-list">
                                    {Object.entries(sectionData.failure).map(
                                      ([key, message], idx) => (
                                        <li key={idx} className="failure-item">
                                          <strong>{key}</strong>: {message}
                                        </li>
                                      )
                                    )}
                                  </ul>
                                ) : (
                                  <p className="success-message">
                                    All validations passed!
                                  </p>
                                )}
                              </div>
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ValidationPaper;
