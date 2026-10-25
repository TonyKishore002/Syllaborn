import { describe, it, expect } from 'vitest';
import app from '../../backend/src/server.ts';

// Helper to make lightweight local requests against Express app
function makeRequest(
  method: string,
  path: string,
  headers: Record<string, string> = {},
  body?: any
): Promise<{ status: number; headers: Record<string, string>; json: any }> {
  return new Promise((resolve, reject) => {
    // Create an ephemeral server on port 0
    const server = app.listen(0, async () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        server.close();
        return reject(new Error('Server address error'));
      }

      const port = address.port;
      try {
        const fetchOptions: RequestInit = {
          method,
          headers: {
            ...headers,
            ...(body ? { 'Content-Type': 'application/json' } : {}),
          },
          body: body ? JSON.stringify(body) : undefined,
          redirect: 'manual',
        };

        const res = await fetch(`http://127.0.0.1:${port}${path}`, fetchOptions);
        const resHeaders: Record<string, string> = {};
        res.headers.forEach((val, key) => {
          resHeaders[key.toLowerCase()] = val;
        });

        let json = null;
        const text = await res.text();
        try {
          json = JSON.parse(text);
        } catch {
          json = text;
        }

        server.close(() => {
          resolve({
            status: res.status,
            headers: resHeaders,
            json,
          });
        });
      } catch (err) {
        server.close(() => reject(err));
      }
    });
  });
}

describe('Backend Server: Health Checks & CORS Policy', () => {
  it('serves /api/health with status ok and AI configuration status', async () => {
    const res = await makeRequest('GET', '/api/health');
    expect(res.status).toBe(200);
    expect(res.json.status).toBe('ok');
    expect(res.json.service).toBe('Syllaborn AI Backend');
    expect(typeof res.json.aiConfigured).toBe('boolean');
    expect(typeof res.json.serverTime).toBe('string');
  });

  it('provides /health route alias serving health check directly for Render/cloud probes', async () => {
    const res = await makeRequest('GET', '/health');
    expect(res.status).toBe(200);
    expect(res.json.status).toBe('ok');
  });

  it('allows CORS for Vercel production domain https://syllaborn.vercel.app', async () => {
    const res = await makeRequest('OPTIONS', '/api/health', {
      origin: 'https://syllaborn.vercel.app',
      'access-control-request-method': 'GET',
    });

    expect(res.status).toBe(204);
    expect(res.headers['access-control-allow-origin']).toBe('https://syllaborn.vercel.app');
  });

  it('allows CORS for Vercel preview deployment domains matching *.vercel.app', async () => {
    const res = await makeRequest('OPTIONS', '/api/analyze-syllabus', {
      origin: 'https://syllaborn-git-preview-tony.vercel.app',
      'access-control-request-method': 'POST',
    });

    expect(res.status).toBe(204);
    expect(res.headers['access-control-allow-origin']).toBe(
      'https://syllaborn-git-preview-tony.vercel.app'
    );
  });

  it('allows CORS for local development origin http://localhost:5173', async () => {
    const res = await makeRequest('OPTIONS', '/api/analyze-syllabus', {
      origin: 'http://localhost:5173',
      'access-control-request-method': 'POST',
    });

    expect(res.status).toBe(204);
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });

  it('blocks CORS for unauthorized external origins without 500 error', async () => {
    const res = await makeRequest('OPTIONS', '/api/health', {
      origin: 'https://malicious-site.example.com',
      'access-control-request-method': 'GET',
    });

    // Should not return Access-Control-Allow-Origin header
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('validates syllabus payload on /api/analyze-syllabus and returns 400 on too short text', async () => {
    const res = await makeRequest(
      'POST',
      '/api/analyze-syllabus',
      { origin: 'http://localhost:5173' },
      { text: 'Too short' }
    );

    expect(res.status).toBe(400);
    expect(res.json.error).toBe('Validation Error');
  });

  it('allows x-gemini-api-key header in CORS preflight requests', async () => {
    const res = await makeRequest('OPTIONS', '/api/analyze-syllabus', {
      origin: 'https://syllaborn.vercel.app',
      'access-control-request-method': 'POST',
      'access-control-request-headers': 'content-type, x-gemini-api-key',
    });

    expect(res.status).toBe(204);
    expect(res.headers['access-control-allow-origin']).toBe('https://syllaborn.vercel.app');
    expect(res.headers['access-control-allow-headers']).toContain('x-gemini-api-key');
  });
});
