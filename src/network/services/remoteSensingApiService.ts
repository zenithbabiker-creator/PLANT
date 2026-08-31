/**
 * Remote Sensing & ESA Satellite API Network Service (Client-Side)
 * 
 * Strict Constraint: All remote sensing, ESA Copernicus Sentinel-2 band calculations,
 * and vegetation anomaly detections are performed entirely on the external server.
 * This client service only fetches the computed results.
 */

import { AppNetworkConfig } from '../config';
import { FieldHealthResponseDTO, RemoteSensingQueryDTO } from '../dto/remoteSensing.dto';

export interface IRemoteSensingApiService {
  fetchFieldHealthAdvisory(
    query: RemoteSensingQueryDTO,
    abortSignal?: AbortSignal
  ): Promise<FieldHealthResponseDTO | null>;
}

export class RemoteSensingApiService implements IRemoteSensingApiService {
  private networkConfig: AppNetworkConfig;

  constructor(networkConfig?: AppNetworkConfig) {
    this.networkConfig = networkConfig || AppNetworkConfig.getInstance();
  }

  /**
   * Requests remote sensing analysis from the external server based on GPS coordinates.
   */
  public async fetchFieldHealthAdvisory(
    query: RemoteSensingQueryDTO,
    abortSignal?: AbortSignal
  ): Promise<FieldHealthResponseDTO | null> {
    const config = this.networkConfig.getConfig();
    const endpoint = new URL(config.endpoints.getRemoteSensingHealth);
    
    endpoint.searchParams.set('lat', query.latitude.toString());
    endpoint.searchParams.set('lng', query.longitude.toString());
    if (query.radiusMeters) {
      endpoint.searchParams.set('radius', query.radiusMeters.toString());
    }
    if (query.cropType) {
      endpoint.searchParams.set('crop', query.cropType);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeoutMs);

    if (abortSignal) {
      abortSignal.addEventListener('abort', () => controller.abort());
    }

    try {
      const response = await fetch(endpoint.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-Device-Id': query.deviceId || this.networkConfig.getDeviceId()
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Remote sensing query failed: HTTP ${response.status}`);
      }

      const data: FieldHealthResponseDTO = await response.json();
      return data;
    } catch (err: any) {
      clearTimeout(timeoutId);
      // Log for diagnostic tracing without breaking client UI
      console.warn('Remote sensing fetch notice:', err?.message || err);
      return null;
    }
  }
}
