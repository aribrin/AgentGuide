import axios from 'axios';
import { Run, MetricsSummary, Agent } from '../types';

const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  `${window.location.protocol}//127.0.0.1:3001`;

const api = axios.create({
  baseURL: API_BASE_URL,
});

 // Request interceptor to add API key
api.interceptors.request.use((config) => {
  const apiKey = localStorage.getItem('apiKey') || 'demo-key';
  config.headers['X-API-Key'] = apiKey;
  return config;
});

// Simple API error pub-sub
type ApiErrorInfo = { status?: number; message: string; url?: string; method?: string };
const apiErrorListeners = new Set<(err: ApiErrorInfo) => void>();
export function onApiError(listener: (err: ApiErrorInfo) => void) {
  apiErrorListeners.add(listener);
  return () => apiErrorListeners.delete(listener);
}
function notifyApiError(err: ApiErrorInfo) {
  apiErrorListeners.forEach((l) => {
    try {
      l(err);
    } catch {
      // no-op
    }
  });
}

// Response interceptor to surface errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status as number | undefined;
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'Request failed';
    const url = error.config?.url as string | undefined;
    const method = (error.config?.method?.toUpperCase?.() as string | undefined) || undefined;
    notifyApiError({ status, message, url, method });
    return Promise.reject(error);
  }
);

export const apiService = {
  // Runs
  async getRuns(
    filters?: { agentId?: number; status?: string; limit?: number; offset?: number },
    options?: { signal?: AbortSignal }
  ) {
    const response = await api.get('/v1/runs', { params: filters, signal: options?.signal });
    return response.data as Run[];
  },

  async getRun(id: number, options?: { signal?: AbortSignal }) {
    const response = await api.get(`/v1/runs/${id}`, { signal: options?.signal });
    return response.data as Run;
  },

  async createRun(data: { agentId: number; input: any }, options?: { signal?: AbortSignal }) {
    const response = await api.post('/v1/runs', data, { signal: options?.signal });
    return response.data as Run;
  },

  async updateRun(id: number, data: Partial<Run>, options?: { signal?: AbortSignal }) {
    const response = await api.patch(`/v1/runs/${id}`, data, { signal: options?.signal });
    return response.data as Run;
  },

  // Steps
  async createStep(
    runId: number,
    data: { index: number; toolName: string; input: any; startedAt: string },
    options?: { signal?: AbortSignal }
  ) {
    const response = await api.post(`/v1/runs/${runId}/steps`, data, { signal: options?.signal });
    return response.data;
  },

  async updateStep(
    runId: number,
    stepId: number,
    data: { output?: any; error?: string; finishedAt?: string },
    options?: { signal?: AbortSignal }
  ) {
    const response = await api.patch(`/v1/runs/${runId}/steps/${stepId}`, data, { signal: options?.signal });
    return response.data;
  },

  // Metrics
  async getMetricsSummary(
    filters?: { agentId?: number; from?: string; to?: string },
    options?: { signal?: AbortSignal }
  ) {
    const response = await api.get('/v1/metrics/summary', { params: filters, signal: options?.signal });
    return response.data as MetricsSummary;
  },

  // Agents
  async getAgents(options?: { signal?: AbortSignal }) {
    const response = await api.get('/agents', { signal: options?.signal });
    return response.data as Agent[];
  },
};
