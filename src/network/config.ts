/**
 * Client-Side Network & API Configuration
 * Android Clean Architecture Layer
 * 
 * Configured via Vite Environment: import.meta.env.VITE_API_BASE_URL
 */

import { apiClient, API_ENDPOINTS, getApiBaseUrl } from './apiClient';

export interface NetworkConfig {
  baseUrl: string;
  endpoints: {
    uploadDiagnosis: string;
    getRemoteSensingHealth: string;
    getFarmerAlerts: string;
    registerDeviceToken: string;
    clientIp: string;
    health: string;
  };
  timeoutMs: number;
  retryAttempts: number;
}

export class AppNetworkConfig {
  private static instance: AppNetworkConfig;

  private constructor() {}

  public static getInstance(): AppNetworkConfig {
    if (!AppNetworkConfig.instance) {
      AppNetworkConfig.instance = new AppNetworkConfig();
    }
    return AppNetworkConfig.instance;
  }

  public getBaseUrl(): string {
    return apiClient.getBaseUrl();
  }

  public setBaseUrl(newUrl: string): void {
    apiClient.setBaseUrl(newUrl);
  }

  public getConfig(): NetworkConfig {
    const base = this.getBaseUrl();
    return {
      baseUrl: base,
      endpoints: {
        uploadDiagnosis: apiClient.buildUrl(API_ENDPOINTS.UPLOAD_DIAGNOSIS),
        getRemoteSensingHealth: apiClient.buildUrl(API_ENDPOINTS.REMOTE_SENSING),
        getFarmerAlerts: apiClient.buildUrl(API_ENDPOINTS.SMS_ALERTS),
        registerDeviceToken: apiClient.buildUrl(API_ENDPOINTS.REGISTER_DEVICE),
        clientIp: apiClient.buildUrl(API_ENDPOINTS.CLIENT_IP),
        health: apiClient.buildUrl(API_ENDPOINTS.HEALTH)
      },
      timeoutMs: 15000,
      retryAttempts: 3
    };
  }

  public getDeviceId(): string {
    return apiClient.getDeviceId();
  }
}
