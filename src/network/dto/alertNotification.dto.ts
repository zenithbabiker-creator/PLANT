/**
 * SMS Notification & Field Advisory Alert DTOs
 * Client-Side Architecture for receiving urgent crop & weather alerts
 */

export type AlertSeverity = 'INFO' | 'WARNING' | 'EMERGENCY' | 'ACTION_REQUIRED';

export type AlertChannel = 'SMS' | 'PUSH' | 'LOCAL_BROADCAST';

export interface FarmerSmsAlertDTO {
  smsId: string;
  senderPhoneOrAlphaId: string;
  recipientPhone?: string;
  messageBody: string;
  messageBodyAr?: string;
  severity: AlertSeverity;
  alertType: 'DISEASE_OUTBREAK' | 'WEATHER_HAZARD' | 'PHI_EXPIRATION' | 'ESA_ANOMALY' | 'GENERAL_ADVISORY';
  affectedLocation?: {
    latitude: number;
    longitude: number;
    radiusKm: number;
  };
  timestampUtc: number;
  isRead: boolean;
  actionRequired?: {
    actionLabel: string;
    actionLabelAr?: string;
    actionType: 'OPEN_PHI_TRACKER' | 'RETAKE_DIAGNOSIS' | 'CALL_AGRONOMIST';
  };
}

export interface PushNotificationDTO {
  notificationId: string;
  title: string;
  titleAr?: string;
  body: string;
  bodyAr?: string;
  channelId: string;
  priority: 'HIGH' | 'DEFAULT' | 'LOW';
  receivedAtUtc: number;
  dataPayload?: Record<string, string>;
}

export interface NotificationRegisterRequestDTO {
  deviceId: string;
  fcmToken?: string;
  phoneNumber?: string;
  preferredLanguage: string;
  subscribedCoordinates?: {
    latitude: number;
    longitude: number;
  };
}
