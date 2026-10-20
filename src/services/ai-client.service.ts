import { AISyllabusResponse } from '../types';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') || 'http://localhost:3001';

export interface BackendHealth {
  status: string;
  service: string;
  serverTime: string;
  aiConfigured: boolean;
  model: string;
  reachable: boolean;
  error?: string;
}

export async function checkBackendHealth(): Promise<BackendHealth> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(`${API_BASE_URL}/api/health`, {
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
    return {
      status: 'offline',
      service: 'Syllaborn Backend',
      serverTime: new Date().toISOString(),
      aiConfigured: false,
      model: 'unknown',
      reachable: false,
      error:
        err.name === 'AbortError'
          ? 'Backend health check timed out (4s)'
          : 'Could not connect to the backend server at ' + API_BASE_URL,
    };
  }
}

export async function requestSyllabusAnalysis(
  extractedText: string
): Promise<{ success: boolean; data?: AISyllabusResponse; error?: string }> {
  try {
    const controller = new AbortController();
    // 60-second timeout for AI processing of lengthy syllabus documents
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    const res = await fetch(`${API_BASE_URL}/api/analyze-syllabus`, {
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

    const json = await res.json();

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
        error: 'AI analysis request timed out after 60 seconds. You can retry with a shorter excerpt or review manually.',
      };
    }
    return {
      success: false,
      error:
        'Failed to contact AI backend at ' +
        API_BASE_URL +
        '. Please verify the backend is running and reachable.',
    };
  }
}
