import React, { useEffect, useState } from "react";
import "./DataValidation.css";

const fakeApiData = [
  {
    uuid: "a1b2c3d4e5",
    start_BC: "2024-01-01",
    end_BC: "2024-01-31",
    NonPeakConsumption: "123.45 kWh",
    NonPeakCost: "$45.67",
    onPeak_consumption: "234.56 kWh",
    onPeak_cost: "$78.90",
    contributor_appliance: "Refrigerator",
    ClusterID: "CLUSTER-001",
    Kudos_Saving_value: "15%",
    usage_percentage: "25%",
    "6Months_invoice": "$150",
    "13Months_BC_Gap": "2 days",
    USAGE_SECTION_STATUS: true,
    BILLING_GAP_STATUS: false,
    TOU_APP_DATA_STATUS: true,
  },
  {
    uuid: "f6g7h8i9j0",
    start_BC: "2024-02-01",
    end_BC: "2024-02-28",
    NonPeakConsumption: "89.67 kWh",
    NonPeakCost: "$30.45",
    onPeak_consumption: "190.23 kWh",
    onPeak_cost: "$60.78",
    contributor_appliance: "Air Conditioner",
    ClusterID: "CLUSTER-002",
    Kudos_Saving_value: "20%",
    usage_percentage: "30%",
    "6Months_invoice": "$200",
    "13Months_BC_Gap": "0 days",
    USAGE_SECTION_STATUS: false,
    BILLING_GAP_STATUS: true,
    TOU_APP_DATA_STATUS: true,
  },
  {
    uuid: "k1l2m3n4o5",
    start_BC: "2024-03-01",
    end_BC: "2024-03-31",
    NonPeakConsumption: "145.67 kWh",
    NonPeakCost: "$50.78",
    onPeak_consumption: "200.56 kWh",
    onPeak_cost: "$85.67",
    contributor_appliance: "Washing Machine",
    ClusterID: "CLUSTER-003",
    Kudos_Saving_value: "10%",
    usage_percentage: "15%",
    "6Months_invoice": "$170",
    "13Months_BC_Gap": "1 day",
    USAGE_SECTION_STATUS: true,
    BILLING_GAP_STATUS: true,
    TOU_APP_DATA_STATUS: false,
  },
];

const DataValidation = () => {
  const [data, setData] = useState([]);

  // Mock API Call
  useEffect(() => {
    setTimeout(() => {
      setData(fakeApiData); // Simulate fetching data
    }, 1000); // Delay of 1 second
  }, []);

  const getStatusClass = (status) => (status ? "valid" : "invalid");

  return (
    <div className="data-validation-container">
      <h1>Data Validation Dashboard</h1>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>USAGE SECTION</th>
              <th>BILLING GAP</th>
              <th>TOU APP DATA</th>
              <th>UUID</th>
              <th>Start BC</th>
              <th>End BC</th>
              <th>Non-Peak Consumption</th>
              <th>Non-Peak Cost</th>
              <th>On-Peak Consumption</th>
              <th>On-Peak Cost</th>
              <th>Contributor Appliance</th>
              <th>Cluster ID</th>
              <th>Kudos Saving Value</th>
              <th>Usage Percentage</th>
              <th>6 Months Invoice</th>
              <th>13 Months BC Gap</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={index}>
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
    </div>
  );
};

export default DataValidation;
