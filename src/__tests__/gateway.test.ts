import { describe, it, expect } from 'vitest';
import { handleAIIntentRequest } from '../../api/ai-intent';

describe('AI Gateway Serverless Endpoint (/api/ai-intent)', () => {
  it('should reject GET requests with 405 Method Not Allowed', async () => {
    const req = new Request('http://localhost:3000/api/ai-intent', {
      method: 'GET'
    });

    const res = await handleAIIntentRequest(req) as Response;
    expect(res.status).toBe(405);
    const data = await res.json();
    expect(data.error).toContain('POST');
  });

  it('should reject empty or malformed JSON payload with 400 Bad Request', async () => {
    const req = new Request('http://localhost:3000/api/ai-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });

    const res = await handleAIIntentRequest(req) as Response;
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('Query tidak boleh kosong');
  });

  it('should return 503 with offline_mode fallback when no API key is configured in environment', async () => {
    // Ensure no API key in test environment
    delete process.env.OPENROUTER_API_KEY;
    delete process.env.AI_API_KEY;

    const req = new Request('http://localhost:3000/api/ai-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'mau kecilin pdf' })
    });

    const res = await handleAIIntentRequest(req) as Response;
    expect(res.status).toBe(503);
    const data = await res.json();
    expect(data.status).toBe('offline_mode');
  });

  it('should respond with 204 for CORS OPTIONS preflight', async () => {
    const req = new Request('http://localhost:3000/api/ai-intent', {
      method: 'OPTIONS'
    });

    const res = await handleAIIntentRequest(req) as Response;
    expect(res.status).toBe(204);
  });
});
