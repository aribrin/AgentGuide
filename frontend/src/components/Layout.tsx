import React, { useEffect, useState } from 'react';
import Dashboard from './Dashboard';
import { onApiError, apiService } from '../services/api';

type Connectivity = 'checking' | 'good' | 'degraded' | 'offline';

const Layout: React.FC = () => {
  const [apiKey, setApiKey] = useState(localStorage.getItem('apiKey') || '');
  const [submitted, setSubmitted] = useState(!!localStorage.getItem('apiKey'));
  const [connectivity, setConnectivity] = useState<Connectivity>('checking');
  const [banner, setBanner] = useState<{ visible: boolean; message: string; status?: number }>({
    visible: false,
    message: '',
    status: undefined,
  });

  useEffect(() => {
    if (!submitted) return;

    setConnectivity('checking');

    // Subscribe to global API errors
    const unsubscribe = onApiError((err) => {
      setBanner({ visible: true, message: err.message, status: err.status });
    });

    // Connectivity check
    const controller = new AbortController();
    (async () => {
      try {
        const agentsPromise = apiService.getAgents({ signal: controller.signal });
        const metricsPromise = apiService.getMetricsSummary(undefined, { signal: controller.signal });

        const results = await Promise.allSettled([agentsPromise, metricsPromise]);
        const agentsOk = results[0].status === 'fulfilled';
        const metricsOk = results[1].status === 'fulfilled';

        if (agentsOk && metricsOk) {
          setConnectivity('good');
        } else if (agentsOk && !metricsOk) {
          setConnectivity('degraded');
        } else {
          setConnectivity('offline');
        }
      } catch {
        setConnectivity('offline');
      }
    })();

    return () => {
      unsubscribe();
      controller.abort();
    };
  }, [submitted]);

  const handleApiKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = apiKey.trim();
    if (trimmed) {
      localStorage.setItem('apiKey', trimmed);
      setSubmitted(true); // trigger re-render to show Dashboard
    }
  };

  const handleUseDemo = () => {
    localStorage.setItem('apiKey', 'demo-key');
    setApiKey('demo-key');
    setSubmitted(true);
  };

  const handleSignOut = () => {
    localStorage.removeItem('apiKey');
    setApiKey('');
    setSubmitted(false);
    setConnectivity('checking');
    setBanner({ visible: false, message: '', status: undefined });
  };

  const renderConnectivity = () => {
    const map: Record<Connectivity, { label: string; className: string }> = {
      checking: { label: 'Checking...', className: 'checking' },
      good: { label: 'Connected', className: 'good' },
      degraded: { label: 'Degraded', className: 'degraded' },
      offline: { label: 'Offline', className: 'offline' },
    };
    const info = map[connectivity];
    return (
      <div className={`connectivity ${info.className}`}>
        <span className="status-dot" /> {info.label}
      </div>
    );
  };

  if (!submitted) {
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
            <div className="actions">
              <button type="submit" className="submit-btn">
                Connect
              </button>
              <button type="button" className="secondary-btn" onClick={handleUseDemo}>
                Use demo-key
              </button>
            </div>
          </form>
          <p className="hint">
            💡 Use <code>demo-key</code> to explore with sample data
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="layout">
      <header className="topbar">
        <div className="brand">AgentGuide</div>
        <div className="spacer" />
        {renderConnectivity()}
        <button className="signout-btn" onClick={handleSignOut}>
          Sign out
        </button>
      </header>

      {banner.visible && (
        <div className="error-banner">
          <span>
            API error{banner.status ? ` (${banner.status})` : ''}: {banner.message}
          </span>
          <button
            className="dismiss-btn"
            onClick={() => setBanner((b) => ({ ...b, visible: false }))}
          >
            Dismiss
          </button>
        </div>
      )}

      <Dashboard />
    </div>
  );
};

export default Layout;
