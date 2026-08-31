/**
 * Remote Sensing & ESA Satellite Data Response DTO
 * 
 * Notice: All satellite data extraction (European Space Agency ESA Copernicus Sentinel-2 / Landsat),
 * spectral band calculation (NDVI, NDRE, NDWI), and farm zone aggregation
 * are performed exclusively by the remote server.
 * 
 * The client application only defines the reception interface to consume server advisories.
 */

export type VegetationHealthCategory = 'EXCELLENT' | 'GOOD' | 'MODERATE' | 'STRESSED' | 'CRITICAL';

export interface SpectralIndicesDTO {
  /** Normalized Difference Vegetation Index (-1.0 to +1.0) */
  ndvi: number;
  /** Normalized Difference Red Edge Index */
  ndre?: number;
  /** Moisture Stress Index / Normalized Difference Water Index */
  ndwi?: number;
}

export interface EsaSatelliteObservationDTO {
  mission: 'SENTINEL_2' | 'LANDSAT_8' | 'LANDSAT_9' | 'COPERNICUS_RADAR';
  acquisitionDateUtc: string;
  cloudCoveragePercentage: number;
  spatialResolutionMeters: number;
}

export interface FieldHealthResponseDTO {
  fieldId: string;
  queryLocation: {
    latitude: number;
    longitude: number;
    radiusMeters: number;
  };
  satelliteObservation: EsaSatelliteObservationDTO;
  indices: SpectralIndicesDTO;
  overallHealthStatus: VegetationHealthCategory;
  healthScorePercentage: number; // 0 to 100
  anomalyDetected: boolean;
  cropStressFactors: string[]; // e.g. ["Drought Stress", "Chlorophyll Loss", "Fungal Spread Risk"]
  serverAdvisorySummary: string;
  serverAdvisorySummaryAr?: string;
  lastUpdatedTimestampUtc: number;
}

export interface RemoteSensingQueryDTO {
  latitude: number;
  longitude: number;
  radiusMeters?: number;
  cropType?: string;
  deviceId?: string;
}
