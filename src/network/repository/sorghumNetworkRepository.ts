/**
 * Sorghum Network Repository
 * Clean Architecture Layer (Client-Side)
 * 
 * Orchestrates:
 * 1. Packaging DiagnosisResult into PlantDiagnosisPayloadDTO & uploading to API
 * 2. Requesting ESA remote sensing field analysis from external server
 * 3. Listening to farmer SMS & emergency push alerts
 */

import { DiagnosisResult } from '../../types';
import { AppNetworkConfig } from '../config';
import { PlantDiagnosisPayloadDTO, DiagnosisUploadResponseDTO } from '../dto/diagnosisPayload.dto';
import { FieldHealthResponseDTO, RemoteSensingQueryDTO } from '../dto/remoteSensing.dto';
import { FarmerSmsAlertDTO } from '../dto/alertNotification.dto';
import { IDiagnosisApiService, DiagnosisApiService } from '../services/diagnosisApiService';
import { IRemoteSensingApiService, RemoteSensingApiService } from '../services/remoteSensingApiService';
import { ISmsAlertService, SorghumNotificationManager, AlertListener } from '../services/notificationService';

export interface ISorghumNetworkRepository {
  uploadDiagnosis(diagnosis: DiagnosisResult): Promise<DiagnosisUploadResponseDTO>;
  fetchRemoteSensingHealth(latitude: number, longitude: number): Promise<FieldHealthResponseDTO | null>;
  subscribeToSmsAlerts(listener: AlertListener): () => void;
  getSmsAlerts(): FarmerSmsAlertDTO[];
  setApiBaseUrl(url: string): void;
  getApiBaseUrl(): string;
  getDeviceId(): string;
}

export class SorghumNetworkRepository implements ISorghumNetworkRepository {
  private static instance: SorghumNetworkRepository;
  private config: AppNetworkConfig;
  private diagnosisApi: IDiagnosisApiService;
  private remoteSensingApi: IRemoteSensingApiService;
  private notificationService: ISmsAlertService;

  private constructor() {
    this.config = AppNetworkConfig.getInstance();
    this.diagnosisApi = new DiagnosisApiService(this.config);
    this.remoteSensingApi = new RemoteSensingApiService(this.config);
    this.notificationService = SorghumNotificationManager.getInstance();
  }

  public static getInstance(): SorghumNetworkRepository {
    if (!SorghumNetworkRepository.instance) {
      SorghumNetworkRepository.instance = new SorghumNetworkRepository();
    }
    return SorghumNetworkRepository.instance;
  }

  /**
   * Bundles on-device diagnosis into PlantDiagnosisPayloadDTO and sends to API
   */
  public async uploadDiagnosis(diagnosis: DiagnosisResult): Promise<DiagnosisUploadResponseDTO> {
    const payload: PlantDiagnosisPayloadDTO = {
      imageBase64: diagnosis.imageUri,
      diseaseName: diagnosis.disease?.disease_name || (diagnosis.status === 'HEALTHY' ? 'Healthy Plant' : 'Uncertain'),
      diseaseId: diagnosis.disease?.id_disease,
      confidenceScore: Number(diagnosis.confidence.toFixed(4)),
      location: {
        latitude: diagnosis.gps.latitude,
        longitude: diagnosis.gps.longitude,
        accuracyMeters: diagnosis.gps.accuracy,
        isMockLocation: diagnosis.gps.isMock || false
      },
      deviceId: this.config.getDeviceId(),
      capturedTimestampUtc: diagnosis.timestamp,
      clientVersion: '1.0.0-android-client',
      metadata: {
        blurScore: diagnosis.blurScore,
        isBlurry: diagnosis.isBlurry,
        diagnosisStatus: diagnosis.status,
        appliedPesticide: diagnosis.disease?.recommended_pesticide || 'None',
        phiDays: diagnosis.disease?.phi_days || 0
      }
    };

    return await this.diagnosisApi.uploadDiagnosisPayload(payload);
  }

  /**
   * Queries external server for ESA Copernicus satellite indices and field health
   */
  public async fetchRemoteSensingHealth(latitude: number, longitude: number): Promise<FieldHealthResponseDTO | null> {
    const query: RemoteSensingQueryDTO = {
      latitude,
      longitude,
      radiusMeters: 500,
      cropType: 'sorghum',
      deviceId: this.config.getDeviceId()
    };

    return await this.remoteSensingApi.fetchFieldHealthAdvisory(query);
  }

  public subscribeToSmsAlerts(listener: AlertListener): () => void {
    return this.notificationService.onSmsAlertReceived(listener);
  }

  public getSmsAlerts(): FarmerSmsAlertDTO[] {
    return SorghumNotificationManager.getInstance().getAlerts();
  }

  public setApiBaseUrl(url: string): void {
    this.config.setBaseUrl(url);
  }

  public getApiBaseUrl(): string {
    return this.config.getBaseUrl();
  }

  public getDeviceId(): string {
    return this.config.getDeviceId();
  }
}
