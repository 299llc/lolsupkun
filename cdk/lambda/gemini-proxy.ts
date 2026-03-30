import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';

const secrets = new SecretsManagerClient({});
let cachedApiKey: string | null = null;
let cachedAppSecret: string | null = null;

const ALLOWED_ACTIONS = new Set([
  'generateContent',
  'interactions',
  'cachedContents',
  'cachedContents:delete',
]);

async function getAppSecret(): Promise<string> {
  if (cachedAppSecret) return cachedAppSecret;
  const arn = process.env.APP_SECRET_ARN;
  if (!arn) return '';
  const res = await secrets.send(
    new GetSecretValueCommand({ SecretId: arn })
  );
  cachedAppSecret = res.SecretString || '';
  return cachedAppSecret;
}

// IPレート制限（簡易実装: メモリ内、Lambda再起動でリセット）
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_PER_MINUTE = 30;

async function getApiKey(): Promise<string> {
  if (cachedApiKey) return cachedApiKey;
  const res = await secrets.send(
    new GetSecretValueCommand({ SecretId: process.env.SECRET_NAME })
  );
  cachedApiKey = res.SecretString || '';
  return cachedApiKey;
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  entry.count++;
  return entry.count <= RATE_LIMIT_PER_MINUTE;
}

interface LambdaEvent {
  headers?: Record<string, string | undefined>;
  body?: string;
  requestContext?: {
    http?: { sourceIp?: string; method?: string };
  };
}

interface ProxyRequest {
  action: string;
  model?: string;
  body: Record<string, unknown>;
  cacheName?: string;
}

export async function handler(event: LambdaEvent) {
  // CORS preflight
  if (event.requestContext?.http?.method === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders(), body: '' };
  }

  // アプリ固有シークレットの検証
  const appSecret = await getAppSecret();
  const authHeader = event.headers?.['x-app-secret'] || event.headers?.['X-App-Secret'] || '';
  if (appSecret && authHeader !== appSecret) {
    return respond(403, { error: 'Forbidden' });
  }

  // レート制限
  const ip = event.requestContext?.http?.sourceIp || 'unknown';
  if (!checkRateLimit(ip)) {
    return respond(429, { error: 'Too many requests' });
  }

  let req: ProxyRequest;
  try {
    req = JSON.parse(event.body || '{}');
  } catch {
    return respond(400, { error: 'Invalid JSON' });
  }

  if (!req.action || !ALLOWED_ACTIONS.has(req.action)) {
    return respond(400, { error: `Invalid action: ${req.action}` });
  }

  const apiKey = await getApiKey();

  try {
    let geminiRes: Response;

    if (req.action === 'generateContent') {
      const model = req.model || 'gemini-2.5-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      geminiRes = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body),
      });
    } else if (req.action === 'interactions') {
      const url = 'https://generativelanguage.googleapis.com/v1beta/interactions';
      geminiRes = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify(req.body),
      });
    } else if (req.action === 'cachedContents') {
      const url = `https://generativelanguage.googleapis.com/v1beta/cachedContents?key=${apiKey}`;
      geminiRes = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body),
      });
    } else if (req.action === 'cachedContents:delete') {
      const url = `https://generativelanguage.googleapis.com/v1beta/${req.cacheName}?key=${apiKey}`;
      geminiRes = await fetch(url, { method: 'DELETE' });
    } else {
      return respond(400, { error: 'Unknown action' });
    }

    const responseBody = await geminiRes.text();
    return {
      statusCode: geminiRes.status,
      headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
      body: responseBody,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[gemini-proxy] Error:', message);
    return respond(502, { error: 'Proxy error', detail: message });
  }
}

function respond(statusCode: number, body: Record<string, unknown>) {
  return {
    statusCode,
    headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, X-App-Secret',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}
