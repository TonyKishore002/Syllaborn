import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import {
  getApiBaseUrl,
  checkBackendHealth,
  requestSyllabusAnalysis,
  getStoredGeminiApiKey,
  setStoredGeminiApiKey,
  GEMINI_API_KEY_STORAGE_KEY,
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

    it('defaults to relative same-origin ("") in production mode when VITE_API_BASE_URL is unset', () => {
      const result = getApiBaseUrl({ baseUrl: '', isDev: false });
      expect(result.isConfigured).toBe(true);
      expect(result.url).toBe('');
      expect(result.error).toBeUndefined();
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
    it('calls same-origin /api/health in production when VITE_API_BASE_URL is unset', async () => {
      const mockResponse = {
        status: 'ok',
        service: 'Syllaborn AI Backend',
        serverTime: '2026-10-22T00:00:00.000Z',
        aiConfigured: true,
        provider: 'gemini',
        model: 'gemini-3.5-flash-lite',
      };

      const fetchSpy = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as any);
      global.fetch = fetchSpy;

      const health = await checkBackendHealth({ baseUrl: '', isDev: false });
      expect(health.status).toBe('ok');
      expect(health.reachable).toBe(true);
      expect(fetchSpy).toHaveBeenCalledWith('/api/health', expect.anything());
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
    it('calls same-origin /api/analyze-syllabus in production when VITE_API_BASE_URL is unset', async () => {
      const mockData = {
        course_name: 'CS 101',
        course_code: 'CS 101',
        units: [],
        assessments: [],
      };

      const fetchSpy = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: mockData }),
      } as any);
      global.fetch = fetchSpy;

      const res = await requestSyllabusAnalysis('Sample syllabus content for CS 101', {
        baseUrl: '',
        isDev: false,
      });
      expect(res.success).toBe(true);
      expect(fetchSpy).toHaveBeenCalledWith('/api/analyze-syllabus', expect.anything());
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

    it('transmits custom x-gemini-api-key header and body apiKey when configured', async () => {
      const fetchSpy = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: { course_name: 'Test Course', units: [], assessments: [] } }),
      } as any);
      global.fetch = fetchSpy;

      await requestSyllabusAnalysis('Syllabus content', {
        baseUrl: '',
        isDev: false,
        apiKey: 'AQ.TestCustomKey123',
      });

      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/analyze-syllabus',
        expect.objectContaining({
          headers: expect.objectContaining({
            'x-gemini-api-key': 'AQ.TestCustomKey123',
          }),
          body: expect.stringContaining('"apiKey":"AQ.TestCustomKey123"'),
        })
      );
    });
  });

  describe('Gemini API Key Local Storage helpers', () => {
    let mockStore: Record<string, string> = {};

    beforeEach(() => {
      mockStore = {};
      (global as any).window = {
        localStorage: {
          getItem: (key: string) => mockStore[key] || null,
          setItem: (key: string, val: string) => {
            mockStore[key] = String(val);
          },
          removeItem: (key: string) => {
            delete mockStore[key];
          },
        },
      };
    });

    it('saves and retrieves Gemini API key from localStorage', () => {
      setStoredGeminiApiKey('MOCK_GEMINI_KEY_ABC123');
      expect(getStoredGeminiApiKey()).toBe('MOCK_GEMINI_KEY_ABC123');

      setStoredGeminiApiKey('');
      expect(window.localStorage.getItem(GEMINI_API_KEY_STORAGE_KEY)).toBeNull();
      expect(getStoredGeminiApiKey().length).toBeGreaterThan(10);
    });
  });
});
