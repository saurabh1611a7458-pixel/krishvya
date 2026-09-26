import { Farm, DiseaseScan } from '../types';
import { calculateDynamicCropStage } from '../utils/cropStageUtils';

export interface CropHealthEvaluation {
  isSufficient: boolean;
  reason?: string;
  healthScore: number | null;
  ndviScore: number | null;
  vegetationStatus: string;
  stressDetected: boolean;
  stressDetails?: {
    cause: string;
    action: string;
  };
}

export function evaluateCropHealth(
  farm: Farm,
  diseaseScans: DiseaseScan[] = []
): CropHealthEvaluation {
  const cropName = farm.crop?.name || farm.crop_variety;
  const sowingDate = farm.crop?.sowingDate || farm.sowing_date;

  // Real data sufficiency check: Requires registered crop and sowing date or real soil test
  if (!cropName || !sowingDate) {
    return {
      isSufficient: false,
      reason: 'Insufficient data: Dynamic crop health monitoring requires a registered crop and sowing date.',
      healthScore: null,
      ndviScore: null,
      vegetationStatus: 'Telemetry Pending',
      stressDetected: false,
    };
  }

  const stageInfo = calculateDynamicCropStage(cropName, farm.crop?.variety, sowingDate);
  if (stageInfo.status !== 'valid') {
    return {
      isSufficient: false,
      reason: 'Insufficient data: Sowing date is invalid or in the future.',
      healthScore: null,
      ndviScore: null,
      vegetationStatus: 'Telemetry Pending',
      stressDetected: false,
    };
  }

  // Base score from crop stage progress
  let computedScore = 85;
  let stressDetected = false;
  let stressCause = '';
  let stressAction = '';

  // 1. Disease Scan impact
  const activeScans = diseaseScans.filter((s) => s.severity === 'High' || s.severity === 'Critical');
  if (activeScans.length > 0) {
    computedScore -= 20;
    stressDetected = true;
    stressCause = `Active infection: ${activeScans[0].detectedProblem}`;
    stressAction = activeScans[0].recommendation || 'Consult agronomist and apply targeted containment.';
  }

  // 2. Soil impact
  if (farm.soil?.moisturePercentage && farm.soil.moisturePercentage > 0 && farm.soil.moisturePercentage < 22) {
    computedScore -= 12;
    if (!stressDetected) {
      stressDetected = true;
      stressCause = 'Soil moisture deficit in root zone';
      stressAction = 'Initiate scheduled furrow or drip irrigation.';
    }
  }

  // 3. Weather impact
  if (farm.weather?.temperature && farm.weather.temperature >= 38) {
    computedScore -= 8;
    if (!stressDetected) {
      stressDetected = true;
      stressCause = `High heat stress (${farm.weather.temperature}°C)`;
      stressAction = 'Maintain light irrigation to reduce canopy heat load.';
    }
  }

  computedScore = Math.max(30, Math.min(95, computedScore));

  // NDVI dynamic estimate based on stage progress & health
  // Peak NDVI occurs between 40% and 75% of growth cycle
  let baseNdvi = 0.40;
  if (stageInfo.progressPercent > 20 && stageInfo.progressPercent <= 75) {
    baseNdvi = 0.75;
  } else if (stageInfo.progressPercent > 75) {
    baseNdvi = 0.55; // Senescence towards harvest
  }
  const adjustedNdvi = Number((baseNdvi * (computedScore / 100)).toFixed(2));

  let vegetationStatus = 'Optimal Growth';
  if (computedScore < 60) vegetationStatus = 'High Canopy Stress';
  else if (computedScore < 75) vegetationStatus = 'Moderate Vigor';

  return {
    isSufficient: true,
    healthScore: computedScore,
    ndviScore: adjustedNdvi,
    vegetationStatus,
    stressDetected,
    stressDetails: stressDetected ? { cause: stressCause, action: stressAction } : undefined,
  };
}
