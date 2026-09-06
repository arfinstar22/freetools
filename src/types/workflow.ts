import { ToolDefinition } from './tool';

export type WorkflowOutputStrategy = 'auto' | 'single-file' | 'files' | 'zip';

export interface WorkflowStepConfig {
  id: string;
  toolId: string;
  tool?: ToolDefinition;
  name: string;
  description?: string;
  options: Record<string, any>;
  enabled: boolean;
  isPackagingStep?: boolean;
}

export interface WorkflowPlan {
  id: string;
  title: string;
  goal: string;
  description: string;
  badge?: string;
  outputStrategy?: WorkflowOutputStrategy;
  steps: WorkflowStepConfig[];
  outputFilename?: string;
  outputZipName?: string;
}

export interface WorkflowExecutionState {
  currentStepIndex: number;
  totalSteps: number;
  stepStatus: ('idle' | 'running' | 'completed' | 'error')[];
  progress: number;
  currentMessage: string;
  error?: string;
  outputStrategy?: WorkflowOutputStrategy;
  finalBlob?: Blob;
  finalFilename?: string;
  finalItems?: { name: string; size: number; blob: Blob; mimeType?: string }[];
}
