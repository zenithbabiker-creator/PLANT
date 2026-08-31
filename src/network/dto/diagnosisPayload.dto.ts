/**
 * Diagnosis Payload DTO (Data Transfer Object)
 * Client-Side Architecture for dispatching diagnosis packages to external server
 * 
 * Notice: The external server is solely responsible for receiving this payload,
 * parsing disease_name, organizing storage folders by disease category, and persisting data.
 */

export interface GeoLocationPayloadDTO {
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracyMeters: number;
  isMockLocation?: boolean;
}

export interface PlantDiagnosisPayloadDTO {
  /** Base64-encoded image string or image file reference URL */
  imageBase64: string;

  /** Identified disease entity name (e.g. "Anthracnose", "Sorghum Smut", "Healthy Plant") */
  diseaseName: string;

  /** Canonical Disease Identifier if available */
  diseaseId?: string;

  /** Model prediction confidence percentage (0.00 to 1.00) */
  confidenceScore: number;

  /** Geographical coordinates captured from GPS device sensor */
  location: GeoLocationPayloadDTO;

  /** Unique client device identifier / hardware fingerprint */
  deviceId: string;

  /** Client IP address or network interface indicator if resolved */
  clientIp?: string;

  /** UTC timestamp in milliseconds when image was captured and diagnosed on-device */
  capturedTimestampUtc: number;

  /** Target agricultural region / country code (e.g. "SD", "RW", "KE") */
  countryCode?: string;

  /** App client version and model execution engine tag */
  clientVersion: string;

  /** Metadata tags for the external server's indexing pipeline */
  metadata?: Record<string, string | number | boolean>;
}

export interface DiagnosisUploadResponseDTO {
  success: boolean;
  serverBatchId?: string;
  assignedCategoryFolder?: string;
  receivedTimestampUtc: number;
  message: string;
  statusCode: number;
}
