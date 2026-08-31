/**
 * Domain & Room Database Models for Sorghum Disease Diagnosis
 * Offline-First Android Architecture
 */

export interface DiseaseEntity {
  id_disease: string;          // id_المرض
  disease_name: string;        // اسم_المرض (e.g. Anthracnose / لفحة الذرة)
  disease_name_ar: string;
  disease_name_sw?: string;
  disease_name_rw?: string;
  disease_name_ny?: string;
  is_healthy: boolean;         // True if plant is sound and healthy
  recommended_pesticide: string; // اسم_المبيد (e.g. Mancozeb, Azoxystrobin)
  recommended_pesticide_ar?: string;
  phi_days: number;            // أيام_فترة_الأمان (Pre-Harvest Interval)
  sample_image_url?: string;
  description_ar?: string;
  description_en?: string;
  description_sw?: string;
  description_rw?: string;
  description_ny?: string;
}

export type DiagnosisStatus = 'HEALTHY' | 'DISEASED' | 'BLURRY' | 'IDLE';

export interface DiagnosisResult {
  id: string;
  timestamp: number;
  status: DiagnosisStatus;
  confidence: number;
  isBlurry: boolean;
  blurScore: number;
  disease?: DiseaseEntity;
  imageUri: string;
  gps: {
    latitude: number;
    longitude: number;
    accuracy: number;
    isMock?: boolean;
  };
  appliedPesticideDate?: number; // timestamp when pesticide was sprayed
  initialPhiDays?: number;
  remainingPhiDays?: number;
  syncStatus: 'PENDING' | 'SYNCED' | 'FAILED';
  syncedAt?: number;
}

export interface SyncQueueRecord {
  id: string;
  diagnosisId: string;
  imageBlobUrl: string;
  diseaseId: string;
  latitude: number;
  longitude: number;
  capturedAt: number;
  syncAttempts: number;
  status: 'PENDING' | 'UPLOADING' | 'SYNCED' | 'FAILED';
  lastError?: string;
}

export interface SorghumExtensionHook {
  hookId: string;
  hookName: string;
  onPreDiagnosis?: (imageData: string) => Promise<void>;
  onPostDiagnosis?: (result: DiagnosisResult) => Promise<void>;
  onPhiDayDecremented?: (remainingDays: number) => Promise<void>;
  onSyncCompleted?: (recordCount: number) => Promise<void>;
}

export * from './network/dto/diagnosisPayload.dto';
export * from './network/dto/remoteSensing.dto';
export * from './network/dto/alertNotification.dto';
