import { Farm, DiseaseScan, SoilTestRecord, CropObservationRecord } from '../types';

export interface FarmIntelligenceInput {
  farm: Farm;
  weather?: {
    temperature?: number;
    apparentTemperature?: number;
    condition?: string;
    rainProbability?: number;
    humidity?: number;
    windSpeedKmh?: number;
    forecast7Days?: Array<{
      day: string;
      tempMax: number;
      tempMin: number;
      condition: string;
      rainProbability: number;
    }>;
  } | null;
  soilTests?: SoilTestRecord[];
  cropObservations?: CropObservationRecord[];
  diseaseScans?: DiseaseScan[];
  farmEvents?: any[];
}

export interface PrimaryTodayAction {
  id: string;
  title: string;
  advice: string;
  whatItMeans: string;
  whatToDo: string;
  category: 'irrigation' | 'crop_protection' | 'soil_nutrition' | 'weather' | 'general';
  severity: 'low' | 'medium' | 'high' | 'critical';
  badge: string;
  reasonPoints: Array<{
    title: string;
    description: string;
    category: 'weather' | 'soil' | 'crop' | 'disease';
  }>;
}

export interface DomainAdvisory {
  irrigation: {
    status: string;
    advice: string;
    actionable: string;
    icon: string;
  };
  cropProtection: {
    status: string;
    advice: string;
    actionable: string;
    icon: string;
  };
  soilNutrition: {
    status: string;
    advice: string;
    actionable: string;
    icon: string;
  };
  fieldOperations: {
    status: string;
    advice: string;
    actionable: string;
    icon: string;
  };
}

export interface WeeklyTask {
  id: string;
  day: string;
  title: string;
  description: string;
  category: 'irrigation' | 'fertilizer' | 'protection' | 'monitoring' | 'harvest';
  priority: 'high' | 'normal';
}

export interface FarmIntelligence {
  healthScore: number | null;
  healthStatus: 'Optimal Growth' | 'Moderate Vigor' | 'High Stress' | 'Setup Needed';
  primaryAction: PrimaryTodayAction;
  domainAdvisories: DomainAdvisory;
  weeklyTasks: WeeklyTask[];
  aiPromptContext: string;
  lastSynthesizedAt: string;
  hasSufficientData: boolean;
}

/**
 * Synthesizes cross-domain farm telemetry into actionable, contextual insights.
 * Single source of truth for Dashboard, Weather insights, Alerts, and AI Advisor.
 */
export function synthesizeFarmIntelligence(input: FarmIntelligenceInput): FarmIntelligence {
  const { farm, weather, soilTests = [], cropObservations = [], diseaseScans = [] } = input;
  const now = new Date().toISOString();

  const hasFarm = Boolean(farm && farm.id && (farm.name || farm.farm_name));
  const cropName = farm.crop?.name || farm.crop_variety || '';
  const cropStage = farm.crop?.stage || farm.crop_stage || '';
  const irrigationType = farm.irrigationType || farm.irrigation_type || 'Flood / Canal';
  const hasCrop = Boolean(cropName);

  // 1. Weather Telemetry
  const temp = weather?.temperature;
  const rainProbToday = weather?.rainProbability ?? 0;
  const tomorrowForecast = weather?.forecast7Days?.[1];
  const rainProbTomorrow = tomorrowForecast?.rainProbability ?? 0;
  const isRainImminent = rainProbToday >= 50 || rainProbTomorrow >= 50;
  const windSpeed = weather?.windSpeedKmh ?? 0;
  const isHighWind = windSpeed >= 20;

  // 2. Soil Telemetry
  const latestSoil = soilTests[0] || (farm.soil ? {
    ph: farm.soil.ph,
    moisturePercentage: farm.soil.moisturePercentage,
    nitrogen: farm.soil.nitrogen,
    phosphorus: farm.soil.phosphorus,
    potassium: farm.soil.potassium,
  } : null);

  const soilMoisture = typeof latestSoil?.moisturePercentage === 'number' && latestSoil.moisturePercentage > 0
    ? latestSoil.moisturePercentage
    : null;
  const soilPh = typeof latestSoil?.ph === 'number' && latestSoil.ph > 0 ? latestSoil.ph : null;

  // 3. Pathogen / Disease Scans
  const activeHighScans = diseaseScans.filter((s) => s.severity === 'High' || s.severity === 'Critical');
  const hasActiveDisease = activeHighScans.length > 0;
  const latestDisease = hasActiveDisease ? activeHighScans[0] : null;

  // 4. Calculate Dynamic Farm Health Score
  let calculatedScore: number | null = null;
  let status: 'Optimal Growth' | 'Moderate Vigor' | 'High Stress' | 'Setup Needed' = 'Setup Needed';

  if (hasFarm && hasCrop) {
    let score = 80;

    // Adjust based on soil moisture
    if (soilMoisture !== null) {
      if (soilMoisture >= 35 && soilMoisture <= 65) score += 5;
      else if (soilMoisture < 25) score -= 12;
      else if (soilMoisture > 80) score -= 8;
    }

    // Adjust based on weather stress
    if (typeof temp === 'number') {
      if (temp >= 38) score -= 10;
      else if (temp <= 10 && temp > 0) score -= 8;
    }

    // Adjust based on disease
    if (hasActiveDisease) {
      score -= 18;
    }

    // Adjust based on latest crop observations
    const latestObservation = cropObservations[0];
    if (latestObservation?.healthScore) {
      score = Math.round((score * 0.6) + (latestObservation.healthScore * 0.4));
    }

    calculatedScore = Math.max(25, Math.min(95, score));
    if (calculatedScore >= 75) status = 'Optimal Growth';
    else if (calculatedScore >= 55) status = 'Moderate Vigor';
    else status = 'High Stress';
  }

  // 5. Synthesize Today's Top Priority Action ("What needs my attention today?")
  let primaryAction: PrimaryTodayAction;

  if (!hasFarm || !hasCrop) {
    primaryAction = {
      id: 'act_setup_farm',
      title: 'Configure Farm & Crop Details',
      advice: 'Add your crop name and sowing date to enable automated intelligence.',
      whatItMeans: 'Without your crop and sowing date, KRISHVYA cannot calculate precise water requirements or fertilizer timing.',
      whatToDo: 'Go to My Farm and update your standing crop and sowing date.',
      category: 'general',
      severity: 'medium',
      badge: 'Setup Required',
      reasonPoints: [
        {
          title: 'Farm Profile Incomplete',
          description: 'Register crop details to activate automated weather & soil recommendations.',
          category: 'crop',
        },
      ],
    };
  } else if (isRainImminent && soilMoisture !== null && soilMoisture >= 30) {
    // Cross-Domain Case: Rain predicted + Soil has moisture -> Delay irrigation
    primaryAction = {
      id: 'act_delay_irrigation',
      title: 'Delay Irrigation Ahead of Rainfall',
      advice: `Rain is expected (${Math.max(rainProbToday, rainProbTomorrow)}% chance). Delay irrigation by 24-48 hours.`,
      whatItMeans: `Your soil already has ${soilMoisture}% moisture. Irrigating now right before rain will cause waterlogging and waste pump costs.`,
      whatToDo: `Keep ${irrigationType} pumps turned off today. Clear drainage outlets so rain drains smoothly.`,
      category: 'irrigation',
      severity: 'medium',
      badge: 'Save Water & Power',
      reasonPoints: [
        {
          title: `Rain Forecast (${Math.max(rainProbToday, rainProbTomorrow)}%)`,
          description: `Radar indicates rain arriving within 24-36 hours over ${farm.name || 'field'}.`,
          category: 'weather',
        },
        {
          title: `Soil Moisture (${soilMoisture}%)`,
          description: 'Current moisture is sufficient for root zone respiration.',
          category: 'soil',
        },
        {
          title: `Standing ${cropName}`,
          description: `Avoid root asphyxiation during the active ${cropStage || 'growth'} stage.`,
          category: 'crop',
        },
      ],
    };
  } else if (hasActiveDisease && isHighWind) {
    // Cross-Domain Case: Pathogen present + High wind -> Hold spray
    primaryAction = {
      id: 'act_hold_spray_wind',
      title: 'Hold Foliar Spray: High Wind Alert',
      advice: `High winds (${windSpeed} km/h) detected. Delay foliar spray for ${latestDisease?.detectedProblem || 'crop protection'}.`,
      whatItMeans: 'High wind speeds cause droplet drift, wasting chemical input and risking neighboring plots.',
      whatToDo: 'Postpone spraying until early morning when wind drops below 10 km/h.',
      category: 'crop_protection',
      severity: 'high',
      badge: 'Drift Hazard',
      reasonPoints: [
        {
          title: `Sustained Wind (${windSpeed} km/h)`,
          description: 'Wind exceeds safe threshold for uniform droplet deposition.',
          category: 'weather',
        },
        {
          title: `Active Issue: ${latestDisease?.detectedProblem}`,
          description: `Identified on ${latestDisease?.crop || cropName}. Target treatment ready for calm window.`,
          category: 'disease',
        },
      ],
    };
  } else if (hasActiveDisease && isRainImminent) {
    // Cross-Domain Case: Pathogen present + Rain expected -> Hold spray
    primaryAction = {
      id: 'act_hold_spray_rain',
      title: 'Hold Chemical Application: Rain Hazard',
      advice: `Rain is expected within 24 hours. Postpone foliar spray for ${latestDisease?.detectedProblem}.`,
      whatItMeans: 'Precipitation will wash away sprays before absorption, wasting money and causing chemical runoff.',
      whatToDo: 'Wait until the rain passes and leaf canopy dries before applying treatment.',
      category: 'crop_protection',
      severity: 'high',
      badge: 'Washout Risk',
      reasonPoints: [
        {
          title: 'Rain Expected',
          description: `${Math.max(rainProbToday, rainProbTomorrow)}% precipitation probability will wash foliar film.`,
          category: 'weather',
        },
        {
          title: `Pathogen: ${latestDisease?.detectedProblem}`,
          description: 'Prepare biological or systemic treatment for the first dry post-rain morning.',
          category: 'disease',
        },
      ],
    };
  } else if (hasActiveDisease) {
    // Cross-Domain Case: Pathogen present + Weather clear -> Spray immediately
    primaryAction = {
      id: 'act_treat_disease',
      title: `Treat ${latestDisease?.detectedProblem} Promptly`,
      advice: `Conditions are calm and clear. Apply treatment for ${latestDisease?.detectedProblem} on ${cropName}.`,
      whatItMeans: 'Weather conditions are optimal for maximum chemical or biological efficacy with zero rain washout.',
      whatToDo: `Apply recommended treatment in early morning or late afternoon. Spray underside of leaves where spores cluster.`,
      category: 'crop_protection',
      severity: 'high',
      badge: 'Action Window Open',
      reasonPoints: [
        {
          title: `Detected: ${latestDisease?.detectedProblem}`,
          description: `Confirmed high severity on ${latestDisease?.crop || cropName}.`,
          category: 'disease',
        },
        {
          title: 'Weather Window Favorable',
          description: 'Low wind and clear skies ensure strong foliar absorption.',
          category: 'weather',
        },
      ],
    };
  } else if (soilMoisture !== null && soilMoisture < 25 && !isRainImminent) {
    // Cross-Domain Case: Soil moisture deficit + Dry weather -> Irrigate now
    primaryAction = {
      id: 'act_irrigate_needed',
      title: 'Irrigate Field: Soil Moisture Deficit',
      advice: `Soil moisture is low (${soilMoisture}%) with no rain in forecast. Apply ${irrigationType} today.`,
      whatItMeans: 'The root zone has depleted accessible moisture. Crops may experience vegetative wilt and stunted growth.',
      whatToDo: `Run ${irrigationType} in the early morning or evening to minimize evaporation losses.`,
      category: 'irrigation',
      severity: 'high',
      badge: 'Water Deficit',
      reasonPoints: [
        {
          title: `Soil Moisture Deficit (${soilMoisture}%)`,
          description: 'Below optimal 35-65% root moisture zone.',
          category: 'soil',
        },
        {
          title: `Dry Forecast (${rainProbToday}% rain)`,
          description: 'No significant rainfall expected over next 48 hours.',
          category: 'weather',
        },
      ],
    };
  } else if (soilPh !== null && soilPh < 5.8) {
    primaryAction = {
      id: 'act_acid_soil',
      title: 'Apply Agricultural Lime for Acidic Soil',
      advice: `Soil pH (${soilPh}) is acidic. Plan agricultural lime amendment.`,
      whatItMeans: 'Acidic soil locks up phosphorus and micro-nutrients, retarding root development.',
      whatToDo: 'Broadcast agricultural lime or dolomite evenly and incorporate during inter-row cultivation.',
      category: 'soil_nutrition',
      severity: 'medium',
      badge: 'Soil Health',
      reasonPoints: [
        {
          title: `Low pH (${soilPh})`,
          description: 'Nutrient fixation occurs below pH 6.0.',
          category: 'soil',
        },
      ],
    };
  } else {
    // Default Optimal Nominal Action
    primaryAction = {
      id: 'act_nominal_scouting',
      title: `Field Conditions Nominal for ${cropName || 'Farm'}`,
      advice: `Weather and soil conditions are balanced. Conduct routine crop scouting for ${cropStage || 'standing crop'}.`,
      whatItMeans: 'No acute weather, water, or pest stress detected across your farm parcel.',
      whatToDo: 'Walk across the field to inspect leaf canopy, weed growth, and irrigation lines.',
      category: 'general',
      severity: 'low',
      badge: 'Field Nominal',
      reasonPoints: [
        {
          title: 'Weather Stable',
          description: typeof temp === 'number' ? `Temperature ${temp}°C, favorable for ${cropName || 'crops'}.` : 'Weather conditions stable.',
          category: 'weather',
        },
        {
          title: 'Soil Moisture Adequate',
          description: soilMoisture !== null ? `Soil moisture at ${soilMoisture}%.` : 'Moisture levels in healthy range.',
          category: 'soil',
        },
      ],
    };
  }

  // 6. Domain-by-Domain Advisories
  const domainAdvisories: DomainAdvisory = {
    irrigation: {
      status: isRainImminent ? 'Delay Watering' : (soilMoisture !== null && soilMoisture < 25 ? 'Irrigation Needed' : 'Adequate Moisture'),
      advice: isRainImminent
        ? `Rain coming (${Math.max(rainProbToday, rainProbTomorrow)}%). Keep pumps off.`
        : (soilMoisture !== null && soilMoisture < 25 ? 'Soil is dry. Irrigate today.' : 'Soil moisture is in balanced range.'),
      actionable: isRainImminent ? 'Inspect drainage ditches' : 'Follow standard schedule',
      icon: 'droplets',
    },
    cropProtection: {
      status: hasActiveDisease ? 'Pathogen Alert' : 'Canopy Protected',
      advice: hasActiveDisease
        ? `${latestDisease?.detectedProblem} flagged. ${isRainImminent || isHighWind ? 'Hold spray until weather settles.' : 'Spray window open.'}`
        : 'Zero active disease alerts on registered field.',
      actionable: hasActiveDisease ? 'View Disease Doctor' : 'Routine scouting',
      icon: 'shield',
    },
    soilNutrition: {
      status: soilPh !== null && (soilPh < 5.8 || soilPh > 8.2) ? 'Amendment Needed' : 'Nutrients Nominal',
      advice: soilPh !== null && soilPh < 5.8
        ? `Acidic soil (pH ${soilPh}). Lime recommended.`
        : (soilPh !== null && soilPh > 8.2 ? `Alkaline soil (pH ${soilPh}). Gypsum recommended.` : 'Soil chemistry is balanced.'),
      actionable: 'Review Soil Test',
      icon: 'layers',
    },
    fieldOperations: {
      status: cropStage?.toLowerCase().includes('harvest') ? 'Harvest Window' : 'Growth Maintenance',
      advice: cropStage?.toLowerCase().includes('harvest')
        ? 'Crop is near maturity. Schedule harvesting crew.'
        : `Support ${cropName || 'crop'} vegetative vigor during ${cropStage || 'active growth'}.`,
      actionable: 'View Crop Planner',
      icon: 'sprout',
    },
  };

  // 7. Dynamic Weekly Tasks ("What should I do this week?")
  const weeklyTasks: WeeklyTask[] = [
    {
      id: 'task_1',
      day: 'Monday',
      title: isRainImminent ? 'Clear Drainage Furrows' : 'Irrigation Check',
      description: isRainImminent
        ? 'Clear furrows and field bunds to avoid standing water after forecast rain.'
        : `Check ${irrigationType} nozzles and deliver light root irrigation.`,
      category: 'irrigation',
      priority: 'high',
    },
    {
      id: 'task_2',
      day: 'Wednesday',
      title: hasActiveDisease ? `Scout & Treat ${latestDisease?.detectedProblem}` : 'Canopy Pest Scouting',
      description: hasActiveDisease
        ? 'Check underside of leaves in affected parcel to confirm whether pathogen has spread.'
        : 'Inspect 20 random plants across field diagonals for aphid or caterpillar feeding.',
      category: 'protection',
      priority: hasActiveDisease ? 'high' : 'normal',
    },
    {
      id: 'task_3',
      day: 'Friday',
      title: 'Soil Nutrient & Foliar Boost',
      description: cropStage?.toLowerCase().includes('flower')
        ? 'Apply recommended micronutrient / potassium spray for flowering strength.'
        : 'Inspect soil moisture retention and check for nitrogen deficiency yellowing.',
      category: 'fertilizer',
      priority: 'normal',
    },
    {
      id: 'task_4',
      day: 'Sunday',
      title: 'Weekly Farm Log & Health Review',
      description: 'Review satellite vegetation index and log weekly field operations in KRISHVYA.',
      category: 'monitoring',
      priority: 'normal',
    },
  ];

  // 8. AI Prompt Context for AI Advisor
  const aiPromptContext = [
    `--- ACTIVE FARM CONTEXT (SINGLE SOURCE OF TRUTH) ---`,
    `Farm: ${farm.name || 'Unnamed Farm'} (${farm.size || 0} ${farm.sizeUnit || 'acres'}, ${farm.location?.district || farm.location?.address || 'India'})`,
    `Standing Crop: ${cropName || 'Not configured'} | Variety: ${farm.crop?.variety || 'Standard'} | Growth Stage: ${cropStage || 'Active'}`,
    `Irrigation System: ${irrigationType}`,
    `Live Weather: ${typeof temp === 'number' ? `${temp}°C, ${weather?.condition || 'Clear'}` : 'Not available'}, Rain Probability: ${rainProbToday}%, Wind: ${windSpeed} km/h`,
    `Soil Telemetry: ${soilMoisture !== null ? `Moisture ${soilMoisture}%` : 'Moisture unknown'}, pH: ${soilPh !== null ? soilPh : 'Unknown'}`,
    `Pathogen Status: ${hasActiveDisease ? `ALERT: ${latestDisease?.detectedProblem} (Severity: ${latestDisease?.severity})` : 'Zero active disease infections detected'}`,
    `Today's Primary Recommendation: "${primaryAction.title} - ${primaryAction.advice}"`,
    `Reason: ${primaryAction.whatItMeans} Action: ${primaryAction.whatToDo}`,
    `----------------------------------------------------`,
  ].join('\n');

  return {
    healthScore: calculatedScore,
    healthStatus: status,
    primaryAction,
    domainAdvisories,
    weeklyTasks,
    aiPromptContext,
    lastSynthesizedAt: now,
    hasSufficientData: Boolean(hasFarm && hasCrop),
  };
}
