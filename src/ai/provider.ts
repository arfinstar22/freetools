import { IntentResult } from '../types/ai';
import { analyzeIntentOffline } from './rule-fallback';
import { validateAIActionSchema } from './schemas';
import { getToolById } from '../engine/registry';

export interface AIProviderOptions {
  privateMode?: boolean;
}

export async function interpretUserIntent(
  query: string,
  options: AIProviderOptions = {}
): Promise<IntentResult> {
  const cleanQuery = query.trim();
  if (!cleanQuery) {
    return analyzeIntentOffline('');
  }

  // 1. Private Mode: strictly 0 network requests to AI
  if (options.privateMode) {
    return analyzeIntentOffline(cleanQuery);
  }

  // 2. Gateway endpoint: default to /api/ai-intent or custom proxy URL
  const proxyUrl = import.meta.env.VITE_AI_PROXY_URL || '/api/ai-intent';

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: cleanQuery }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    // If serverless endpoint is not configured (e.g. 503/404) or fails, fallback to local rule engine
    if (!response.ok) {
      return analyzeIntentOffline(cleanQuery);
    }

    const data = await response.json();
    const validation = validateAIActionSchema(data);

    if (!validation.valid || !validation.validated) {
      return analyzeIntentOffline(cleanQuery);
    }

    const { goal, actions, primaryTool, explanation, confidence } = validation.validated;
    const recommendedToolId = primaryTool || (actions.length > 0 ? actions[0].tool : undefined);

    let workflow = undefined;
    if (actions.length > 1) {
      const hasZip = actions.some((a) => a.tool === 'zip-pack');
      workflow = {
        id: `ai-wf-${Date.now()}`,
        title: `Alur Khusus: ${goal}`,
        goal,
        description: explanation || 'Alur langkah otomatis yang disesuaikan dengan kebutuhanmu.',
        outputStrategy: (hasZip ? 'zip' : 'auto') as 'zip' | 'auto',
        steps: actions.map((act, idx) => ({
          id: `step_${idx + 1}`,
          toolId: act.tool,
          name: `${idx + 1}. ${getToolById(act.tool)?.name || act.tool}`,
          options: act.options || {},
          enabled: true
        }))
      };
    }

    return {
      rawQuery: cleanQuery,
      matchedGoal: goal,
      confidence,
      provider: 'openrouter',
      recommendedToolId,
      workflow,
      explanation: explanation || `Bisa. Aku bantu siapkan ${goal}.`,
      privacyNotice: '🤖 Permintaanmu dianalisis oleh AI untuk menemukan tool yang tepat. File dokumen tetap di browsermu.'
    };
  } catch {
    // Graceful fallback to local rule-based intent engine on network failure or offline
    return analyzeIntentOffline(cleanQuery);
  }
}
