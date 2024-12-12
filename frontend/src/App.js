import React, { useState } from 'react';
import Tabs from './components/tabs/Tabs';
import ReportAnalysis from './components/analysis/ReportAnalysis';
import RevokeEmail from './components/revoke/RevokeEmail';
import Header from './components/header/Header';
import { FileProvider } from './components/context/FileContext';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('ReportAnalysis');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'ReportAnalysis':
        return <ReportAnalysis />;
      case 'Revoke Email':
        return <RevokeEmail />;
      default:
        return <ReportAnalysis />;
    }
  };

  return (
    <FileProvider> {/* Single FileProvider wrapping the entire app */}
      <div className="App">
        <Header />
        <div className="main-layout">
          <div className="sidebar">
            <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />
          </div>
          <div className="content-area">{renderTabContent()}</div>
        </div>
      </div>
    </FileProvider>
  );
}

export default App;