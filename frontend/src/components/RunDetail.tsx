import React from 'react';
import { Run, Step } from '../types';

interface RunDetailProps {
  run: Run;
}

const RunDetail: React.FC<RunDetailProps> = ({ run }) => {
  const formatDuration = (startedAt: string, finishedAt?: string) => {
    if (!finishedAt) return 'Running...';
    
    const start = new Date(startedAt).getTime();
    const end = new Date(finishedAt).getTime();
    return `${(end - start) / 1000}s`;
  };

  const getStepStatus = (step: Step) => {
    if (step.error) return 'error';
    if (step.finishedAt) return 'completed';
    return 'running';
  };

  return (
    <div className="run-detail">
      <div className="run-header">
        <h3>Run #{run.id}</h3>
        <span className={`status-badge ${run.status.toLowerCase()}`}>
          {run.status}
        </span>
      </div>

      <div className="run-info">
        <div className="info-section">
          <h4>Basic Info</h4>
          <div className="info-grid">
            <div>
              <label>Agent:</label>
              <span>{run.agent.name} v{run.agent.version}</span>
            </div>
            <div>
              <label>Duration:</label>
              <span>{formatDuration(run.startedAt, run.finishedAt || undefined)}</span>
            </div>
            <div>
              <label>Started:</label>
              <span>{new Date(run.startedAt).toLocaleString()}</span>
            </div>
            {run.finishedAt && (
              <div>
                <label>Finished:</label>
                <span>{new Date(run.finishedAt).toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>

        <div className="info-section">
          <h4>Input</h4>
          <pre className="json-display">{JSON.stringify(run.input, null, 2)}</pre>
        </div>

        {run.output && (
          <div className="info-section">
            <h4>Output</h4>
            <pre className="json-display">{JSON.stringify(run.output, null, 2)}</pre>
          </div>
        )}
      </div>

      <div className="steps-section">
        <h4>Execution Steps ({run.steps.length})</h4>
        <div className="steps-timeline">
          {run.steps
            .sort((a, b) => a.index - b.index)
            .map((step, index) => (
              <div key={step.id} className={`step-item ${getStepStatus(step)}`}>
                <div className="step-header">
                  <span className="step-index">{step.index}</span>
                  <span className="step-tool">{step.toolName}</span>
                  <span className={`step-status ${getStepStatus(step)}`}>
                    {getStepStatus(step)}
                  </span>
                </div>
                
                <div className="step-duration">
                  Duration: {formatDuration(step.startedAt, step.finishedAt || undefined)}
                </div>

                <div className="step-input">
                  <strong>Input:</strong>
                  <pre>{JSON.stringify(step.input, null, 2)}</pre>
                </div>

                {step.output && (
                  <div className="step-output">
                    <strong>Output:</strong>
                    <pre>{JSON.stringify(step.output, null, 2)}</pre>
                  </div>
                )}

                {step.error && (
                  <div className="step-error">
                    <strong>Error:</strong>
                    <pre className="error-text">{step.error}</pre>
                  </div>
                )}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default RunDetail;
