import React, { useState, useEffect, useCallback } from 'react';
import { Run } from '../types';
import { apiService } from '../services/api';
import RunDetail from './RunDetail';

const RunsList: React.FC = () => {
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRun, setSelectedRun] = useState<Run | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    agentId: '',
    limit: 20,
    offset: 0,
  });


  const loadRuns = useCallback(async (signal?: AbortSignal) => {
    try {
      setError(null);
      setLoading(true);
      const queryParams: any = {
        limit: filters.limit,
        offset: filters.offset,
      };
      if (filters.status) queryParams.status = filters.status;
      if (filters.agentId) queryParams.agentId = Number(filters.agentId);

      const data = await apiService.getRuns(queryParams, { signal });
      setRuns(data);
    } catch (error: any) {
      if (error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError') {
        return;
      }
      console.error('Failed to load runs:', error);
      setError(error?.message || 'Failed to load runs');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const controller = new AbortController();
    loadRuns(controller.signal);
    return () => controller.abort();
  }, [loadRuns]);

  // add a stable retry handler that calls loadRuns
  const handleRetry = useCallback(() => {
    loadRuns();
  }, [loadRuns]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS': return 'status-success';
      case 'FAILED': return 'status-failed';
      case 'RUNNING': return 'status-running';
      case 'PENDING': return 'status-pending';
      default: return 'status-default';
    }
  };

  const formatDuration = (startedAt: string, finishedAt?: string) => {
    if (!finishedAt) return 'Running...';
    
    const start = new Date(startedAt).getTime();
    const end = new Date(finishedAt).getTime();
    const duration = end - start;
    
    if (duration < 1000) return `${duration}ms`;
    return `${(duration / 1000).toFixed(1)}s`;
  };

  if (loading) {
    return <div className="loading">Loading runs...</div>;
  }

  if (error) {
    return (
      <div className="error">
        <p>Failed to load runs: {error}</p>
        <button onClick={handleRetry}>Retry</button>
      </div>
    );
  }

  if (!loading && runs.length === 0) {
    return <div className="empty">No runs found.</div>;
  }

  return (
    <div className="runs-container">
      <div className="runs-header">
        <h2>Recent Runs</h2>
        <div className="runs-filters">
          <select 
            value={filters.status} 
            onChange={(e) => setFilters({...filters, status: e.target.value})}
          >
            <option value="">All Statuses</option>
            <option value="SUCCESS">Success</option>
            <option value="FAILED">Failed</option>
            <option value="RUNNING">Running</option>
            <option value="PENDING">Pending</option>
          </select>
        </div>
      </div>

      <div className="runs-layout">
        <div className="runs-list">
          <div className="runs-list-header">
            <div>Run ID</div>
            <div>Agent</div>
            <div>Status</div>
            <div>Duration</div>
            <div>Steps</div>
            <div>Started</div>
          </div>
          
          {runs.map((run) => (
            <div 
              key={run.id} 
              className={`run-item ${selectedRun?.id === run.id ? 'selected' : ''}`}
              onClick={() => setSelectedRun(run)}
            >
              <div>#{run.id}</div>
              <div>{run.agent.name}</div>
              <div>
                <span className={`status-badge ${getStatusColor(run.status)}`}>
                  {run.status}
                </span>
              </div>
              <div>{formatDuration(run.startedAt, run.finishedAt || undefined)}</div>
              <div>{run.steps.length}</div>
              <div>{new Date(run.startedAt).toLocaleTimeString()}</div>
            </div>
          ))}
        </div>

        <div className="run-detail-panel">
          {selectedRun ? (
            <RunDetail run={selectedRun} />
          ) : (
            <div className="no-selection">
              <p>Select a run to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RunsList;
