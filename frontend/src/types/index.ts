export interface User {
  id: number;
  email: string;
  name?: string;
  apiKeys?: string;
  createdAt: string;
}

export interface Agent {
  id: number;
  name: string;
  version?: string;
  description?: string;
}

export interface Run {
  id: number;
  agent: Agent;
  user?: User;
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
  input: any;
  output?: any;
  startedAt: string;
  finishedAt?: string;
  steps: Step[];
  metrics: Metric[];
  createdAt: string;
}

export interface Step {
  id: number;
  runId: number;
  index: number;
  toolName: string;
  input: any;
  output?: any;
  error?: string;
  startedAt: string;
  finishedAt?: string;
  artifacts: Artifact[];
}

export interface Artifact {
  id: number;
  stepId: number;
  type: string;
  url?: string;
  content?: any;
}

export interface Metric {
  id: number;
  runId: number;
  name: string;
  value: number;
  tags?: any;
}

export interface MetricsSummary {
  totalRuns: number;
  avgDurationMs: number;
  totalSteps: number;
  successRate: number;
  avgStepsPerRun: number;
}
