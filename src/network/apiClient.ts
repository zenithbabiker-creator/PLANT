/**
 * Centralized API Client & Network Service Architecture
 * Powered by Vite Environment Variable: import.meta.env.VITE_API_BASE_URL
 * 
 * Strict Constraint: All network calls route through this unified client
 * ensuring dynamic endpoint construction, timeout management, and device header injection.
 */

// Dynamically extract the API Base URL from Vite environment variable
export function getApiBaseUrl(): string {
  const envUrl = (import.meta as any).env?.VITE_API_BASE_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim().length > 0) {
    return envUrl.trim().replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin.replace(/\/+$/, '');
  }
  return 'https://plant-backend-2ceh.onrender.com';
}

export interface RequestOptions extends RequestInit {
  timeoutMs?: number;
  params?: Record<string, string | number | boolean | undefined>;
}

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  ok: boolean;
  message?: string;
}

export class ApiClient {
  private static instance: ApiClient;
  private customBaseUrl: string | null = null;
  private defaultTimeout: number = 15000;

  private constructor() {}

  public static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  public setBaseUrl(url: string): void {
    if (url && url.trim().length > 0) {
      this.customBaseUrl = url.trim().replace(/\/+$/, '');
    } else {
      this.customBaseUrl = null;
    }
  }

  public getBaseUrl(): string {
    return this.customBaseUrl || getApiBaseUrl();
  }

  /**
   * Resolves a dynamic relative endpoint against the current base URL.
   * Example: buildUrl('/sorghum/diagnoses/upload') -> 'https://plant-backend-2ceh.onrender.com/sorghum/diagnoses/upload'
   */
  public buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
    const base = this.getBaseUrl();
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const fullUrl = `${base}${cleanPath}`;

    if (!params) return fullUrl;

    try {
      const url = new URL(fullUrl);
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          url.searchParams.set(key, String(val));
        }
      });
      return url.toString();
    } catch {
      // Fallback if URL parsing fails on relative strings
      const queryParams = Object.entries(params)
        .filter(([_, val]) => val !== undefined && val !== null)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join('&');
      return queryParams ? `${fullUrl}?${queryParams}` : fullUrl;
    }
  }

  /**
   * Retrieves persistent device ID for agricultural telemetry
   */
  public getDeviceId(): string {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = window.localStorage.getItem('sorghum_device_client_id');
      if (stored) return stored;
      const generated = 'and_dev_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36);
      window.localStorage.setItem('sorghum_device_client_id', generated);
      return generated;
    }
    return 'and_dev_' + Math.random().toString(36).substring(2, 10);
  }

  /**
   * Core request dispatcher with automatic JSON handling and timeout guards
   */
  public async request<T = any>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const { timeoutMs = this.defaultTimeout, params, headers = {}, ...customConfig } = options;
    const url = this.buildUrl(endpoint, params);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    if (options.signal) {
      options.signal.addEventListener('abort', () => controller.abort());
    }

    const defaultHeaders: Record<string, string> = {
      'Accept': 'application/json',
      'X-Device-Id': this.getDeviceId(),
      'X-Client-Version': '1.0.0-react-vite',
    };

    if (customConfig.body && typeof customConfig.body === 'string') {
      defaultHeaders['Content-Type'] = 'application/json';
    }

    try {
      const response = await fetch(url, {
        ...customConfig,
        headers: {
          ...defaultHeaders,
          ...(headers as Record<string, string>)
        },
        signal: controller.signal
      });

      clearTimeout(timer);

      let responseData: any;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }

      if (!response.ok) {
        throw new Error(responseData?.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return {
        data: responseData as T,
        status: response.status,
        ok: response.ok
      };
    } catch (error: any) {
      clearTimeout(timer);
      const isAbort = error?.name === 'AbortError';
      return {
        data: null as any,
        status: isAbort ? 408 : 0,
        ok: false,
        message: isAbort ? 'Request Timeout' : (error?.message || 'Network Request Failed')
      };
    }
  }

  public async get<T = any>(endpoint: string, params?: Record<string, any>, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET', params });
  }

  public async post<T = any>(endpoint: string, body?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined
    });
  }
}

export const apiClient = ApiClient.getInstance();

/**
 * Declared Dynamic Endpoints Catalog
 */
export const API_ENDPOINTS = {
  HEALTH: '/api/health',
  CLIENT_IP: '/api/ip',
  UPLOAD_DIAGNOSIS: '/sorghum/diagnoses/upload',
  DIAGNOSES: '/api/diagnoses',
  SYNC_BATCH: '/api/sync',
  REMOTE_SENSING: '/remote-sensing/field-health',
  SMS_ALERTS: '/advisories/sms-alerts',
  REGISTER_DEVICE: '/devices/register'
} as const;
