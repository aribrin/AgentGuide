import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { apiService } from '../services/api';

interface ChartDataPoint {
  time: string;
  runs: number;
  successRate: number;
  avgDuration: number;
}

const MetricsChart: React.FC = () => {
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChartData();
  }, []);

  const loadChartData = async () => {
    try {
      setLoading(true);
      // For demo purposes, generate some sample data
      // In a real app, you'd fetch historical metrics from your backend
      const sampleData: ChartDataPoint[] = [];
      const now = new Date();
      
      for (let i = 23; i >= 0; i--) {
        const time = new Date(now.getTime() - i * 60 * 60 * 1000);
        sampleData.push({
          time: time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          runs: Math.floor(Math.random() * 20) + 5,
          successRate: Math.random() * 30 + 70, // 70-100%
          avgDuration: Math.random() * 2000 + 1000, // 1-3s
        });
      }
      
      setData(sampleData);
    } catch (error) {
      console.error('Failed to load chart data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="chart-loading">Loading charts...</div>;
  }

  return (
    <div className="metrics-charts">
      <div className="chart-container">
        <h4>Runs Over Time</h4>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="runs" stroke="#8884d8" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-container">
        <h4>Success Rate Trend</h4>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis domain={[0, 100]} />
            <Tooltip formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Success Rate']} />
            <Line type="monotone" dataKey="successRate" stroke="#82ca9d" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-container">
        <h4>Average Duration</h4>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip formatter={(value) => [`${(value as number / 1000).toFixed(1)}s`, 'Avg Duration']} />
            <Bar dataKey="avgDuration" fill="#ffc658" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default MetricsChart;
