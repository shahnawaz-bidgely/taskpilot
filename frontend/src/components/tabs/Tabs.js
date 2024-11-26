import React from 'react';
import './Tabs.css';

function Tabs({ activeTab, setActiveTab }) {
  const tabs = ['Report Analysis', 'Revoke Email', 'TOD Analysis'];

  return (
    <div className="tabs">
      {tabs.map(tab => (
        <div
          key={tab}
          className={`tab ${activeTab === tab ? 'active' : ''}`}  // Highlight active tab
          onClick={() => setActiveTab(tab)}  // Set active tab on click
        >
          {tab}
        </div>
      ))}
    </div>
  );
}

export default Tabs;
