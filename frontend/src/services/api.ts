import axios from 'axios';
import { Run, MetricsSummary, Agent } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Request interceptor to add API key
api.interceptors.request.use((config) => {
  const apiKey = localStorage.getItem('apiKey') || 'demo-key';
  config.headers['X-API-Key'] = apiKey;
  return config;
});

export const apiService = {
  // Runs
  async getRuns(filters?: { agentId?: number; status?: string; limit?: number; offset?: number }) {
    const response = await api.get('/v1/runs', { params: filters });
    return response.data as Run[];
  },

  async getRun(id: number) {
    const response = await api.get(`/v1/runs/${id}`);
    return response.data as Run;
  },

  async createRun(data: { agentId: number; input: any }) {
    const response = await api.post('/v1/runs', data);
    return response.data as Run;
  },

  async updateRun(id: number, data: Partial<Run>) {
    const response = await api.patch(`/v1/runs/${id}`, data);
    return response.data as Run;
  },

  // Steps
  async createStep(runId: number, data: { index: number; toolName: string; input: any; startedAt: string }) {
    const response = await api.post(`/v1/runs/${runId}/steps`, data);
    return response.data;
  },

  async updateStep(runId: number, stepId: number, data: { output?: any; error?: string; finishedAt?: string }) {
    const response = await api.patch(`/v1/runs/${runId}/steps/${stepId}`, data);
    return response.data;
  },

  // Metrics
  async getMetricsSummary(filters?: { agentId?: number; from?: string; to?: string }) {
    const response = await api.get('/v1/metrics/summary', { params: filters });
    return response.data as MetricsSummary;
  },

  // Agents
  async getAgents() {
    const response = await api.get('/agents');
    return response.data as Agent[];
  },
};
