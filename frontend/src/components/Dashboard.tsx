import React, { useState, useEffect, useCallback } from 'react';
import { MetricsSummary, Run } from '../types';
import { apiService } from '../services/api';
import MetricsChart from './MetricsChart';
import RunsList from './RunsList';
import Analytics from './Analytics';
import { format, subDays } from 'date-fns';

const Dashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<MetricsSummary | null>(null);
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'runs' | 'analytics'>('overview');
  const [dateRange, setDateRange] = useState({
    from: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
    to: format(new Date(), 'yyyy-MM-dd')
  });
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const loadData = useCallback(async (signal?: AbortSignal) => {
    try {
      setError(null);
      setLoading(true);
      
      // Load metrics with date range
      const metricsData = await apiService.getMetricsSummary({
        from: dateRange.from,
        to: dateRange.to
      }, { signal });
      setMetrics(metricsData);

      // Load runs for time series computation
      const runsData = await apiService.getRuns({ limit: 1000 }, { signal });
      setRuns(runsData);
      
      setLastRefresh(new Date());
    } catch (error) {
      if ((error as any)?.code === 'ERR_CANCELED' || (error as any)?.name === 'CanceledError') {
        return;
      }
      console.error('Failed to load data:', error);
      setError((error as any)?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    const controller = new AbortController();
    loadData(controller.signal);
    return () => controller.abort();
  }, [loadData]);

  const handleRefresh = () => {
    loadData();
  };

  const handleDateRangeChange = (field: 'from' | 'to', value: string) => {
    setDateRange(prev => ({ ...prev, [field]: value }));
  };

  const computeTimeSeriesData = () => {
    if (runs.length === 0) return [];

    const dayMap = new Map<string, { runs: number; success: number }>();
    
    runs.forEach(run => {
      const date = run.createdAt.split('T')[0];
      const current = dayMap.get(date) || { runs: 0, success: 0 };
      current.runs++;
      
      if (run.status === 'SUCCESS') {
        current.success++;
      }
      
      dayMap.set(date, current);
    });

    return Array.from(dayMap.entries())
      .map(([date, stats]) => ({
        date,
        runs: stats.runs,
        successRate: stats.runs > 0 ? (stats.success / stats.runs) * 100 : 0
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-7); // Last 7 days
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <p>Failed to load data: {error}</p>
        <button onClick={handleRefresh}>Retry</button>
      </div>
    );
  }

  const timeSeriesData = computeTimeSeriesData();

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>AgentGuide Dashboard</h1>
          <div className="last-refresh">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </div>
        </div>
        <div className="header-right">
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
        </div>
      </header>

      {activeTab === 'overview' && (
        <div className="dashboard-controls">
          <div className="date-filters">
            <label>
              From:
              <input 
                type="date" 
                value={dateRange.from} 
                onChange={(e) => handleDateRangeChange('from', e.target.value)}
                max={dateRange.to}
              />
            </label>
            <label>
              To:
              <input 
                type="date" 
                value={dateRange.to} 
                onChange={(e) => handleDateRangeChange('to', e.target.value)}
                min={dateRange.from}
                max={format(new Date(), 'yyyy-MM-dd')}
              />
            </label>
          </div>
          <button className="refresh-btn" onClick={handleRefresh} disabled={loading}>
            {loading ? 'Refreshing...' : '🔄 Refresh'}
          </button>
        </div>
      )}

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
          <MetricsChart metrics={metrics} timeSeriesData={timeSeriesData} />
        </div>
      )}

      {activeTab === 'runs' && (
        <RunsList />
      )}

      {activeTab === 'analytics' && (
        <Analytics />
      )}
    </div>
  );
};

export default Dashboard;
