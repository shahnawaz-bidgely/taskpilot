import React from "react";

const ValidationTOUData = ({ data }) => {
  const getStatusClass = (status) => (status ? "valid" : "invalid");

  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            {data.headers.map((header, index) => (
              <th key={index}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((item, rowIndex) => (
            <tr key={rowIndex}>
              <td className={getStatusClass(item.USAGE_SECTION_STATUS)}>
                {item.USAGE_SECTION_STATUS ? "Valid" : "Invalid"}
              </td>
              <td className={getStatusClass(item.BILLING_GAP_STATUS)}>
                {item.BILLING_GAP_STATUS ? "Valid" : "Invalid"}
              </td>
              <td className={getStatusClass(item.TOU_APP_DATA_STATUS)}>
                {item.TOU_APP_DATA_STATUS ? "Valid" : "Invalid"}
              </td>
              <td>{item.uuid}</td>
              <td>{item.start_BC}</td>
              <td>{item.end_BC}</td>
              <td>{item.NonPeakConsumption}</td>
              <td>{item.NonPeakCost}</td>
              <td>{item.onPeak_consumption}</td>
              <td>{item.onPeak_cost}</td>
              <td>{item.contributor_appliance}</td>
              <td>{item.ClusterID}</td>
              <td>{item.Kudos_Saving_value}</td>
              <td>{item.usage_percentage}</td>
              <td>{item["6Months_invoice"]}</td>
              <td>{item["13Months_BC_Gap"]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ValidationTOUData;
