import React, { useState, useEffect } from 'react';
import { Run } from '../types';
import { apiService } from '../services/api';

interface ToolStats {
  toolName: string;
  totalUses: number;
  failures: number;
  successRate: number;
  avgDurationMs: number;
}

interface TimeSeriesData {
  date: string;
  runs: number;
  successRate: number;
  avgDuration: number;
}

const Analytics: React.FC = () => {
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    loadRuns(controller.signal);
    return () => controller.abort();
  }, []);

  const loadRuns = async (signal?: AbortSignal) => {
    try {
      setError(null);
      setLoading(true);
      // Backend limits to max 100 per request, so fetch in batches
      let allRuns: Run[] = [];
      let offset = 0;
      const batchSize = 100;
      let hasMore = true;

      while (hasMore) {
        const batch = await apiService.getRuns({ limit: batchSize, offset }, { signal });
        allRuns = [...allRuns, ...batch];
        
        // If we got less than batchSize, we've reached the end
        if (batch.length < batchSize) {
          hasMore = false;
        } else {
          offset += batchSize;
          // Safety limit: don't fetch more than 1000 runs total
          if (offset >= 1000) {
            hasMore = false;
          }
        }
      }
      
      setRuns(allRuns);
    } catch (error) {
      if ((error as any)?.code === 'ERR_CANCELED' || (error as any)?.name === 'CanceledError') {
        return;
      }
      console.error('Failed to load runs:', error);
      setError((error as any)?.message || 'Failed to load runs');
    } finally {
      setLoading(false);
    }
  };

  // Compute tool statistics
  const computeToolStats = (): ToolStats[] => {
    const toolMap = new Map<string, { uses: number; failures: number; totalDuration: number; count: number }>();

    runs.forEach(run => {
      run.steps.forEach(step => {
        const current = toolMap.get(step.toolName) || { uses: 0, failures: 0, totalDuration: 0, count: 0 };
        current.uses++;
        if (step.error) {
          current.failures++;
        }
        if (step.finishedAt && step.startedAt) {
          const duration = new Date(step.finishedAt).getTime() - new Date(step.startedAt).getTime();
          current.totalDuration += duration;
          current.count++;
        }
        toolMap.set(step.toolName, current);
      });
    });

    return Array.from(toolMap.entries())
      .map(([toolName, stats]) => ({
        toolName,
        totalUses: stats.uses,
        failures: stats.failures,
        successRate: ((stats.uses - stats.failures) / stats.uses) * 100,
        avgDurationMs: stats.count > 0 ? stats.totalDuration / stats.count : 0,
      }))
      .sort((a, b) => b.totalUses - a.totalUses);
  };

  // Compute time series data
  const computeTimeSeriesData = (): TimeSeriesData[] => {
    const dayMap = new Map<string, { runs: number; success: number; totalDuration: number; count: number }>();

    runs.forEach(run => {
      const date = new Date(run.createdAt).toISOString().split('T')[0];
      const current = dayMap.get(date) || { runs: 0, success: 0, totalDuration: 0, count: 0 };
      current.runs++;
      
      const hasErrors = run.steps.some(s => s.error !== null);
      if (!hasErrors && run.steps.length > 0) {
        current.success++;
      }

      if (run.finishedAt && run.startedAt) {
        const duration = new Date(run.finishedAt).getTime() - new Date(run.startedAt).getTime();
        current.totalDuration += duration;
        current.count++;
      }
      
      dayMap.set(date, current);
    });

    return Array.from(dayMap.entries())
      .map(([date, stats]) => ({
        date,
        runs: stats.runs,
        successRate: (stats.success / stats.runs) * 100,
        avgDuration: stats.count > 0 ? stats.totalDuration / stats.count : 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  };

  // Get top failing tools
  const getTopFailingTools = (limit: number = 5): { toolName: string; failures: number }[] => {
    const toolStats = computeToolStats();
    return toolStats
      .filter(t => t.failures > 0)
      .sort((a, b) => b.failures - a.failures)
      .slice(0, limit)
      .map(t => ({ toolName: t.toolName, failures: t.failures }));
  };

  // Compute run duration distribution
  const computeDurationDistribution = (): { bucket: string; count: number }[] => {
    const buckets = [
      { max: 1000, label: '< 1s' },
      { max: 5000, label: '1-5s' },
      { max: 10000, label: '5-10s' },
      { max: 30000, label: '10-30s' },
      { max: Infinity, label: '> 30s' },
    ];

    const distribution = buckets.map(b => ({ bucket: b.label, count: 0 }));

    runs.forEach(run => {
      if (run.finishedAt && run.startedAt) {
        const duration = new Date(run.finishedAt).getTime() - new Date(run.startedAt).getTime();
        const bucketIndex = buckets.findIndex(b => duration < b.max);
        if (bucketIndex !== -1) {
          distribution[bucketIndex].count++;
        }
      }
    });

    return distribution;
  };

  if (loading) {
    return (
      <div className="analytics-loading">
        <div className="spinner"></div>
        <p>Loading analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-error">
        <p>Failed to load analytics: {error}</p>
        <button onClick={() => loadRuns()}>Retry</button>
      </div>
    );
  }

  if (runs.length === 0) {
    return (
      <div className="analytics-empty">
        <p>No data available for analytics. Run some agents first!</p>
      </div>
    );
  }

  const toolStats = computeToolStats();
  const topFailingTools = getTopFailingTools();
  const timeSeriesData = computeTimeSeriesData();
  const durationDistribution = computeDurationDistribution();

  const totalSteps = runs.reduce((sum, run) => sum + run.steps.length, 0);
  const stepsWithErrors = runs.reduce((sum, run) => sum + run.steps.filter(s => s.error).length, 0);
  const overallErrorRate = totalSteps > 0 ? (stepsWithErrors / totalSteps) * 100 : 0;

  return (
    <div className="analytics-container">
      <h2>Advanced Analytics</h2>

      {/* Summary Stats */}
      <div className="analytics-section">
        <h3>Overall Statistics</h3>
        <div className="metrics-grid">
          <div className="metric-card">
            <h4>Total Steps</h4>
            <div className="metric-value">{totalSteps}</div>
          </div>
          <div className="metric-card">
            <h4>Steps with Errors</h4>
            <div className="metric-value">{stepsWithErrors}</div>
          </div>
          <div className="metric-card">
            <h4>Overall Error Rate</h4>
            <div className="metric-value">{overallErrorRate.toFixed(1)}%</div>
          </div>
          <div className="metric-card">
            <h4>Unique Tools</h4>
            <div className="metric-value">{toolStats.length}</div>
          </div>
        </div>
      </div>

      {/* Top Failing Tools */}
      {topFailingTools.length > 0 && (
        <div className="analytics-section">
          <h3>Top Failing Tools</h3>
          <div className="chart-container">
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>Tool Name</th>
                  <th>Failures</th>
                  <th>Visual</th>
                </tr>
              </thead>
              <tbody>
                {topFailingTools.map(tool => (
                  <tr key={tool.toolName}>
                    <td>{tool.toolName}</td>
                    <td>{tool.failures}</td>
                    <td>
                      <div className="bar-chart">
                        <div 
                          className="bar-fill error" 
                          style={{ width: `${(tool.failures / Math.max(...topFailingTools.map(t => t.failures))) * 100}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tool Performance */}
      <div className="analytics-section">
        <h3>Tool Usage & Performance</h3>
        <div className="chart-container">
          <table className="analytics-table">
            <thead>
              <tr>
                <th>Tool Name</th>
                <th>Total Uses</th>
                <th>Success Rate</th>
                <th>Avg Duration</th>
              </tr>
            </thead>
            <tbody>
              {toolStats.map(tool => (
                <tr key={tool.toolName}>
                  <td>{tool.toolName}</td>
                  <td>{tool.totalUses}</td>
                  <td>
                    <span className={tool.successRate >= 90 ? 'success-rate-high' : tool.successRate >= 70 ? 'success-rate-medium' : 'success-rate-low'}>
                      {tool.successRate.toFixed(1)}%
                    </span>
                  </td>
                  <td>{(tool.avgDurationMs / 1000).toFixed(2)}s</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Run Duration Distribution */}
      <div className="analytics-section">
        <h3>Run Duration Distribution</h3>
        <div className="chart-container">
          <table className="analytics-table">
            <thead>
              <tr>
                <th>Duration Range</th>
                <th>Count</th>
                <th>Visual</th>
              </tr>
            </thead>
            <tbody>
              {durationDistribution.map(bucket => (
                <tr key={bucket.bucket}>
                  <td>{bucket.bucket}</td>
                  <td>{bucket.count}</td>
                  <td>
                    <div className="bar-chart">
                      <div 
                        className="bar-fill success" 
                        style={{ width: `${(bucket.count / Math.max(...durationDistribution.map(b => b.count))) * 100}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Time Series */}
      {timeSeriesData.length > 1 && (
        <div className="analytics-section">
          <h3>Trends Over Time</h3>
          <div className="chart-container">
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Runs</th>
                  <th>Success Rate</th>
                  <th>Avg Duration</th>
                </tr>
              </thead>
              <tbody>
                {timeSeriesData.map(data => (
                  <tr key={data.date}>
                    <td>{data.date}</td>
                    <td>{data.runs}</td>
                    <td>{data.successRate.toFixed(1)}%</td>
                    <td>{(data.avgDuration / 1000).toFixed(2)}s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
