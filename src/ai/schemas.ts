import { AIActionSchema } from '../types/ai';
import { getToolById } from '../engine/registry';

export function validateAIActionSchema(data: any): { valid: boolean; validated?: AIActionSchema; error?: string } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Output AI bukan objek JSON yang valid.' };
  }

  const goal = typeof data.goal === 'string' && data.goal.trim() ? data.goal.trim().slice(0, 100) : 'Operasi Utility';
  let rawConfidence = typeof data.confidence === 'number' ? data.confidence : 0.8;
  if (isNaN(rawConfidence) || rawConfidence < 0) rawConfidence = 0.5;
  if (rawConfidence > 1) rawConfidence = 1;

  const explanation = typeof data.explanation === 'string' ? data.explanation.trim().slice(0, 300) : '';
  const actions: AIActionSchema['actions'] = [];

  const MAX_WORKFLOW_STEPS = 6;

  if (Array.isArray(data.actions)) {
    for (let i = 0; i < Math.min(data.actions.length, MAX_WORKFLOW_STEPS); i++) {
      const act = data.actions[i];
      if (typeof act === 'object' && act && typeof act.tool === 'string') {
        const cleanToolId = act.tool.trim();
        const toolDef = getToolById(cleanToolId);

        // Security gate: ONLY allow tools present in our local Tool Registry
        if (toolDef) {
          const sanitizedOptions: Record<string, any> = {};

          // Filter and sanitize options against tool option schemas
          if (act.options && typeof act.options === 'object') {
            const allowedKeys = new Set(toolDef.optionSchemas?.map((s) => s.id) || []);
            for (const [key, val] of Object.entries(act.options)) {
              if (allowedKeys.has(key)) {
                // Ensure primitives only
                if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
                  sanitizedOptions[key] = val;
                }
              }
            }
          }

          actions.push({
            tool: cleanToolId,
            preset: typeof act.preset === 'string' ? act.preset.slice(0, 50) : undefined,
            options: sanitizedOptions
          });
        }
      }
    }
  }

  let primaryTool = typeof data.primaryTool === 'string' ? data.primaryTool.trim() : undefined;
  if (primaryTool && !getToolById(primaryTool)) {
    primaryTool = actions.length > 0 ? actions[0].tool : undefined;
  }

  if (actions.length === 0 && !primaryTool) {
    return { valid: false, error: 'Tidak ada tool terdaftar yang cocok dengan instruksi AI.' };
  }

  return {
    valid: true,
    validated: {
      goal,
      confidence: rawConfidence,
      primaryTool,
      actions,
      explanation
    }
  };
}
