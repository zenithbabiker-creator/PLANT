import { DiseaseEntity, DiagnosisResult, SyncQueueRecord } from '../../types';
import { INITIAL_SORGHUM_DISEASES } from '../diseasesDatabase';

const STORAGE_KEY_DIAGNOSES = 'sorghum_offline_diagnoses_v2';
const STORAGE_KEY_DISEASES = 'sorghum_local_diseases_v2';
const STORAGE_KEY_SYNC_QUEUE = 'sorghum_sync_queue_v2';

export class SorghumLocalRoomDatabase {
  private static instance: SorghumLocalRoomDatabase;

  private diseases: DiseaseEntity[] = [];
  private diagnoses: DiagnosisResult[] = [];
  private syncQueue: SyncQueueRecord[] = [];

  private constructor() {
    this.initDatabase();
  }

  public static getInstance(): SorghumLocalRoomDatabase {
    if (!SorghumLocalRoomDatabase.instance) {
      SorghumLocalRoomDatabase.instance = new SorghumLocalRoomDatabase();
    }
    return SorghumLocalRoomDatabase.instance;
  }

  private initDatabase() {
    // 1. Initialize Diseases Table
    const storedDiseases = localStorage.getItem(STORAGE_KEY_DISEASES);
    if (storedDiseases) {
      try {
        this.diseases = JSON.parse(storedDiseases);
      } catch {
        this.diseases = INITIAL_SORGHUM_DISEASES;
      }
    } else {
      this.diseases = INITIAL_SORGHUM_DISEASES;
      localStorage.setItem(STORAGE_KEY_DISEASES, JSON.stringify(this.diseases));
    }

    // 2. Initialize Diagnoses Table
    const storedDiagnoses = localStorage.getItem(STORAGE_KEY_DIAGNOSES);
    if (storedDiagnoses) {
      try {
        this.diagnoses = JSON.parse(storedDiagnoses);
      } catch {
        this.diagnoses = [];
      }
    }

    // 3. Initialize Sync Queue
    const storedSync = localStorage.getItem(STORAGE_KEY_SYNC_QUEUE);
    if (storedSync) {
      try {
        this.syncQueue = JSON.parse(storedSync);
      } catch {
        this.syncQueue = [];
      }
    }
  }

  public getAllDiseases(): DiseaseEntity[] {
    return this.diseases;
  }

  public getDiseaseById(id: string): DiseaseEntity | undefined {
    return this.diseases.find((d) => d.id_disease === id);
  }

  /**
   * Query database for the recommended pesticide and PHI interval for a given disease ID.
   * Ready for cloud / backend database synchronization.
   */
  public getPesticideForDisease(diseaseId: string, locale?: string): {
    pesticideName: string;
    phiDays: number;
    diseaseName: string;
    isHealthy: boolean;
  } {
    const disease = this.getDiseaseById(diseaseId);
    if (!disease || disease.is_healthy) {
      return {
        pesticideName: locale === 'ar' ? 'لا يتطلب مبيد (محصول سليم)' : 'No pesticide required (Healthy crop)',
        phiDays: 0,
        diseaseName: locale === 'ar' ? (disease?.disease_name_ar || 'نبات سليم') : (disease?.disease_name || 'Healthy Plant'),
        isHealthy: true
      };
    }

    const pesticideName = locale === 'ar' 
      ? (disease.recommended_pesticide_ar || disease.recommended_pesticide)
      : disease.recommended_pesticide;

    return {
      pesticideName,
      phiDays: disease.phi_days,
      diseaseName: locale === 'ar' ? (disease.disease_name_ar || disease.disease_name) : disease.disease_name,
      isHealthy: false
    };
  }

  public getDiagnoses(): DiagnosisResult[] {
    // Recalculate remaining PHI days based on 24-hour decay
    const now = Date.now();
    const MS_PER_DAY = 24 * 60 * 60 * 1000;

    return this.diagnoses.map((item) => {
      if (item.status === 'DISEASED' && item.appliedPesticideDate && item.initialPhiDays !== undefined) {
        const daysPassed = Math.floor((now - item.appliedPesticideDate) / MS_PER_DAY);
        const remaining = Math.max(0, item.initialPhiDays - daysPassed);
        return {
          ...item,
          remainingPhiDays: remaining
        };
      }
      return item;
    });
  }

  public saveDiagnosis(diagnosis: DiagnosisResult): void {
    // Save to diagnoses list
    this.diagnoses.unshift(diagnosis);
    localStorage.setItem(STORAGE_KEY_DIAGNOSES, JSON.stringify(this.diagnoses));

    // Also push to offline sync queue if not already synced
    if (diagnosis.syncStatus === 'PENDING') {
      const queueRecord: SyncQueueRecord = {
        id: `sync_${diagnosis.id}`,
        diagnosisId: diagnosis.id,
        imageBlobUrl: diagnosis.imageUri,
        diseaseId: diagnosis.disease?.id_disease || 'unknown',
        latitude: diagnosis.gps.latitude,
        longitude: diagnosis.gps.longitude,
        capturedAt: diagnosis.timestamp,
        syncAttempts: 0,
        status: 'PENDING'
      };
      this.syncQueue.unshift(queueRecord);
      localStorage.setItem(STORAGE_KEY_SYNC_QUEUE, JSON.stringify(this.syncQueue));
    }
  }

  public advanceDiagnosisDays(diagnosisId: string, daysToAdvance: number): DiagnosisResult | null {
    const target = this.diagnoses.find((d) => d.id === diagnosisId);
    if (!target || target.status !== 'DISEASED' || !target.appliedPesticideDate) return null;

    const MS_PER_DAY = 24 * 60 * 60 * 1000;
    // Shift appliedPesticideDate backwards in time to simulate passage of days
    target.appliedPesticideDate -= daysToAdvance * MS_PER_DAY;
    const daysPassed = Math.floor((Date.now() - target.appliedPesticideDate) / MS_PER_DAY);
    target.remainingPhiDays = Math.max(0, (target.initialPhiDays || 0) - daysPassed);

    localStorage.setItem(STORAGE_KEY_DIAGNOSES, JSON.stringify(this.diagnoses));
    return target;
  }

  public setDiagnosisRemainingDaysDirectly(diagnosisId: string, days: number): DiagnosisResult | null {
    const target = this.diagnoses.find((d) => d.id === diagnosisId);
    if (!target) return null;
    const initial = target.initialPhiDays || days;
    const daysPassed = Math.max(0, initial - days);
    const MS_PER_DAY = 24 * 60 * 60 * 1000;
    target.appliedPesticideDate = Date.now() - daysPassed * MS_PER_DAY;
    target.remainingPhiDays = Math.max(0, days);
    localStorage.setItem(STORAGE_KEY_DIAGNOSES, JSON.stringify(this.diagnoses));
    return target;
  }

  public getSyncQueue(): SyncQueueRecord[] {
    return this.syncQueue;
  }

  public updateSyncQueueRecord(recordId: string, updates: Partial<SyncQueueRecord>): void {
    const index = this.syncQueue.findIndex((r) => r.id === recordId);
    if (index !== -1) {
      this.syncQueue[index] = { ...this.syncQueue[index], ...updates };
      localStorage.setItem(STORAGE_KEY_SYNC_QUEUE, JSON.stringify(this.syncQueue));
    }
  }

  public markDiagnosisAsSynced(diagnosisId: string): void {
    const diag = this.diagnoses.find((d) => d.id === diagnosisId);
    if (diag) {
      diag.syncStatus = 'SYNCED';
      diag.syncedAt = Date.now();
      localStorage.setItem(STORAGE_KEY_DIAGNOSES, JSON.stringify(this.diagnoses));
    }
  }

  public clearAll(): void {
    this.diagnoses = [];
    this.syncQueue = [];
    localStorage.removeItem(STORAGE_KEY_DIAGNOSES);
    localStorage.removeItem(STORAGE_KEY_SYNC_QUEUE);
  }
}
