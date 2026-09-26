import { Farm, DiseaseScan, SoilTestRecord, FarmAlert } from '../types';

export interface AlertEngineInput {
  farm: Farm;
  userId: string;
  weather?: {
    temperature?: number;
    condition?: string;
    rainProbability?: number;
    humidity?: number;
  };
  soilTests?: SoilTestRecord[];
  diseaseScans?: DiseaseScan[];
  readAlertIds?: Set<string>;
}

export function generateRealFarmAlerts(input: AlertEngineInput): FarmAlert[] {
  const { farm, userId, weather, soilTests = [], diseaseScans = [], readAlertIds = new Set() } = input;
  const farmId = farm.id;
  if (!farmId || !userId) return [];

  const alerts: FarmAlert[] = [];
  const now = new Date().toISOString();

  // 1. Real Weather Alerts
  if (weather) {
    // Heavy rain check
    if (typeof weather.rainProbability === 'number' && weather.rainProbability >= 60) {
      alerts.push({
        id: `alert_rain_${farmId}_${weather.rainProbability}`,
        userId,
        farmId,
        category: 'weather',
        title: `Heavy Rain Alert (${weather.rainProbability}% Chance)`,
        description: `High precipitation expected for ${farm.name || 'your farm'}. Clear drainage furrows and avoid foliar chemical sprays.`,
        severity: 'high',
        actionableText: 'Check Field Weather',
        targetRoute: '/weather',
        isRead: readAlertIds.has(`alert_rain_${farmId}_${weather.rainProbability}`),
        createdAt: now,
      });
    }

    // Heat stress check
    if (typeof weather.temperature === 'number' && weather.temperature >= 38) {
      alerts.push({
        id: `alert_heat_${farmId}_${weather.temperature}`,
        userId,
        farmId,
        category: 'weather',
        title: `Extreme Heat Warning (${weather.temperature}°C)`,
        description: `High evapotranspiration detected. Irrigate during early morning or evening to prevent crop scorching.`,
        severity: 'medium',
        actionableText: 'View Weather Details',
        targetRoute: '/weather',
        isRead: readAlertIds.has(`alert_heat_${farmId}_${weather.temperature}`),
        createdAt: now,
      });
    }

    // Cold stress check
    if (typeof weather.temperature === 'number' && weather.temperature > 0 && weather.temperature <= 10) {
      alerts.push({
        id: `alert_cold_${farmId}_${weather.temperature}`,
        userId,
        farmId,
        category: 'weather',
        title: `Low Temperature Risk (${weather.temperature}°C)`,
        description: `Cold wave or night-time chill can retard seedling vigor. Provide light surface irrigation to buffer soil temperature.`,
        severity: 'info',
        actionableText: 'Monitor Conditions',
        targetRoute: '/weather',
        isRead: readAlertIds.has(`alert_cold_${farmId}_${weather.temperature}`),
        createdAt: now,
      });
    }
  }

  // 2. Real Soil Telemetry Alerts (Only if real soil data exists)
  const latestSoil = soilTests[0] || (farm.soil ? {
    ph: farm.soil.ph,
    moisturePercentage: farm.soil.moisturePercentage,
    nitrogen: farm.soil.nitrogen,
  } : null);

  if (latestSoil) {
    if (typeof latestSoil.moisturePercentage === 'number' && latestSoil.moisturePercentage > 0 && latestSoil.moisturePercentage < 22) {
      alerts.push({
        id: `alert_soil_moisture_${farmId}`,
        userId,
        farmId,
        category: 'soil',
        title: `Soil Moisture Deficit (${latestSoil.moisturePercentage}%)`,
        description: `Soil moisture in ${farm.name || 'field'} is critically low. Root zone stress is imminent without irrigation.`,
        severity: 'high',
        actionableText: 'Soil Moisture Status',
        targetRoute: '/soil-health',
        isRead: readAlertIds.has(`alert_soil_moisture_${farmId}`),
        createdAt: now,
      });
    }

    if (typeof latestSoil.ph === 'number' && latestSoil.ph > 0 && latestSoil.ph < 5.8) {
      alerts.push({
        id: `alert_soil_ph_acid_${farmId}`,
        userId,
        farmId,
        category: 'soil',
        title: `Acidic Soil Alert (pH ${latestSoil.ph})`,
        description: `Soil pH is acidic. Phosphorus and molybdenum fixation may limit crop uptake. Consider lime or dolomite amendment.`,
        severity: 'medium',
        actionableText: 'Review Soil Test',
        targetRoute: '/soil-health',
        isRead: readAlertIds.has(`alert_soil_ph_acid_${farmId}`),
        createdAt: now,
      });
    } else if (typeof latestSoil.ph === 'number' && latestSoil.ph > 8.2) {
      alerts.push({
        id: `alert_soil_ph_alkali_${farmId}`,
        userId,
        farmId,
        category: 'soil',
        title: `Alkaline Soil Alert (pH ${latestSoil.ph})`,
        description: `High soil alkalinity detected. Risk of iron and zinc deficiencies. Apply agricultural gypsum or organic compost.`,
        severity: 'medium',
        actionableText: 'Review Soil Test',
        targetRoute: '/soil-health',
        isRead: readAlertIds.has(`alert_soil_ph_alkali_${farmId}`),
        createdAt: now,
      });
    }
  }

  // 3. Real Disease Scans Alerts
  const recentHighScans = diseaseScans.filter((s) => s.severity === 'High' || s.severity === 'Critical');
  if (recentHighScans.length > 0) {
    const latestScan = recentHighScans[0];
    alerts.push({
      id: `alert_disease_${latestScan.id}`,
      userId,
      farmId,
      category: 'disease',
      title: `Pathogen Detected: ${latestScan.detectedProblem}`,
      description: latestScan.recommendation || `Active high-severity infection confirmed on ${latestScan.crop}. Immediate containment recommended.`,
      severity: 'high',
      actionableText: 'View Scan Report',
      targetRoute: '/disease-doctor',
      isRead: readAlertIds.has(`alert_disease_${latestScan.id}`),
      createdAt: latestScan.createdAt || now,
    });
  }

  // 4. Real Crop Stage / Sowing Alerts
  if (farm.crop?.name) {
    if (farm.crop.stage === 'Harvest' || farm.crop.stage?.toLowerCase().includes('harvest')) {
      alerts.push({
        id: `alert_crop_harvest_${farmId}`,
        userId,
        farmId,
        category: 'crop',
        title: `${farm.crop.name} Ready for Harvest`,
        description: `Crop has reached harvest maturity. Plan field labor and threshing ahead of changing weather.`,
        severity: 'info',
        actionableText: 'View Crop Details',
        targetRoute: '/farm',
        isRead: readAlertIds.has(`alert_crop_harvest_${farmId}`),
        createdAt: now,
      });
    }
  }

  return alerts;
}
