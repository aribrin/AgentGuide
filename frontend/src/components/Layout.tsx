import React, { useState } from 'react';
import Dashboard from './Dashboard';

const Layout: React.FC = () => {
  const [apiKey, setApiKey] = useState(localStorage.getItem('apiKey') || '');

  const handleApiKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      localStorage.setItem('apiKey', apiKey.trim());
      window.location.reload();
    }
  };

  if (!apiKey) {
    return (
      <div className="api-key-setup">
        <div className="setup-form">
          <h2>Welcome to AgentGuide</h2>
          <p>Enter your API key to get started:</p>
          <form onSubmit={handleApiKeySubmit}>
            <input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter API key (or use 'demo-key' for demo data)"
              className="api-key-input"
            />
            <button type="submit" className="submit-btn">
              Connect
            </button>
          </form>
          <p className="hint">
            💡 Use <code>demo-key</code> to explore with sample data
          </p>
        </div>
      </div>
    );
  }

  return <Dashboard />;
};

export default Layout;
