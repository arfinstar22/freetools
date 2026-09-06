import type { IncomingMessage, ServerResponse } from 'http';

// Minimal Tool Allowlist for lightweight serverless invocation without heavy imports
const ALLOWLISTED_TOOLS = [
  'compress-pdf', 'merge-pdf', 'split-pdf', 'jpg-to-pdf', 'pdf-to-jpg',
  'image-compress', 'image-resize', 'image-convert', 'remove-metadata', 'batch-image-processor',
  'word-counter', 'text-cleaner', 'diff-checker', 'case-converter', 'remove-duplicates', 'find-replace',
  'json-formatter', 'base64-tool', 'uuid-generator', 'jwt-decoder', 'timestamp-converter', 'regex-tester',
  'invoice-generator', 'csv-json-converter', 'expense-splitter', 'random-group', 'zip-pack'
];

const SYSTEM_PROMPT = `Kamu adalah AI Intent Assistant untuk "FreeTools" (utility workspace client-side lokal & gratis).
Tugasmu adalah mengubah kebutuhan natural language pengguna (Bahasa Indonesia) menjadi structured intent & rekomendasi tool yang terdaftar di FreeTools.

DAFTAR TOOL ALLOWLIST RESMI:
${ALLOWLISTED_TOOLS.join(', ')}

ATURAN KEAMANAN & FORMAT:
1. HANYA rekomendasikan tool ID dari allowlist di atas. Jangan mengarang ID tool baru.
2. Jawab HANYA dalam format JSON valid murni:
{
  "goal": "Ringkasan tujuan (maks 6 kata)",
  "confidence": 0.95,
  "primaryTool": "id-tool-dari-allowlist",
  "actions": [
    {
      "tool": "id-tool-dari-allowlist",
      "options": {}
    }
  ],
  "explanation": "Penjelasan singkat ramah 1 kalimat Bahasa Indonesia"
}
3. Jika permintaan tidak relevan dengan tool yang tersedia, set confidence <= 0.3 dan primaryTool null.`;

export async function handleAIIntentRequest(req: Request | IncomingMessage, res?: ServerResponse): Promise<Response | void> {
  // Support Web Standard Request (Vercel Edge / Cloudflare) and Node IncomingMessage (Vercel Serverless / Vite middleware)
  let method = 'GET';
  let bodyText = '';

  if (req instanceof Request) {
    method = req.method;
    try {
      bodyText = await req.text();
    } catch {
      bodyText = '';
    }
  } else {
    method = req.method || 'GET';
    bodyText = await new Promise<string>((resolve) => {
      let data = '';
      req.on('data', (chunk) => {
        data += chunk;
        if (data.length > 5000) {
          data = '';
          req.destroy();
        }
      });
      req.on('end', () => resolve(data));
      req.on('error', () => resolve(''));
    });
  }

  // Set CORS headers
  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  if (method === 'OPTIONS') {
    if (res) {
      res.writeHead(204, corsHeaders);
      res.end();
      return;
    }
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (method !== 'POST') {
    const errPayload = JSON.stringify({ error: 'Metode tidak didukung. Gunakan POST.' });
    if (res) {
      res.writeHead(405, corsHeaders);
      res.end(errPayload);
      return;
    }
    return new Response(errPayload, { status: 405, headers: corsHeaders });
  }

  let query = '';
  try {
    const parsed = JSON.parse(bodyText || '{}');
    query = typeof parsed.query === 'string' ? parsed.query.trim().slice(0, 500) : '';
  } catch {
    const errPayload = JSON.stringify({ error: 'Format body request tidak valid (wajib JSON).' });
    if (res) {
      res.writeHead(400, corsHeaders);
      res.end(errPayload);
      return;
    }
    return new Response(errPayload, { status: 400, headers: corsHeaders });
  }

  if (!query) {
    const errPayload = JSON.stringify({ error: 'Query tidak boleh kosong.' });
    if (res) {
      res.writeHead(400, corsHeaders);
      res.end(errPayload);
      return;
    }
    return new Response(errPayload, { status: 400, headers: corsHeaders });
  }

  const apiKey = process.env.OPENROUTER_API_KEY || process.env.AI_API_KEY;
  const model = process.env.OPENROUTER_MODEL || process.env.AI_MODEL || 'meta-llama/llama-3.3-70b-instruct:free';

  if (!apiKey) {
    const fallbackPayload = JSON.stringify({
      status: 'offline_mode',
      message: 'AI Gateway API key belum dikonfigurasi. Menggunakan engine rule lokal.'
    });
    if (res) {
      res.writeHead(503, corsHeaders);
      res.end(fallbackPayload);
      return;
    }
    return new Response(fallbackPayload, { status: 503, headers: corsHeaders });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://freetools-darfin.my.id',
        'X-Title': 'FreeTools'
      },
      body: JSON.stringify({
        model,
        temperature: 0.1,
        max_tokens: 400,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: query }
        ]
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!openRouterResponse.ok) {
      throw new Error(`OpenRouter HTTP ${openRouterResponse.status}`);
    }

    const aiData: any = await openRouterResponse.json();
    const rawContent: string = aiData?.choices?.[0]?.message?.content || '';

    // Clean JSON content if wrapped in markdown
    const cleanedJson = rawContent.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    const parsedAction = JSON.parse(cleanedJson);

    const successPayload = JSON.stringify(parsedAction);
    if (res) {
      res.writeHead(200, corsHeaders);
      res.end(successPayload);
      return;
    }
    return new Response(successPayload, { status: 200, headers: corsHeaders });
  } catch (err: any) {
    const errPayload = JSON.stringify({
      error: 'Gagal menghubungi penyedia AI.',
      detail: err.message || 'Unknown error'
    });
    if (res) {
      res.writeHead(502, corsHeaders);
      res.end(errPayload);
      return;
    }
    return new Response(errPayload, { status: 502, headers: corsHeaders });
  }
}

// Default export for Vercel Serverless Functions
export default async function handler(req: any, res: any) {
  return handleAIIntentRequest(req, res);
}
