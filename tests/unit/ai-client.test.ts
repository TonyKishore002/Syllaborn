import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  getApiBaseUrl,
  checkBackendHealth,
  requestSyllabusAnalysis,
} from '../../src/services/ai-client.service';

describe('ai-client.service: API Base URL and Production Safeguards', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getApiBaseUrl', () => {
    it('uses localhost:3001 as fallback in development mode when VITE_API_BASE_URL is not set', () => {
      const result = getApiBaseUrl({ baseUrl: '', isDev: true });
      expect(result.isConfigured).toBe(true);
      expect(result.url).toBe('http://localhost:3001');
      expect(result.error).toBeUndefined();
    });

    it('uses configured VITE_API_BASE_URL in dev mode and strips trailing slashes', () => {
      const result = getApiBaseUrl({ baseUrl: 'http://localhost:8080///', isDev: true });
      expect(result.isConfigured).toBe(true);
      expect(result.url).toBe('http://localhost:8080');
    });

    it('NEVER falls back to localhost in production mode when VITE_API_BASE_URL is missing', () => {
      const result = getApiBaseUrl({ baseUrl: '', isDev: false });
      expect(result.isConfigured).toBe(false);
      expect(result.url).toBe('');
      expect(result.error).toContain('AI backend is not configured for production');
      expect(result.error).toContain('VITE_API_BASE_URL');
      expect(result.error).not.toContain('localhost:3001');
    });

    it('rejects localhost and 127.0.0.1 in production mode with an actionable configuration error', () => {
      const result = getApiBaseUrl({ baseUrl: 'http://localhost:3001', isDev: false });
      expect(result.isConfigured).toBe(false);
      expect(result.url).toBe('');
      expect(result.error).toContain('Configuration Error');
      expect(result.error).toContain('localhost');
      expect(result.error).toContain('Vercel');
    });

    it('rejects 127.0.0.1 in production mode', () => {
      const result = getApiBaseUrl({ baseUrl: 'http://127.0.0.1:3001', isDev: false });
      expect(result.isConfigured).toBe(false);
      expect(result.error).toContain('Configuration Error');
    });

    it('accepts a valid production HTTPS backend URL in production mode', () => {
      const result = getApiBaseUrl({
        baseUrl: 'https://syllaborn-backend.onrender.com/',
        isDev: false,
      });
      expect(result.isConfigured).toBe(true);
      expect(result.url).toBe('https://syllaborn-backend.onrender.com');
      expect(result.error).toBeUndefined();
    });
  });

  describe('checkBackendHealth', () => {
    it('returns unconfigured status in production when VITE_API_BASE_URL is unset', async () => {
      const health = await checkBackendHealth({ baseUrl: '', isDev: false });
      expect(health.status).toBe('unconfigured');
      expect(health.reachable).toBe(false);
      expect(health.error).toContain('VITE_API_BASE_URL');
    });

    it('returns healthy status when backend health endpoint succeeds', async () => {
      const mockResponse = {
        status: 'ok',
        service: 'Syllaborn AI Backend',
        serverTime: '2026-10-22T00:00:00.000Z',
        aiConfigured: true,
        provider: 'gemini',
        model: 'gemini-3.5-flash-lite',
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as any);

      const health = await checkBackendHealth({ baseUrl: 'http://localhost:3001', isDev: true });
      expect(health.status).toBe('ok');
      expect(health.reachable).toBe(true);
      expect(health.aiConfigured).toBe(true);
      expect(health.model).toBe('gemini-3.5-flash-lite');
    });

    it('returns offline status when fetch rejects', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network connection refused'));

      const health = await checkBackendHealth({ baseUrl: 'http://localhost:3001', isDev: true });
      expect(health.status).toBe('offline');
      expect(health.reachable).toBe(false);
      expect(health.error).toContain('Could not connect to the backend server');
    });
  });

  describe('requestSyllabusAnalysis', () => {
    it('returns immediate error without attempting fetch if backend is unconfigured in production', async () => {
      const fetchSpy = vi.fn();
      global.fetch = fetchSpy;

      const res = await requestSyllabusAnalysis('Sample syllabus content for CS 101', {
        baseUrl: '',
        isDev: false,
      });
      expect(res.success).toBe(false);
      expect(res.error).toContain('AI backend is not configured for production');
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('returns extracted AI data when backend successfully analyzes syllabus', async () => {
      const mockData = {
        course_name: 'Data Structures and Algorithms',
        course_code: 'CS 201',
        regionName: 'The Binary Spire',
        units: [],
        assessments: [],
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: mockData }),
      } as any);

      const res = await requestSyllabusAnalysis('Valid syllabus with course modules and exams', {
        baseUrl: 'http://localhost:3001',
        isDev: true,
      });
      expect(res.success).toBe(true);
      expect(res.data?.course_name).toBe('Data Structures and Algorithms');
    });

    it('handles backend error responses gracefully', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => ({ error: 'AI Key Missing', message: 'API key not configured' }),
      } as any);

      const res = await requestSyllabusAnalysis('Syllabus content', {
        baseUrl: 'http://localhost:3001',
        isDev: true,
      });
      expect(res.success).toBe(false);
      expect(res.error).toBe('API key not configured');
    });
  });
});
