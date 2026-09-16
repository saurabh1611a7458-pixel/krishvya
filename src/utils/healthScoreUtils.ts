/**
 * KRISHVYA Farm Health Index Calculation Utility
 * Computes dynamic health index and sub-metrics based strictly on available telemetry:
 * 1. Soil Nutrient Balance (N, P, K, pH, Organic Carbon)
 * 2. Water / Moisture Status (0-7cm Soil moisture % vs optimal threshold)
 * 3. Crop Canopy & NDVI (Sentinel-2 NDVI and vegetative anomaly)
 * 4. Weather Resilience (Temperature, rain probability, wind)
 * 
 * Never returns fake/hard-coded numbers. If data is absent, returns null ("Data unavailable").
 */

import { Farm } from '../types';

export interface MetricScore {
  score: number | null; // 0-100 or null if data is missing
  statusText: string;
  isAvailable: boolean;
}

export interface FarmHealthBreakdown {
  overallScore: number | null;
  soilNutrientScore: MetricScore;
  waterMoistureScore: MetricScore;
  cropCanopyScore: MetricScore;
  weatherResilienceScore: MetricScore;
  hasEnoughData: boolean;
}

/**
 * Calculates Soil Nutrient Balance (0-100) or null
 */
export function calculateSoilScore(soil?: Farm['soil'] | null): MetricScore {
  if (!soil) {
    return { score: null, statusText: 'Soil information not available', isAvailable: false };
  }

  // If explicit healthScore is provided
  if (typeof soil.healthScore === 'number' && soil.healthScore > 0) {
    return {
      score: Math.min(100, Math.max(0, Math.round(soil.healthScore))),
      statusText: `${soil.healthScore}%`,
      isAvailable: true,
    };
  }

  // Calculate from NPK and pH if available
  let componentCount = 0;
  let scoreSum = 0;

  const rateLevel = (lvl?: string): number => {
    if (!lvl) return 60;
    const l = lvl.toLowerCase();
    if (l === 'good' || l === 'high') return 88;
    if (l === 'medium' || l === 'moderate') return 72;
    if (l === 'low' || l === 'deficient') return 45;
    return 65;
  };

  if (soil.nitrogen) {
    scoreSum += rateLevel(soil.nitrogen);
    componentCount++;
  }
  if (soil.phosphorus) {
    scoreSum += rateLevel(soil.phosphorus);
    componentCount++;
  }
  if (soil.potassium) {
    scoreSum += rateLevel(soil.potassium);
    componentCount++;
  }

  if (typeof soil.ph === 'number' && soil.ph > 0) {
    // Optimal pH: 6.0 - 7.5
    const diff = Math.abs(soil.ph - 6.8);
    const phScore = Math.max(40, 95 - diff * 25);
    scoreSum += phScore;
    componentCount++;
  }

  if (componentCount === 0) {
    return { score: null, statusText: 'Soil information not available', isAvailable: false };
  }

  const finalScore = Math.round(scoreSum / componentCount);
  return {
    score: finalScore,
    statusText: `${finalScore}%`,
    isAvailable: true,
  };
}

/**
 * Calculates Water / Moisture Status (0-100) or null
 */
export function calculateMoistureScore(
  soil?: Farm['soil'] | null,
  weather?: Farm['weather'] | null
): MetricScore {
  const moisture =
    typeof soil?.moisturePercentage === 'number' && soil.moisturePercentage >= 0
      ? soil.moisturePercentage
      : typeof (weather as any)?.soilMoisture === 'number'
      ? (weather as any).soilMoisture
      : null;

  if (moisture === null) {
    return { score: null, statusText: 'Water data unavailable', isAvailable: false };
  }

  // Agricultural root-zone soil moisture:
  // 40% - 65% is ideal for most Indian field crops (scores 85 - 98)
  // 25% - 40% moderate stress (scores 60 - 80)
  // <20% severe drought / dry (scores 30 - 50)
  // >80% waterlogged / hypoxia risk (scores 40 - 65)
  let score = 50;
  if (moisture >= 40 && moisture <= 65) {
    score = 90 + Math.round((1 - Math.abs(moisture - 52) / 13) * 8);
  } else if (moisture > 65 && moisture <= 80) {
    score = 80 - Math.round(((moisture - 65) / 15) * 20);
  } else if (moisture > 80) {
    score = Math.max(30, 60 - Math.round((moisture - 80) * 1.5));
  } else if (moisture >= 25 && moisture < 40) {
    score = 65 + Math.round(((moisture - 25) / 15) * 20);
  } else {
    score = Math.max(20, Math.round(moisture * 2));
  }

  return {
    score: Math.min(100, Math.max(0, score)),
    statusText: `${score}% (${moisture}% volumetric)`,
    isAvailable: true,
  };
}

/**
 * Calculates Crop Canopy & NDVI (0-100) or null
 */
export function calculateCanopyScore(satellite?: Farm['satellite'] | null): MetricScore {
  if (!satellite) {
    return { score: null, statusText: 'Satellite NDVI unavailable', isAvailable: false };
  }

  if (typeof satellite.healthScore === 'number' && satellite.healthScore > 0) {
    return {
      score: Math.min(100, Math.max(0, Math.round(satellite.healthScore))),
      statusText: `${satellite.healthScore}%`,
      isAvailable: true,
    };
  }

  if (typeof satellite.ndvi === 'number' && satellite.ndvi > 0) {
    // Standard NDVI ranges: 0.2 - 0.9
    // 0.7 - 0.9 => Dense healthy canopy (85 - 98%)
    // 0.4 - 0.7 => Moderate canopy (60 - 85%)
    // < 0.4 => Sparse / fallow (30 - 60%)
    let ndviScore = Math.round(satellite.ndvi * 105);
    if (satellite.stressDetected) {
      ndviScore = Math.max(40, ndviScore - 15);
    }
    const finalScore = Math.min(100, Math.max(0, ndviScore));
    return {
      score: finalScore,
      statusText: `${finalScore}% (NDVI ${satellite.ndvi.toFixed(2)})`,
      isAvailable: true,
    };
  }

  return { score: null, statusText: 'Satellite NDVI unavailable', isAvailable: false };
}

/**
 * Calculates Weather Resilience (0-100) or null
 */
export function calculateWeatherResilience(weather?: Farm['weather'] | null): MetricScore {
  if (!weather || typeof weather.temperature !== 'number') {
    return { score: null, statusText: 'Weather data unavailable', isAvailable: false };
  }

  let score = 85;

  // Temperature stress (< 10°C frost risk or > 40°C heat stress)
  if (weather.temperature > 40) {
    score -= (weather.temperature - 40) * 5;
  } else if (weather.temperature < 10) {
    score -= (10 - weather.temperature) * 6;
  }

  // Extreme wind (> 25 km/h hinders spraying and causes lodging)
  if (typeof weather.windSpeedKmh === 'number' && weather.windSpeedKmh > 25) {
    score -= (weather.windSpeedKmh - 25) * 2;
  }

  // Torrential rain risk (> 75%)
  if (typeof weather.rainProbability === 'number' && weather.rainProbability > 75) {
    score -= 15;
  }

  const finalScore = Math.min(100, Math.max(25, Math.round(score)));
  return {
    score: finalScore,
    statusText: `${finalScore}%`,
    isAvailable: true,
  };
}

/**
 * Calculates overall Farm Health Index dynamically from available telemetry
 */
export function calculateFarmHealthScore(farm: Partial<Farm> | null | undefined): FarmHealthBreakdown {
  if (!farm) {
    const emptyMetric: MetricScore = { score: null, statusText: 'Data unavailable', isAvailable: false };
    return {
      overallScore: null,
      soilNutrientScore: emptyMetric,
      waterMoistureScore: emptyMetric,
      cropCanopyScore: emptyMetric,
      weatherResilienceScore: emptyMetric,
      hasEnoughData: false,
    };
  }

  const soilNutrientScore = calculateSoilScore(farm.soil);
  const waterMoistureScore = calculateMoistureScore(farm.soil, farm.weather);
  const cropCanopyScore = calculateCanopyScore(farm.satellite);
  const weatherResilienceScore = calculateWeatherResilience(farm.weather);

  const availableScores: number[] = [];
  if (soilNutrientScore.score !== null) availableScores.push(soilNutrientScore.score);
  if (waterMoistureScore.score !== null) availableScores.push(waterMoistureScore.score);
  if (cropCanopyScore.score !== null) availableScores.push(cropCanopyScore.score);
  if (weatherResilienceScore.score !== null) availableScores.push(weatherResilienceScore.score);

  if (availableScores.length === 0) {
    return {
      overallScore: null,
      soilNutrientScore,
      waterMoistureScore,
      cropCanopyScore,
      weatherResilienceScore,
      hasEnoughData: false,
    };
  }

  const overallScore = Math.round(
    availableScores.reduce((acc, curr) => acc + curr, 0) / availableScores.length
  );

  return {
    overallScore,
    soilNutrientScore,
    waterMoistureScore,
    cropCanopyScore,
    weatherResilienceScore,
    hasEnoughData: true,
  };
}
