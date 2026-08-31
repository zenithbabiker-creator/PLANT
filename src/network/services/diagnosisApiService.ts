/**
 * Diagnosis API Network Service
 * Client-Side Dispatcher for Sorghum Diagnosis Payloads
 * 
 * Strict Constraint: Contains NO server-side logic. Simply formats HTTP POST
 * to the configured endpoint.
 */

import { AppNetworkConfig } from '../config';
import { PlantDiagnosisPayloadDTO, DiagnosisUploadResponseDTO } from '../dto/diagnosisPayload.dto';

export interface IDiagnosisApiService {
  uploadDiagnosisPayload(
    payload: PlantDiagnosisPayloadDTO,
    abortSignal?: AbortSignal
  ): Promise<DiagnosisUploadResponseDTO>;
}

export class DiagnosisApiService implements IDiagnosisApiService {
  private networkConfig: AppNetworkConfig;

  constructor(networkConfig?: AppNetworkConfig) {
    this.networkConfig = networkConfig || AppNetworkConfig.getInstance();
  }

  /**
   * Dispatches the packaged diagnosis payload to the external server.
   * The server will handle file storage by disease folder, indexing, and persistence.
   */
  public async uploadDiagnosisPayload(
    payload: PlantDiagnosisPayloadDTO,
    abortSignal?: AbortSignal
  ): Promise<DiagnosisUploadResponseDTO> {
    const config = this.networkConfig.getConfig();
    const endpoint = config.endpoints.uploadDiagnosis;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeoutMs);

    // Merge abort signals if external signal provided
    if (abortSignal) {
      abortSignal.addEventListener('abort', () => controller.abort());
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Device-Id': payload.deviceId,
          'X-Client-Version': payload.clientVersion
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}: ${response.statusText}`);
      }

      const data: DiagnosisUploadResponseDTO = await response.json();
      return data;
    } catch (err: any) {
      clearTimeout(timeoutId);
      
      // If network unreachable or endpoint not live yet, construct safe failure response
      return {
        success: false,
        receivedTimestampUtc: Date.now(),
        message: err?.name === 'AbortError' 
          ? 'Network request timed out' 
          : (err?.message || 'Failed to dispatch payload to external server'),
        statusCode: err?.status || 0
      };
    }
  }
}
