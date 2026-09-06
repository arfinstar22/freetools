import { describe, it, expect } from 'vitest';
import { handleAIIntentRequest } from '../../api/ai-intent';
import { interpretUserIntent } from '../ai/provider';

describe('AI Gateway Production Failure Modes & Fuzzing (Task 7)', () => {
  it('handles 401 / 429 / 500 upstream provider errors by gracefully returning error JSON without secret leak', async () => {
    process.env.OPENROUTER_API_KEY = 'sk-mock-key';

    // Mock global fetch to simulate OpenRouter 429 Rate Limit
    const originalFetch = global.fetch;
    global.fetch = async () =>
      new Response(JSON.stringify({ error: { message: 'Rate limit exceeded' } }), {
        status: 429,
        statusText: 'Too Many Requests',
        headers: { 'Content-Type': 'application/json' }
      });

    try {
      const req = new Request('http://localhost:3000/api/ai-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'kompres pdf' })
      });

      const res = (await handleAIIntentRequest(req)) as Response;
      expect(res.status).toBe(502);
      const data = await res.json();
      expect(data.error).toContain('Gagal menghubungi penyedia AI');
      // Secret key must never appear in response body
      expect(JSON.stringify(data)).not.toContain('sk-mock-key');
    } finally {
      global.fetch = originalFetch;
      delete process.env.OPENROUTER_API_KEY;
    }
  });

  it('handles malformed non-JSON response from upstream AI by safely returning fallback', async () => {
    process.env.OPENROUTER_API_KEY = 'sk-mock-key';

    const originalFetch = global.fetch;
    global.fetch = async () =>
      new Response('<html><body>502 Bad Gateway Nginx</body></html>', {
        status: 200,
        headers: { 'Content-Type': 'text/html' }
      });

    try {
      const req = new Request('http://localhost:3000/api/ai-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'ubah resolusi foto' })
      });

      const res = (await handleAIIntentRequest(req)) as Response;
      expect(res.status).toBe(502);
    } finally {
      global.fetch = originalFetch;
      delete process.env.OPENROUTER_API_KEY;
    }
  });

  it('client interpreter silently falls back to offline rule matching on gateway HTTP 500 error', async () => {
    const originalFetch = global.fetch;
    global.fetch = async () =>
      new Response(JSON.stringify({ error: 'Internal Server Error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });

    try {
      const result = await interpretUserIntent('kecilin ukuran pdf');
      expect(result).toBeDefined();
      expect(result.recommendedToolId).toBe('compress-pdf');
      expect(result.provider).toBe('local-rules');
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('fuzzing: handles query containing unusual characters, symbols, and SQL/XSS payloads safely', async () => {
    const payloads = [
      '"><script>alert(1)</script>',
      "'; DROP TABLE users; --",
      '${7*7}',
      '{{constructor.constructor("return process")()}}',
      '\x00\x01\x02\x03\x04\x05',
      '🤖'.repeat(200),
      'A'.repeat(500)
    ];

    for (const p of payloads) {
      const result = await interpretUserIntent(p);
      expect(result).toBeDefined();
      expect(typeof result.explanation).toBe('string');
      expect(result.explanation.length).toBeGreaterThan(0);
    }
  });
});
