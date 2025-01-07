import React, { useEffect, useState } from "react";
import ValidationTOUData from "./ValidationTOUData";
import ValidationEmail from "./ValidationEmail";
import ValidationDashboard from "./ValidationDashboard";
import ValidationPaper from "./paper/ValidationPaper";
import "./DataValidation.css";

// Mock API Data
const fakeApiData = {
  headers: [
    "USAGE SECTION",
    "BILLING GAP",
    "TOU APP DATA",
    "UUID",
    "Start BC",
    "End BC",
    "Non-Peak Consumption",
    "Non-Peak Cost",
    "On-Peak Consumption",
    "On-Peak Cost",
    "Contributor Appliance",
    "Cluster ID",
    "Kudos Saving Value",
    "Usage Percentage",
    "Continuous 6 Months Invoice",
    "Continuous 13 Months BC",
  ],
  rows: [
    {
        uuid: "1781a2c3-3886-4374-926e-2332629efc61",
        start_BC: "2024-01-01",
        end_BC: "2024-01-31",
        NonPeakConsumption: "123.45 kWh",
        NonPeakCost: "$45.67",
        onPeak_consumption: "234.56 kWh",
        onPeak_cost: "$78.90",
        contributor_appliance: "[['Cooling', 35], ['AlwaysOn', 38]]",
        ClusterID: "NBB",
        Kudos_Saving_value: "$15",
        usage_percentage: "25%",
        "6Months_invoice": "YES",
        "13Months_BC_Gap": "YES",
        USAGE_SECTION_STATUS: true,
        BILLING_GAP_STATUS: true,
        TOU_APP_DATA_STATUS: true,
      },
    
    
    
    {
        uuid: "1781a2c3-3886-4374-926e-2332629efc61",
        start_BC: "2024-01-01",
        end_BC: "2024-01-31",
        NonPeakConsumption: "123.45 kWh",
        NonPeakCost: "$45.67",
        onPeak_consumption: "234.56 kWh",
        onPeak_cost: "$78.90",
        contributor_appliance: "[['Heating', 45], ['AlwaysOn', 38]]",
        ClusterID: "NBB",
        Kudos_Saving_value: "$15",
        usage_percentage: "25%",
        "6Months_invoice": "NO",
        "13Months_BC_Gap": "NO",
        USAGE_SECTION_STATUS: true,
        BILLING_GAP_STATUS: false,
        TOU_APP_DATA_STATUS: true,
      },
      {
        uuid: "0002194e-62b5-47b4-9638-eb8a53cbac24",
        start_BC: "2024-02-01",
        end_BC: "2024-02-28",
        NonPeakConsumption: "89.67 kWh",
        NonPeakCost: "$30.45",
        onPeak_consumption: "190.23 kWh",
        onPeak_cost: "$60.78",
        contributor_appliance: "[['Heating', 45], ['AlwaysOn', 38]]",
        ClusterID: "NBB",
        Kudos_Saving_value: "$20",
        usage_percentage: "NA",
        "6Months_invoice": "NO",
        "13Months_BC_Gap": "NO",
        USAGE_SECTION_STATUS: false,
        BILLING_GAP_STATUS: false,
        TOU_APP_DATA_STATUS: true,
      },
      {
        uuid: "55e7cc8b-060d-4787-b1f0-5f10762b2ea4",
        start_BC: "2024-03-01",
        end_BC: "2024-03-31",
        NonPeakConsumption: "NA",
        NonPeakCost: "NA",
        onPeak_consumption: "NA",
        onPeak_cost: "NA",
        contributor_appliance: "NA",
        ClusterID: "BB",
        Kudos_Saving_value: "NA",
        usage_percentage: "NA",
        "6Months_invoice": "NO",
        "13Months_BC_Gap": "NO",
        USAGE_SECTION_STATUS: false,
        BILLING_GAP_STATUS: false,
        TOU_APP_DATA_STATUS: false,
      },
    // Additional rows here...
  ],
};

const DataValidation = () => {
  const [activeSection, setActiveSection] = useState("TOU_DATA");
  const [data, setData] = useState(null);

  // Simulate API Call
  useEffect(() => {
    setTimeout(() => {
      setData(fakeApiData); // Simulate fetching data
    }, 1000);
  }, []);

  if (!data) return <div>Loading...</div>;

  return (
    <div className="data-validation-container">
      <h1>Data Validation Dashboard</h1>
      <div className="section-tabs">
        <button
          className={activeSection === "TOU_DATA" ? "active" : ""}
          onClick={() => setActiveSection("TOU_DATA")}
        >
          TOU Data
        </button>
        <button
          className={activeSection === "EMAIL" ? "active" : ""}
          onClick={() => setActiveSection("EMAIL")}
        >
          Email
        </button>
        <button
          className={activeSection === "DASHBOARD" ? "active" : ""}
          onClick={() => setActiveSection("DASHBOARD")}
        >
          Dashboard
        </button>
        <button
          className={activeSection === "PAPER" ? "active" : ""}
          onClick={() => setActiveSection("PAPER")}
        >
          Paper
        </button>
      </div>

      {activeSection === "TOU_DATA" && <ValidationTOUData data={data} />}
      {activeSection === "EMAIL" && <ValidationEmail />}
      {activeSection === "DASHBOARD" && <ValidationDashboard />}
      {activeSection === "PAPER" && <ValidationPaper />}
    </div>
  );
};

export default DataValidation;
