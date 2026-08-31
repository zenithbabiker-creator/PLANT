/**
 * Client-Side Network & API Configuration
 * Android Clean Architecture Layer
 * 
 * NOTE: All URLs are configurable and contain NO server-side logic.
 * The external server is solely responsible for handling, directory partitioning,
 * satellite ESA data processing, and persistence.
 */

export interface NetworkConfig {
  baseUrl: string;
  endpoints: {
    uploadDiagnosis: string;
    getRemoteSensingHealth: string;
    getFarmerAlerts: string;
    registerDeviceToken: string;
  };
  timeoutMs: number;
  retryAttempts: number;
}

const DEFAULT_BASE_URL = typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL
  ? (import.meta as any).env.VITE_API_BASE_URL
  : 'https://plant-backend-2ceh.onrender.com';

export class AppNetworkConfig {
  private static instance: AppNetworkConfig;
  private currentBaseUrl: string = DEFAULT_BASE_URL;
  private deviceId: string = '';

  private constructor() {
    this.deviceId = this.getOrGenerateDeviceId();
  }

  public static getInstance(): AppNetworkConfig {
    if (!AppNetworkConfig.instance) {
      AppNetworkConfig.instance = new AppNetworkConfig();
    }
    return AppNetworkConfig.instance;
  }

  public getBaseUrl(): string {
    return this.currentBaseUrl;
  }

  public setBaseUrl(newUrl: string): void {
    if (newUrl && newUrl.trim().length > 0) {
      this.currentBaseUrl = newUrl.trim().replace(/\/+$/, '');
    }
  }

  public getConfig(): NetworkConfig {
    const base = this.currentBaseUrl;
    return {
      baseUrl: base,
      endpoints: {
        uploadDiagnosis: `${base}/sorghum/diagnoses/upload`,
        getRemoteSensingHealth: `${base}/remote-sensing/field-health`,
        getFarmerAlerts: `${base}/advisories/sms-alerts`,
        registerDeviceToken: `${base}/devices/register`
      },
      timeoutMs: 15000,
      retryAttempts: 3
    };
  }

  /**
   * Retrieves or initializes a persistent unique client device identifier (UUID / Android ID abstraction)
   */
  public getDeviceId(): string {
    if (!this.deviceId) {
      this.deviceId = this.getOrGenerateDeviceId();
    }
    return this.deviceId;
  }

  private getOrGenerateDeviceId(): string {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = window.localStorage.getItem('sorghum_device_client_id');
      if (stored) return stored;
      const generated = 'and_dev_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36);
      window.localStorage.setItem('sorghum_device_client_id', generated);
      return generated;
    }
    return 'and_dev_' + Math.random().toString(36).substring(2, 10);
  }
}
