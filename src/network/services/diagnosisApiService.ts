/**
 * Diagnosis API Network Service
 * Client-Side Dispatcher for Sorghum Diagnosis Payloads
 * 
 * Routes through the centralized apiClient using VITE_API_BASE_URL
 */

import { apiClient, API_ENDPOINTS } from '../apiClient';
import { PlantDiagnosisPayloadDTO, DiagnosisUploadResponseDTO } from '../dto/diagnosisPayload.dto';

export interface IDiagnosisApiService {
  uploadDiagnosisPayload(
    payload: PlantDiagnosisPayloadDTO,
    abortSignal?: AbortSignal
  ): Promise<DiagnosisUploadResponseDTO>;
}

export class DiagnosisApiService implements IDiagnosisApiService {
  /**
   * Dispatches the packaged diagnosis payload to the external server via VITE_API_BASE_URL.
   * The server handles file storage by disease folder, indexing, and persistence.
   */
  public async uploadDiagnosisPayload(
    payload: PlantDiagnosisPayloadDTO,
    abortSignal?: AbortSignal
  ): Promise<DiagnosisUploadResponseDTO> {
    try {
      const response = await apiClient.post<DiagnosisUploadResponseDTO>(
        API_ENDPOINTS.UPLOAD_DIAGNOSIS,
        payload,
        { signal: abortSignal, timeoutMs: 20000 }
      );

      if (response.ok && response.data) {
        return {
          ...response.data,
          success: response.data.success ?? true,
          statusCode: response.status
        };
      }

      return {
        success: false,
        receivedTimestampUtc: Date.now(),
        message: response.message || `Server returned HTTP ${response.status}`,
        statusCode: response.status || 0
      };
    } catch (err: any) {
      return {
        success: false,
        receivedTimestampUtc: Date.now(),
        message: err?.message || 'Failed to dispatch payload to external server',
        statusCode: 0
      };
    }
  }
}
