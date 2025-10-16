import React, { useState, useEffect } from 'react';
import { MetricsSummary } from '../types';
import { apiService } from '../services/api';
import MetricsChart from './MetricsChart';
import RunsList from './RunsList';

const Dashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<MetricsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'runs' | 'analytics'>('overview');

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const data = await apiService.getMetricsSummary();
      setMetrics(data);
    } catch (error) {
      console.error('Failed to load metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>AgentGuide Dashboard</h1>
        <div className="dashboard-tabs">
          <button 
            className={activeTab === 'overview' ? 'active' : ''} 
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={activeTab === 'runs' ? 'active' : ''} 
            onClick={() => setActiveTab('runs')}
          >
            Runs
          </button>
          <button 
            className={activeTab === 'analytics' ? 'active' : ''} 
            onClick={() => setActiveTab('analytics')}
          >
            Analytics
          </button>
        </div>
      </header>

      {activeTab === 'overview' && metrics && (
        <div className="overview-tab">
          <div className="metrics-grid">
            <div className="metric-card">
              <h3>Total Runs</h3>
              <div className="metric-value">{metrics.totalRuns}</div>
            </div>
            <div className="metric-card">
              <h3>Success Rate</h3>
              <div className="metric-value">{metrics.successRate.toFixed(1)}%</div>
            </div>
            <div className="metric-card">
              <h3>Avg Duration</h3>
              <div className="metric-value">{(metrics.avgDurationMs / 1000).toFixed(1)}s</div>
            </div>
            <div className="metric-card">
              <h3>Avg Steps/Run</h3>
              <div className="metric-value">{metrics.avgStepsPerRun.toFixed(1)}</div>
            </div>
          </div>
          <MetricsChart />
        </div>
      )}

      {activeTab === 'runs' && (
        <RunsList />
      )}

      {activeTab === 'analytics' && (
        <div className="analytics-tab">
          <h2>Advanced Analytics</h2>
          <p>Coming soon: Detailed performance analysis, error patterns, and optimization insights.</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
