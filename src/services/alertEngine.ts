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
      const rainId = `alert_rain_${farmId}_${weather.rainProbability}`;
      alerts.push({
        id: rainId,
        userId,
        farmId,
        category: 'weather',
        title: `Heavy Rain Expected (${weather.rainProbability}% Chance)`,
        description: `High precipitation forecast for ${farm.name || 'your farm'}. Clear drainage furrows and avoid foliar chemical sprays.`,
        whatHappened: `Rain radar indicates a ${weather.rainProbability}% chance of heavy rainfall today.`,
        whatShouldIDo: `Clear field drainage furrows to prevent waterlogging and postpone spraying or fertilizer application.`,
        source: `Weather Radar • Open-Meteo`,
        severity: 'high',
        actionableText: 'View Weather',
        targetRoute: '/weather',
        isRead: readAlertIds.has(rainId),
        createdAt: now,
      });
    }

    // Heat stress check
    if (typeof weather.temperature === 'number' && weather.temperature >= 38) {
      const heatId = `alert_heat_${farmId}_${weather.temperature}`;
      alerts.push({
        id: heatId,
        userId,
        farmId,
        category: 'weather',
        title: `High Temperature Alert (${weather.temperature}°C)`,
        description: `Daytime temperatures are peaking above 38°C, increasing crop evapotranspiration.`,
        whatHappened: `Intense midday heat is causing rapid moisture loss from soil and leaf surfaces.`,
        whatShouldIDo: `Irrigate during early morning or evening hours to avoid crop heat stress and root drying.`,
        source: `Weather Radar • Open-Meteo`,
        severity: 'medium',
        actionableText: 'View Weather',
        targetRoute: '/weather',
        isRead: readAlertIds.has(heatId),
        createdAt: now,
      });
    }

    // Cold stress check
    if (typeof weather.temperature === 'number' && weather.temperature > 0 && weather.temperature <= 10) {
      const coldId = `alert_cold_${farmId}_${weather.temperature}`;
      alerts.push({
        id: coldId,
        userId,
        farmId,
        category: 'weather',
        title: `Low Temperature Risk (${weather.temperature}°C)`,
        description: `Cold wave or night-time chill can retard seedling vigor. Provide light surface irrigation to buffer soil temperature.`,
        whatHappened: `Temperatures dropped to ${weather.temperature}°C, which may slow plant nutrient uptake.`,
        whatShouldIDo: `Provide light surface watering during afternoon hours to buffer root zone temperature.`,
        source: `Weather Radar • Open-Meteo`,
        severity: 'info',
        actionableText: 'View Weather',
        targetRoute: '/weather',
        isRead: readAlertIds.has(coldId),
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
      const moistureId = `alert_soil_moisture_${farmId}`;
      alerts.push({
        id: moistureId,
        userId,
        farmId,
        category: 'soil',
        title: `Soil Moisture Deficit (${latestSoil.moisturePercentage}%)`,
        description: `Soil moisture in root zone is low (${latestSoil.moisturePercentage}%). Root stress is imminent without watering.`,
        whatHappened: `Root zone moisture has dropped below the 22% threshold.`,
        whatShouldIDo: `Check soil moisture and plan irrigation before plants show wilting symptoms.`,
        source: `Soil Test / Sensor`,
        severity: 'high',
        actionableText: 'View My Soil',
        targetRoute: '/soil',
        isRead: readAlertIds.has(moistureId),
        createdAt: now,
      });
    }

    if (typeof latestSoil.ph === 'number' && latestSoil.ph > 0 && latestSoil.ph < 5.8) {
      const phId = `alert_soil_ph_acid_${farmId}`;
      alerts.push({
        id: phId,
        userId,
        farmId,
        category: 'soil',
        title: `Acidic Soil Alert (pH ${latestSoil.ph})`,
        description: `Soil pH is acidic (${latestSoil.ph}). Phosphorus availability may be limited.`,
        whatHappened: `Soil analysis recorded acidic pH of ${latestSoil.ph}, which reduces nutrient bioavailability.`,
        whatShouldIDo: `Incorporate agricultural lime or dolomite @ 150-200 kg/acre before next sowing season.`,
        source: `Soil Test Record`,
        severity: 'medium',
        actionableText: 'View My Soil',
        targetRoute: '/soil',
        isRead: readAlertIds.has(phId),
        createdAt: now,
      });
    } else if (typeof latestSoil.ph === 'number' && latestSoil.ph > 8.2) {
      const phId = `alert_soil_ph_alkali_${farmId}`;
      alerts.push({
        id: phId,
        userId,
        farmId,
        category: 'soil',
        title: `Alkaline Soil Alert (pH ${latestSoil.ph})`,
        description: `High soil alkalinity (${latestSoil.ph}) detected. Risk of zinc and iron lock-up.`,
        whatHappened: `Soil pH of ${latestSoil.ph} causes nutrient lock-up in root zone.`,
        whatShouldIDo: `Apply agricultural gypsum and enrich with farmyard manure to buffer soil alkalinity.`,
        source: `Soil Test Record`,
        severity: 'medium',
        actionableText: 'View My Soil',
        targetRoute: '/soil',
        isRead: readAlertIds.has(phId),
        createdAt: now,
      });
    }
  }

  // 3. Real Plant Scans Alerts (Safe, non-speculative farmer language)
  const recentHighScans = diseaseScans.filter((s) => s.severity === 'High' || s.severity === 'Critical');
  if (recentHighScans.length > 0) {
    const latestScan = recentHighScans[0];
    const diseaseId = `alert_disease_${latestScan.id}`;
    alerts.push({
      id: diseaseId,
      userId,
      farmId,
      category: 'disease',
      title: `Possible pest issue: ${latestScan.detectedProblem}`,
      description: latestScan.recommendation || `A recent leaf scan flagged possible symptoms of ${latestScan.detectedProblem} on ${latestScan.crop || 'crop'}.`,
      whatHappened: `A recent plant scan may indicate pest or pathogen activity on ${latestScan.crop || 'standing crop'}.`,
      whatShouldIDo: `Inspect the underside of leaves across 20 random plants to verify symptoms before taking action.`,
      source: `Plant Scan • ${new Date(latestScan.createdAt || now).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`,
      severity: latestScan.severity === 'Critical' ? 'high' : 'medium',
      actionableText: 'View Scan',
      targetRoute: '/disease',
      isRead: readAlertIds.has(diseaseId),
      createdAt: latestScan.createdAt || now,
    });
  }

  // 4. Real Crop Stage / Sowing Alerts
  if (farm.crop?.name) {
    if (farm.crop.stage === 'Harvest' || farm.crop.stage?.toLowerCase().includes('harvest')) {
      const harvestId = `alert_crop_harvest_${farmId}`;
      alerts.push({
        id: harvestId,
        userId,
        farmId,
        category: 'crop',
        title: `${farm.crop.name} Ready for Harvest`,
        description: `Crop has reached harvest maturity. Plan field labor and threshing ahead of changing weather.`,
        whatHappened: `${farm.crop.name} has completed its full growth cycle on ${farm.name || 'your farm'}.`,
        whatShouldIDo: `Check moisture in grain or pods and arrange harvesting equipment.`,
        source: `Crop Calendar`,
        severity: 'info',
        actionableText: 'View My Crop',
        targetRoute: '/crop-health',
        isRead: readAlertIds.has(harvestId),
        createdAt: now,
      });
    }
  }

  return alerts;
}
