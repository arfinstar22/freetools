import { describe, it, expect } from 'vitest';
import { runWorkflow } from '../engine/workflow/runner';
import { WorkflowPlan } from '../types/workflow';

describe('Workflow Engine Execution', () => {
  it('Single-step workflow should output single-file strategy (NOT forced zip)', async () => {
    const plan: WorkflowPlan = {
      id: 'wf-single',
      title: 'Bersihkan Teks',
      goal: 'Bersihkan teks',
      description: 'Membersihkan spasi',
      outputStrategy: 'single-file',
      steps: [
        {
          id: 'step_1',
          toolId: 'text-cleaner',
          name: 'Pembersih Teks',
          options: { removeExtraSpaces: true },
          enabled: true
        }
      ]
    };

    const initialText = '  Teks   dengan    banyak spasi  ';
    const result = await runWorkflow({
      plan,
      initialText,
      onStateChange: () => {}
    });

    expect(result.strategy).toBe('single-file');
    expect(result.finalFilename).toBe('teks_bersih.txt');
    expect(result.items.length).toBe(1);
  });

  it('Multi-step text pipeline should feed step 1 output into step 2', async () => {
    const plan: WorkflowPlan = {
      id: 'wf-multi-text',
      title: 'Rapikan lalu Ubah Huruf',
      goal: 'Rapikan dan kapital',
      description: 'Clean and uppercase',
      outputStrategy: 'single-file',
      steps: [
        {
          id: 'step_1',
          toolId: 'text-cleaner',
          name: 'Bersihkan Spasi',
          options: { removeExtraSpaces: true },
          enabled: true
        },
        {
          id: 'step_2',
          toolId: 'case-converter',
          name: 'Jadikan Huruf Besar',
          options: { targetCase: 'upper' },
          enabled: true
        }
      ]
    };

    const result = await runWorkflow({
      plan,
      initialText: '   halo   freetools   ',
      onStateChange: () => {}
    });

    expect(result.strategy).toBe('single-file');
    expect(result.items.length).toBe(1);
    const textBlob = result.items[0].blob;
    const text = await textBlob.text();
    expect(text).toBe('HALO FREETOOLS');
  });

  it('Workflow with zip packaging strategy should output ZIP', async () => {
    const plan: WorkflowPlan = {
      id: 'wf-zip',
      title: 'Generate dan ZIP',
      goal: 'Arsipkan ke ZIP',
      description: 'Kemas',
      outputStrategy: 'zip',
      outputZipName: 'hasil_arsip.zip',
      steps: [
        {
          id: 'step_1',
          toolId: 'text-cleaner',
          name: 'Bersihkan Teks',
          options: {},
          enabled: true
        },
        {
          id: 'step_2',
          toolId: 'zip-pack',
          name: 'Kemas ZIP',
          options: { zipFilename: 'hasil_arsip.zip' },
          enabled: true
        }
      ]
    };

    const result = await runWorkflow({
      plan,
      initialText: 'Contoh berkas arsip',
      onStateChange: () => {}
    });

    expect(result.strategy).toBe('zip');
    expect(result.finalFilename).toBe('hasil_arsip.zip');
    expect(result.finalBlob).toBeDefined();
  });
});
