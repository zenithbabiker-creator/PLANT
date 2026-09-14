/**
 * Remote Sensing & ESA Satellite API Network Service (Client-Side)
 * 
 * Routes queries to external server via VITE_API_BASE_URL
 */

import { apiClient, API_ENDPOINTS } from '../apiClient';
import { FieldHealthResponseDTO, RemoteSensingQueryDTO } from '../dto/remoteSensing.dto';

export interface IRemoteSensingApiService {
  fetchFieldHealthAdvisory(
    query: RemoteSensingQueryDTO,
    abortSignal?: AbortSignal
  ): Promise<FieldHealthResponseDTO | null>;
}

export class RemoteSensingApiService implements IRemoteSensingApiService {
  /**
   * Requests remote sensing analysis from the external server based on GPS coordinates.
   */
  public async fetchFieldHealthAdvisory(
    query: RemoteSensingQueryDTO,
    abortSignal?: AbortSignal
  ): Promise<FieldHealthResponseDTO | null> {
    try {
      const response = await apiClient.get<FieldHealthResponseDTO>(
        API_ENDPOINTS.REMOTE_SENSING,
        {
          lat: query.latitude,
          lng: query.longitude,
          radius: query.radiusMeters,
          crop: query.cropType || 'sorghum',
          deviceId: query.deviceId || apiClient.getDeviceId()
        },
        { signal: abortSignal, timeoutMs: 15000 }
      );

      if (response.ok && response.data) {
        return response.data;
      }
      return null;
    } catch (err: any) {
      console.warn('Remote sensing fetch notice:', err?.message || err);
      return null;
    }
  }
}
