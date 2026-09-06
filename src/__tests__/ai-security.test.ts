import { describe, it, expect } from 'vitest';
import { validateAIActionSchema } from '../ai/schemas';

describe('AI Action Schema Security Validation', () => {
  it('should accept valid structured action with registered tools', () => {
    const raw = {
      goal: 'Kecilkan PDF',
      confidence: 0.9,
      primaryTool: 'compress-pdf',
      actions: [
        {
          tool: 'compress-pdf',
          options: { level: 'medium' }
        }
      ],
      explanation: 'Kompres PDF ke ukuran lebih kecil'
    };

    const res = validateAIActionSchema(raw);
    expect(res.valid).toBe(true);
    expect(res.validated?.primaryTool).toBe('compress-pdf');
    expect(res.validated?.actions[0].tool).toBe('compress-pdf');
    expect(res.validated?.actions[0].options?.level).toBe('medium');
  });

  it('should reject non-registered arbitrary tool IDs injected by malicious prompt', () => {
    const malicious = {
      goal: 'Hapus file',
      actions: [
        {
          tool: 'system-rm-rf',
          options: { path: '/root' }
        },
        {
          tool: 'arbitrary-shell-exec',
          options: { cmd: 'whoami' }
        }
      ]
    };

    const res = validateAIActionSchema(malicious);
    expect(res.valid).toBe(false);
    expect(res.error).toBeDefined();
  });

  it('should strip unknown or unapproved options from tool parameters', () => {
    const input = {
      goal: 'Format JSON',
      primaryTool: 'json-formatter',
      actions: [
        {
          tool: 'json-formatter',
          options: {
            action: 'minify',
            maliciousPayload: 'DROP TABLE users;',
            __proto__: { admin: true }
          }
        }
      ]
    };

    const res = validateAIActionSchema(input);
    expect(res.valid).toBe(true);
    expect(res.validated?.actions[0].options?.action).toBe('minify');
    expect(res.validated?.actions[0].options?.maliciousPayload).toBeUndefined();
  });

  it('should limit maximum workflow steps to prevent denial of service', () => {
    const manySteps = {
      goal: 'Overloaded workflow',
      actions: Array.from({ length: 20 }, () => ({ tool: 'image-compress' }))
    };

    const res = validateAIActionSchema(manySteps);
    expect(res.valid).toBe(true);
    expect(res.validated?.actions.length).toBeLessThanOrEqual(6);
  });
});
