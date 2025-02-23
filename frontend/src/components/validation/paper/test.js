import React, { useState } from "react";
import axios from "axios";

const ValidationTable = ({ validations }) => {
  const [expandedUser, setExpandedUser] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]);

  // Handle selection of a user
  const toggleUserSelection = (username) => {
    setSelectedUsers((prevSelectedUsers) =>
      prevSelectedUsers.includes(username)
        ? prevSelectedUsers.filter((user) => user !== username)
        : [...prevSelectedUsers, username]
    );
  };

  // Handle select all users
  const selectAllUsers = () => {
    setSelectedUsers(validations.map((user) => user.username));
  };

  // Handle deselect all users
  const deselectAllUsers = () => {
    setSelectedUsers([]);
  };

  // Toggle user details
  const toggleUserDetails = (index) => {
    setExpandedUser(expandedUser === index ? null : index);
  };

  // Make API call for selected users
  const makeApiCall = async () => {
    try {
      const response = await axios.post("/api/mock-interaction", {
        users: selectedUsers,
      });
      console.log("API Response:", response.data);
    } catch (error) {
      console.error("Error making API call:", error);
    }
  };

  return (
    <div>
      {validations.length === 0 ? (
        <p className="no-data-message">No validation data available.</p>
      ) : (
        <div>
          <div>
            <button onClick={selectAllUsers}>Select All</button>
            <button onClick={deselectAllUsers}>Deselect All</button>
            <button onClick={makeApiCall}>Make API Call</button>
          </div>
          <table className="validation-table">
            <thead>
              <tr>
                <th>Select</th>
                <th>UUID</th>
                <th>Passed</th>
                <th>Failed</th>
                <th>Data Quality</th>
                <th>Mock Interaction Data</th> {/* Added this header */}
              </tr>
            </thead>
            <tbody>
              {validations.map((user, userIndex) => {
                const { passed, failed } = countSectionStatus(user.sections);
                const isExpanded = expandedUser === userIndex;
                const isSelected = selectedUsers.includes(user.username);

                return (
                  <React.Fragment key={userIndex}>
                    <tr
                      className="summary-row"
                      onClick={() => toggleUserDetails(userIndex)}
                    >
                      <td>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleUserSelection(user.username)}
                        />
                      </td>
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
                        <button onClick={() => makeApiCall()}>
                          Trigger Mock Interaction
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan="6">
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
                                  Object.keys(sectionData.failure).length >
                                    0 ? (
                                    <ul className="failure-list">
                                      {Object.entries(sectionData.failure).map(
                                        ([key, message], idx) => (
                                          <li
                                            key={idx}
                                            className="failure-item"
                                          >
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
        </div>
      )}
    </div>
  );
};

// Function to count passed and failed sections
const countSectionStatus = (sections) => {
  let passed = 0;
  let failed = 0;

  Object.entries(sections).forEach(([_, sectionData]) => {
    if (sectionData.failure && Object.keys(sectionData.failure).length > 0) {
      failed++;
    } else {
      passed++;
    }
  });

  return { passed, failed };
};

export default ValidationTable;
