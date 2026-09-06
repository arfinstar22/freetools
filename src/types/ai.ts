import { WorkflowPlan } from './workflow';

export interface IntentResult {
  rawQuery: string;
  matchedGoal: string;
  confidence: number;
  provider: 'local-rules' | 'openrouter' | 'custom';
  recommendedToolId?: string;
  workflow?: WorkflowPlan;
  explanation: string;
  suggestedPreset?: Record<string, any>;
  privacyNotice: string;
}

export interface AIActionSchema {
  goal: string;
  confidence: number;
  primaryTool?: string;
  actions: {
    tool: string;
    preset?: string;
    options?: Record<string, any>;
  }[];
  explanation: string;
}
