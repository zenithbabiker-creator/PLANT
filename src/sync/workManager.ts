/**
 * Sorghum WorkManager Background Sync Service (Client-Side)
 * 
 * Implements Android WorkManager OneTimeWorkRequest / PeriodicWorkRequest pattern
 * to package offline diagnoses from Room DB into PlantDiagnosisPayloadDTO
 * and upload them to the external server in the background without blocking the UI.
 */

import { SorghumLocalRoomDatabase } from '../data/local/roomDb';
import { SorghumNetworkRepository } from '../network/repository/sorghumNetworkRepository';
import { AppNetworkConfig } from '../network/config';

export interface SyncStatusState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  syncedCount: number;
  lastSyncTimestamp: number | null;
  baseUrl: string;
  lastErrorMessage?: string;
}

export class SorghumWorkManagerSyncService {
  private static instance: SorghumWorkManagerSyncService;
  private db: SorghumLocalRoomDatabase;
  private networkRepository: SorghumNetworkRepository;
  private networkConfig: AppNetworkConfig;
  private isSyncing: boolean = false;
  private listeners: Array<(state: SyncStatusState) => void> = [];
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;

  private constructor() {
    this.db = SorghumLocalRoomDatabase.getInstance();
    this.networkRepository = SorghumNetworkRepository.getInstance();
    this.networkConfig = AppNetworkConfig.getInstance();

    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleNetworkChange(true));
      window.addEventListener('offline', () => this.handleNetworkChange(false));
    }
  }

  public static getInstance(): SorghumWorkManagerSyncService {
    if (!SorghumWorkManagerSyncService.instance) {
      SorghumWorkManagerSyncService.instance = new SorghumWorkManagerSyncService();
    }
    return SorghumWorkManagerSyncService.instance;
  }

  public subscribe(listener: (state: SyncStatusState) => void): () => void {
    this.listeners.push(listener);
    listener(this.getState());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    const state = this.getState();
    this.listeners.forEach((l) => l(state));
  }

  public setBaseUrl(url: string) {
    this.networkConfig.setBaseUrl(url);
    this.notify();
  }

  public getBaseUrl(): string {
    return this.networkConfig.getBaseUrl();
  }

  public setOnlineStatus(online: boolean) {
    this.isOnline = online;
    this.notify();
    if (online) {
      this.triggerAutoSync();
    }
  }

  private handleNetworkChange(online: boolean) {
    this.isOnline = online;
    this.notify();
    if (online) {
      this.triggerAutoSync();
    }
  }

  public getState(): SyncStatusState {
    const queue = this.db.getSyncQueue();
    const pending = queue.filter((q) => q.status === 'PENDING' || q.status === 'UPLOADING');
    const synced = queue.filter((q) => q.status === 'SYNCED');

    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      pendingCount: pending.length,
      syncedCount: synced.length,
      lastSyncTimestamp: synced.length > 0 ? synced[0].capturedAt : null,
      baseUrl: this.networkConfig.getBaseUrl()
    };
  }

  /**
   * Executes the Background Sync Task (WorkManager worker)
   * Dispatches diagnosis payload to the external server via SorghumNetworkRepository
   */
  public async triggerAutoSync(): Promise<number> {
    if (!this.isOnline || this.isSyncing) return 0;

    const queue = this.db.getSyncQueue();
    const pendingItems = queue.filter((q) => q.status === 'PENDING' || q.status === 'FAILED');
    if (pendingItems.length === 0) return 0;

    this.isSyncing = true;
    this.notify();

    let uploadedCount = 0;

    for (const item of pendingItems) {
      try {
        this.db.updateSyncQueueRecord(item.id, { status: 'UPLOADING' });
        this.notify();

        // Fetch corresponding diagnosis record from local Room DB
        const allDiagnoses = this.db.getDiagnoses();
        const diagnosis = allDiagnoses.find((d) => d.id === item.diagnosisId);

        if (diagnosis) {
          // Send to external server via repository
          const response = await this.networkRepository.uploadDiagnosis(diagnosis);
          
          if (response.success || response.statusCode === 200 || response.statusCode === 201) {
            this.db.updateSyncQueueRecord(item.id, {
              status: 'SYNCED',
              syncAttempts: item.syncAttempts + 1
            });
            this.db.markDiagnosisAsSynced(item.diagnosisId);
            uploadedCount++;
          } else {
            // Server returned non-200, mark failed with reason
            this.db.updateSyncQueueRecord(item.id, {
              status: 'FAILED',
              syncAttempts: item.syncAttempts + 1,
              lastError: response.message
            });
          }
        } else {
          // If diagnosis record was deleted, remove from sync queue
          this.db.updateSyncQueueRecord(item.id, {
            status: 'SYNCED',
            syncAttempts: item.syncAttempts + 1
          });
        }
      } catch (err: any) {
        this.db.updateSyncQueueRecord(item.id, {
          status: 'FAILED',
          syncAttempts: item.syncAttempts + 1,
          lastError: err?.message || 'Network Dispatch Error'
        });
      }
    }

    this.isSyncing = false;
    this.notify();
    return uploadedCount;
  }
}
