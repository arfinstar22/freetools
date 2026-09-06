import { WorkflowPlan, WorkflowExecutionState } from '../../types/workflow';
import { getToolById } from '../registry';
import { createZipFromFiles } from '../../utils/download';

export interface WorkflowRunnerOptions {
  plan: WorkflowPlan;
  initialFiles?: File[];
  initialText?: string;
  onStateChange: (state: WorkflowExecutionState) => void;
}

export async function runWorkflow(options: WorkflowRunnerOptions): Promise<{
  strategy: 'single-file' | 'files' | 'zip';
  finalBlob?: Blob;
  finalFilename?: string;
  items: { name: string; size: number; blob: Blob; mimeType?: string }[];
}> {
  const { plan, initialFiles = [], initialText = '', onStateChange } = options;
  const enabledSteps = plan.steps.filter((s) => s.enabled);
  const totalSteps = enabledSteps.length;

  if (totalSteps === 0) {
    throw new Error('Alur kerja tidak memiliki langkah aktif untuk dijalankan.');
  }

  let state: WorkflowExecutionState = {
    currentStepIndex: 0,
    totalSteps: plan.steps.length,
    stepStatus: plan.steps.map((s) => (s.enabled ? 'idle' : 'completed')),
    progress: 0,
    currentMessage: 'Memulai alur kerja...',
    outputStrategy: plan.outputStrategy || 'auto'
  };

  const updateState = (partial: Partial<WorkflowExecutionState>) => {
    state = { ...state, ...partial };
    onStateChange(state);
  };

  updateState({ progress: 5 });

  let currentFiles: File[] = [...initialFiles];
  let currentText: string = initialText;
  const stepStatuses = [...state.stepStatus];

  for (let i = 0; i < plan.steps.length; i++) {
    const step = plan.steps[i];
    if (!step.enabled) {
      stepStatuses[i] = 'completed';
      updateState({ stepStatus: [...stepStatuses] });
      continue;
    }

    const tool = getToolById(step.toolId);
    if (!tool) {
      stepStatuses[i] = 'error';
      const errMsg = `Tool "${step.toolId}" tidak terdaftar dalam sistem.`;
      updateState({
        stepStatus: [...stepStatuses],
        error: errMsg
      });
      throw new Error(errMsg);
    }

    stepStatuses[i] = 'running';
    const stepProgressStart = Math.round((i / plan.steps.length) * 85);
    const stepProgressRange = Math.round(85 / plan.steps.length);

    updateState({
      currentStepIndex: i,
      stepStatus: [...stepStatuses],
      progress: Math.max(5, stepProgressStart),
      currentMessage: `Menjalankan: ${step.name}...`
    });

    try {
      const processResult = await tool.process({
        files: currentFiles,
        textInput: currentText,
        options: step.options || {},
        onProgress: (p) => {
          const innerProgress = stepProgressStart + Math.round((p.percentage / 100) * stepProgressRange);
          updateState({
            progress: Math.min(92, innerProgress),
            currentMessage: `${step.name}: ${p.message || 'Memproses...'}`
          });
        }
      });

      if (!processResult.success) {
        throw new Error(processResult.message || `Gagal menjalankan langkah ${step.name}.`);
      }

      stepStatuses[i] = 'completed';
      updateState({ stepStatus: [...stepStatuses] });

      // Transform processed items into input for subsequent steps
      const nextFiles: File[] = [];
      let updatedText: string | undefined = undefined;

      for (const item of processResult.items) {
        if (item.textOutput !== undefined) {
          updatedText = item.textOutput;
          const blob = new Blob([item.textOutput], { type: 'text/plain;charset=utf-8' });
          const f = new File([blob], item.name || 'output.txt', { type: 'text/plain' });
          nextFiles.push(f);
        } else if (item.blob) {
          const mime = item.type || item.blob.type || 'application/octet-stream';
          const f = new File([item.blob], item.name, { type: mime });
          nextFiles.push(f);
        }
      }

      if (nextFiles.length > 0) {
        currentFiles = nextFiles;
      }
      if (updatedText !== undefined) {
        currentText = updatedText;
      }
    } catch (err: any) {
      stepStatuses[i] = 'error';
      const userMsg = err.message || `Terjadi kesalahan saat memproses langkah "${step.name}".`;
      updateState({
        stepStatus: [...stepStatuses],
        error: userMsg
      });
      throw new Error(userMsg);
    }
  }

  // Determine final output strategy
  const explicitZip = plan.outputStrategy === 'zip' || plan.steps[plan.steps.length - 1]?.toolId === 'zip-pack';
  const singleFile = plan.outputStrategy === 'single-file' || (!explicitZip && currentFiles.length === 1);

  let finalBlob: Blob | undefined;
  let finalFilename: string | undefined;
  let finalStrategy: 'single-file' | 'files' | 'zip' = 'files';

  const finalItems = currentFiles.map((f) => ({
    name: f.name,
    size: f.size,
    blob: f as Blob,
    mimeType: f.type
  }));

  if (singleFile && currentFiles.length > 0) {
    finalStrategy = 'single-file';
    finalBlob = currentFiles[0];
    finalFilename = plan.outputFilename || currentFiles[0].name;
  } else if (explicitZip) {
    finalStrategy = 'zip';
    const zipName = plan.outputZipName || plan.outputFilename || 'freetools_workflow_hasil.zip';
    const filesForZip = currentFiles.map((f) => ({
      name: f.name,
      blob: f
    }));

    updateState({
      currentMessage: 'Mengemas hasil alur kerja ke file ZIP...',
      progress: 95
    });

    finalBlob = await createZipFromFiles(filesForZip, zipName);
    finalFilename = zipName.endsWith('.zip') ? zipName : `${zipName}.zip`;
  } else {
    finalStrategy = 'files';
    finalFilename = plan.outputFilename || 'freetools_hasil_alur.zip';
    finalBlob = await createZipFromFiles(currentFiles.map((f) => ({ name: f.name, blob: f })), finalFilename);
  }

  updateState({
    currentStepIndex: plan.steps.length,
    progress: 100,
    currentMessage: 'Semua tahapan alur kerja berhasil diselesaikan!',
    outputStrategy: finalStrategy,
    finalBlob,
    finalFilename,
    finalItems
  });

  return {
    strategy: finalStrategy,
    finalBlob,
    finalFilename,
    items: finalItems
  };
}
