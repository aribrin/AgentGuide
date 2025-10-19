import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { MetricsSummary } from '../types';

interface MetricsChartProps {
  metrics: MetricsSummary;
}

const MetricsChart: React.FC<MetricsChartProps> = ({ metrics }) => {
  // Create chart data from the actual metrics
  const chartData = [
    {
      name: 'Total Runs',
      value: metrics.totalRuns,
      color: '#8884d8',
    },
    {
      name: 'Total Steps',
      value: metrics.totalSteps,
      color: '#82ca9d',
    },
  ];

  const ratesData = [
    {
      name: 'Success Rate',
      value: metrics.successRate,
      color: '#82ca9d',
    },
    {
      name: 'Failure Rate',
      value: 100 - metrics.successRate,
      color: '#ff8042',
    },
  ];

  const performanceData = [
    {
      name: 'Avg Duration (s)',
      value: (metrics.avgDurationMs / 1000),
      color: '#ffc658',
    },
    {
      name: 'Avg Steps/Run',
      value: metrics.avgStepsPerRun,
      color: '#8dd1e1',
    },
  ];

  return (
    <div className="metrics-charts">
      <div className="chart-container">
        <h4>Run & Step Counts</h4>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value">
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-container">
        <h4>Success vs Failure Rate (%)</h4>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={ratesData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis domain={[0, 100]} />
            <Tooltip formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Rate']} />
            <Bar dataKey="value">
              {ratesData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-container">
        <h4>Performance Metrics</h4>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={performanceData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(value) => [Number(value).toFixed(2), '']} />
            <Bar dataKey="value">
              {performanceData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default MetricsChart;
