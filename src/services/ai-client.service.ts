import { AISyllabusResponse } from '../types';

export interface ApiBaseUrlResult {
  url: string;
  isConfigured: boolean;
  error?: string;
}

/**
 * Resolves the backend API base URL based on Vite environment variables.
 * - In development (import.meta.env.DEV), falls back to http://localhost:3001 if omitted.
 * - In production, if VITE_API_BASE_URL is omitted, defaults to same-origin relative URLs (''),
 *   which automatically routes to /api on Vercel or reverse-proxy deployments.
 * - In production, explicitly rejects http://localhost / 127.0.0.1 to prevent broken local calls.
 */
export function getApiBaseUrl(overrideEnv?: { baseUrl?: string; isDev?: boolean }): ApiBaseUrlResult {
  const envUrl = (
    overrideEnv?.baseUrl !== undefined
      ? overrideEnv.baseUrl
      : (import.meta.env.VITE_API_BASE_URL || '')
  ).trim();

  const isDev =
    overrideEnv?.isDev !== undefined
      ? overrideEnv.isDev
      : (Boolean(import.meta.env.DEV) && import.meta.env.MODE !== 'production');

  if (envUrl) {
    const cleaned = envUrl.replace(/\/+$/, '');

    // In production, reject localhost/127.0.0.1 configurations
    if (!isDev) {
      try {
        const parsed = new URL(cleaned);
        if (
          parsed.hostname === 'localhost' ||
          parsed.hostname === '127.0.0.1' ||
          parsed.hostname === '0.0.0.0'
        ) {
          return {
            url: '',
            isConfigured: false,
            error:
              `Configuration Error: VITE_API_BASE_URL is set to "${cleaned}" in a production build. ` +
              `Please update VITE_API_BASE_URL in your Vercel project settings to your deployed backend URL ` +
              `(e.g., https://your-backend.onrender.com) or remove it to use the same-origin Vercel backend, and redeploy.`,
          };
        }
      } catch {
        return {
          url: '',
          isConfigured: false,
          error:
            `Configuration Error: VITE_API_BASE_URL ("${cleaned}") is not a valid URL. ` +
            `Please configure a valid HTTPS URL or remove it to use the same-origin backend.`,
        };
      }
    }

    return { url: cleaned, isConfigured: true };
  }

  // Development mode fallback: local backend on port 3001
  if (isDev) {
    return { url: 'http://localhost:3001', isConfigured: true };
  }

  // Production with no VITE_API_BASE_URL configured:
  // Default to same-origin relative URL ('') so requests route directly to /api on Vercel!
  return {
    url: '',
    isConfigured: true,
  };
}

export interface BackendHealth {
  status: string;
  service: string;
  serverTime: string;
  aiConfigured: boolean;
  model: string;
  reachable: boolean;
  error?: string;
  provider?: string;
}

export async function checkBackendHealth(
  overrideEnv?: { baseUrl?: string; isDev?: boolean }
): Promise<BackendHealth> {
  const { url: baseUrl, isConfigured, error: configError } = getApiBaseUrl(overrideEnv);

  if (!isConfigured) {
    return {
      status: 'unconfigured',
      service: 'Syllaborn AI Backend',
      serverTime: new Date().toISOString(),
      aiConfigured: false,
      model: 'unknown',
      reachable: false,
      error: configError || 'Backend API URL configuration error.',
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const healthUrl = baseUrl ? `${baseUrl}/api/health` : '/api/health';
    const res = await fetch(healthUrl, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return {
        status: 'error',
        service: 'Syllaborn Backend',
        serverTime: new Date().toISOString(),
        aiConfigured: false,
        model: 'unknown',
        reachable: true,
        error: `Server responded with status HTTP ${res.status}`,
      };
    }

    const data = await res.json();
    return {
      ...data,
      reachable: true,
    };
  } catch (err: any) {
    const target = baseUrl || 'same-origin (/api)';
    return {
      status: 'offline',
      service: 'Syllaborn Backend',
      serverTime: new Date().toISOString(),
      aiConfigured: false,
      model: 'unknown',
      reachable: false,
      error:
        err.name === 'AbortError'
          ? 'Backend health check timed out (5s)'
          : `Could not connect to the backend server at ${target}. Please ensure the backend is running.`,
    };
  }
}

export async function requestSyllabusAnalysis(
  extractedText: string,
  overrideEnv?: { baseUrl?: string; isDev?: boolean }
): Promise<{ success: boolean; data?: AISyllabusResponse; error?: string }> {
  const { url: baseUrl, isConfigured, error: configError } = getApiBaseUrl(overrideEnv);

  if (!isConfigured) {
    return {
      success: false,
      error: configError || 'Backend API URL configuration error.',
    };
  }

  try {
    const controller = new AbortController();
    // 60-second timeout for AI processing of lengthy syllabus documents
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    const apiUrl = baseUrl ? `${baseUrl}/api/analyze-syllabus` : '/api/analyze-syllabus';
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: extractedText,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        success: false,
        error: json.message || json.error || `Server returned HTTP ${res.status}`,
      };
    }

    return {
      success: true,
      data: json.data,
    };
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return {
        success: false,
        error:
          'AI analysis request timed out after 60 seconds. You can retry with a shorter excerpt or review manually.',
      };
    }
    const target = baseUrl || 'the AI backend at /api';
    return {
      success: false,
      error:
        `Failed to contact ${target}. Please verify the backend is running and reachable.`,
    };
  }
}
