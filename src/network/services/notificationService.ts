/**
 * SMS Notification & Field Alert Architecture (Client-Side)
 * 
 * Manages reception and dispatching of SMS broadcasts and push notifications
 * for low-connectivity rural farmers using VITE_API_BASE_URL.
 */

import { apiClient, API_ENDPOINTS } from '../apiClient';
import { 
  FarmerSmsAlertDTO, 
  PushNotificationDTO, 
  NotificationRegisterRequestDTO 
} from '../dto/alertNotification.dto';

export type AlertListener = (alert: FarmerSmsAlertDTO) => void;
export type PushListener = (notification: PushNotificationDTO) => void;

export interface ISmsAlertService {
  registerDeviceForAlerts(request: NotificationRegisterRequestDTO): Promise<boolean>;
  fetchPendingSmsAlerts(deviceId: string): Promise<FarmerSmsAlertDTO[]>;
  onSmsAlertReceived(listener: AlertListener): () => void;
  onPushReceived(listener: PushListener): () => void;
  simulateIncomingSmsBroadcast(sms: FarmerSmsAlertDTO): void;
}

export class SorghumNotificationManager implements ISmsAlertService {
  private static instance: SorghumNotificationManager;
  private alertListeners: AlertListener[] = [];
  private pushListeners: PushListener[] = [];
  private storedAlerts: FarmerSmsAlertDTO[] = [];

  private constructor() {
    this.loadCachedAlerts();
  }

  public static getInstance(): SorghumNotificationManager {
    if (!SorghumNotificationManager.instance) {
      SorghumNotificationManager.instance = new SorghumNotificationManager();
    }
    return SorghumNotificationManager.instance;
  }

  private loadCachedAlerts(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const raw = window.localStorage.getItem('sorghum_farmer_alerts');
        if (raw) {
          this.storedAlerts = JSON.parse(raw);
        }
      } catch {
        this.storedAlerts = [];
      }
    }
  }

  private saveAlertsToCache(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem('sorghum_farmer_alerts', JSON.stringify(this.storedAlerts));
      } catch {
        // Safe fail
      }
    }
  }

  public async registerDeviceForAlerts(request: NotificationRegisterRequestDTO): Promise<boolean> {
    try {
      const response = await apiClient.post(API_ENDPOINTS.REGISTER_DEVICE, request);
      return response.ok;
    } catch {
      return false;
    }
  }

  public async fetchPendingSmsAlerts(deviceId: string): Promise<FarmerSmsAlertDTO[]> {
    try {
      const response = await apiClient.get<FarmerSmsAlertDTO[] | { alerts: FarmerSmsAlertDTO[] }>(
        API_ENDPOINTS.SMS_ALERTS,
        { deviceId }
      );
      if (response.ok && response.data) {
        const alertsList: FarmerSmsAlertDTO[] = Array.isArray(response.data) 
          ? response.data 
          : (response.data.alerts || []);
        alertsList.forEach((a) => this.dispatchAlert(a));
        return alertsList;
      }
    } catch (e) {
      console.warn('SMS alert sync offline or endpoint pending:', e);
    }
    return this.storedAlerts;
  }

  public onSmsAlertReceived(listener: AlertListener): () => void {
    this.alertListeners.push(listener);
    return () => {
      this.alertListeners = this.alertListeners.filter((l) => l !== listener);
    };
  }

  public onPushReceived(listener: PushListener): () => void {
    this.pushListeners.push(listener);
    return () => {
      this.pushListeners = this.pushListeners.filter((l) => l !== listener);
    };
  }

  /**
   * Internal dispatcher for incoming SMS / push events
   */
  public dispatchAlert(sms: FarmerSmsAlertDTO): void {
    if (!this.storedAlerts.some((a) => a.smsId === sms.smsId)) {
      this.storedAlerts.unshift(sms);
      this.saveAlertsToCache();
    }
    this.alertListeners.forEach((fn) => fn(sms));
  }

  public simulateIncomingSmsBroadcast(sms: FarmerSmsAlertDTO): void {
    this.dispatchAlert(sms);
  }

  public getAlerts(): FarmerSmsAlertDTO[] {
    return [...this.storedAlerts];
  }
}
