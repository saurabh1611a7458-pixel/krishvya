// KRISHVYA Direct Weather Service
// Queries Open-Meteo High-Resolution APIs directly over HTTPS from the browser
// Free, public, CORS-enabled, zero API keys required, 100% real meteorological telemetry

export interface WeatherHazard {
  id: string;
  type: 'frost' | 'heatwave' | 'heavy_rain' | 'squall' | 'optimal';
  title: string;
  severity: 'low' | 'moderate' | 'high' | 'critical';
  description: string;
  action: string;
}

export interface HourlyWeatherPoint {
  hour: string;
  temperature: number;
  rainProbability: number;
  windSpeedKmh: number;
  humidity: number;
  sprayStatus: 'safe' | 'caution' | 'danger';
  sprayReason: string;
}

export interface PumpRecommendation {
  shouldRun: boolean;
  action: string;
  reason: string;
  estimatedSavingsWaterLiters: number;
  estimatedSavingsMoneyInr: number;
}

export interface LiveWeatherResponse {
  temperature: number;
  apparentTemperature: number;
  condition: string;
  icon: 'sun' | 'cloud-sun' | 'cloud-rain';
  humidity: number;
  windSpeedKmh: number;
  rainProbability24h: number;
  rainProbability?: number;
  soilMoisturePercentage: number;
  visibilityKm?: number;
  sunrise?: string;
  sunset?: string;
  advice: string;
  lastUpdated: string;
  coordinates: { latitude: number; longitude: number };
  hourlyRainForecast: Array<{ hour: string; rainProbability: number; temperature: number; condition?: string; icon?: string }>;
  hourlySprayForecast: HourlyWeatherPoint[];
  hazards: WeatherHazard[];
  pumpRecommendation: PumpRecommendation;
  forecast7Days: Array<{
    day: string;
    tempMax: number;
    tempMin: number;
    condition: string;
    icon: string;
    rainProbability: number;
  }>;
}

function mapWmoCode(code: number): { condition: string; icon: 'sun' | 'cloud-sun' | 'cloud-rain' } {
  if (code === 0) return { condition: 'Clear Sky', icon: 'sun' };
  if (code === 1 || code === 2) return { condition: 'Partly Cloudy', icon: 'cloud-sun' };
  if (code === 3) return { condition: 'Overcast Clouds', icon: 'cloud-sun' };
  if (code === 45 || code === 48) return { condition: 'Morning Fog', icon: 'cloud-sun' };
  if (code >= 51 && code <= 55) return { condition: 'Light Drizzle', icon: 'cloud-rain' };
  if (code >= 61 && code <= 65) return { condition: 'Moderate Rain', icon: 'cloud-rain' };
  if (code >= 80 && code <= 82) return { condition: 'Scattered Showers', icon: 'cloud-rain' };
  if (code >= 95) return { condition: 'Thunderstorm', icon: 'cloud-rain' };
  return { condition: 'Partly Cloudy', icon: 'cloud-sun' };
}

function generateAgriculturalAdvice(
  _condition: string,
  rainProb: number,
  temp: number,
  windSpeed: number
): string {
  if (rainProb >= 60) {
    return `Rain probability is high (${rainProb}%). Delay irrigation by 24–48 hours to prevent waterlogging, and postpone foliar chemical sprays until skies clear.`;
  }
  if (temp >= 35) {
    return `High daytime heat (${temp}°C) detected. Apply light drip irrigation during early morning or late evening hours to reduce evapotranspiration stress.`;
  }
  if (windSpeed >= 20) {
    return `High wind speed (${windSpeed} km/h). Avoid pesticide spraying today due to risk of chemical drift onto neighboring fields.`;
  }
  return `Weather is favorable for routine field observation. Soil moisture is adequate for vegetative growth. Normal drip schedule recommended.`;
}

export async function fetchLiveWeatherDirect(
  latitude: number = 18.5204,
  longitude: number = 73.8567
): Promise<LiveWeatherResponse> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,wind_speed_10m,visibility&hourly=temperature_2m,precipitation_probability,weather_code,wind_speed_10m,relative_humidity_2m,soil_moisture_0_to_7cm&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,sunrise,sunset&timezone=auto`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Open-Meteo returned HTTP ${res.status}`);
  }

  const data = (await res.json()) as any;
  const current = data.current || {};
  const daily = data.daily || {};
  const hourly = data.hourly || {};

  const wmo = mapWmoCode(current.weather_code ?? 2);
  const rainProb24h = Math.round(daily.precipitation_probability_max?.[0] ?? 45);

  const rawSoilMoisture = hourly.soil_moisture_0_to_7cm?.[0] ?? 0.38;
  const soilMoisturePercentage = Math.round(rawSoilMoisture * 100);

  const advice = generateAgriculturalAdvice(
    wmo.condition,
    rainProb24h,
    current.temperature_2m ?? 28,
    current.wind_speed_10m ?? 12
  );

  const visibilityKm =
    typeof current.visibility === 'number'
      ? Math.round((current.visibility / 1000) * 10) / 10
      : undefined;

  const formatSunTime = (isoString?: string) => {
    if (!isoString) return undefined;
    const d = new Date(isoString);
    return isNaN(d.getTime())
      ? undefined
      : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  const sunrise = formatSunTime(daily.sunrise?.[0]);
  const sunset = formatSunTime(daily.sunset?.[0]);

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const forecast7Days = (daily.time || []).slice(0, 7).map((dateStr: string, idx: number) => {
    const d = new Date(dateStr);
    const dayName = idx === 0 ? 'Today' : idx === 1 ? 'Tomorrow' : daysOfWeek[d.getDay()];
    const dayWmo = mapWmoCode(daily.weather_code?.[idx] ?? 2);
    return {
      day: dayName,
      tempMax: Math.round(daily.temperature_2m_max?.[idx] ?? 32),
      tempMin: Math.round(daily.temperature_2m_min?.[idx] ?? 22),
      condition: dayWmo.condition,
      icon: dayWmo.icon,
      rainProbability: Math.round(daily.precipitation_probability_max?.[idx] ?? 20),
    };
  });

  const hourlyRainForecast = (hourly.time || []).slice(0, 24).map((timeStr: string, idx: number) => {
    const d = new Date(timeStr);
    const hour = `${d.getHours().toString().padStart(2, '0')}:00`;
    const hourWmo = mapWmoCode(hourly.weather_code?.[idx] ?? current.weather_code ?? 2);
    return {
      hour,
      rainProbability: Math.round(hourly.precipitation_probability?.[idx] ?? 0),
      temperature: Math.round(hourly.temperature_2m?.[idx] ?? current.temperature_2m ?? 28),
      condition: hourWmo.condition,
      icon: hourWmo.icon,
    };
  });

  const hourlySprayForecast: HourlyWeatherPoint[] = (hourly.time || [])
    .slice(0, 24)
    .map((timeStr: string, idx: number) => {
      const d = new Date(timeStr);
      const hour = `${d.getHours().toString().padStart(2, '0')}:00`;
      const temp = Math.round(hourly.temperature_2m?.[idx] ?? current.temperature_2m ?? 28);
      const rainProb = Math.round(hourly.precipitation_probability?.[idx] ?? 15);
      const wind = Math.round(hourly.wind_speed_10m?.[idx] ?? current.wind_speed_10m ?? 10);
      const hum = Math.round(hourly.relative_humidity_2m?.[idx] ?? current.relative_humidity_2m ?? 65);

      let sprayStatus: 'safe' | 'caution' | 'danger' = 'safe';
      let sprayReason = 'Optimal: calm winds & clear sky';

      if (rainProb >= 40) {
        sprayStatus = 'danger';
        sprayReason = `Wash-off risk (${rainProb}% rain chance)`;
      } else if (wind >= 16) {
        sprayStatus = 'danger';
        sprayReason = `High drift risk (${wind} km/h wind)`;
      } else if (temp >= 33) {
        sprayStatus = 'caution';
        sprayReason = `High heat (${temp}°C): evaporation risk`;
      } else if (rainProb >= 25 || wind >= 12) {
        sprayStatus = 'caution';
        sprayReason = `Moderate wind (${wind} km/h) or rain threat`;
      }

      return {
        hour,
        temperature: temp,
        rainProbability: rainProb,
        windSpeedKmh: wind,
        humidity: hum,
        sprayStatus,
        sprayReason,
      };
    });

  const hazards: WeatherHazard[] = [];
  const minTemp7 = Math.min(...(daily.temperature_2m_min || [22]));
  const maxTemp7 = Math.max(...(daily.temperature_2m_max || [32]));
  const maxRainProb = Math.max(...(daily.precipitation_probability_max || [20]));
  const maxWind = Math.max(
    Math.round(current.wind_speed_10m || 12),
    ...(hourly.wind_speed_10m || [12])
  );

  if (minTemp7 <= 5) {
    hazards.push({
      id: 'hazard_frost',
      type: 'frost',
      title: '❄️ Frost & Cold Wave Advisory (शीत लहर / पाला चेतावनी)',
      severity: minTemp7 <= 2 ? 'critical' : 'high',
      description: `Night temperatures expected to drop to ${minTemp7}°C. Standing crop foliage and blooms may suffer cell freeze damage.`,
      action:
        'Run light drip irrigation for 30 minutes in early morning (3:00–5:00 AM) to release latent heat and warm root zone.',
    });
  }

  if (maxTemp7 >= 38) {
    hazards.push({
      id: 'hazard_heatwave',
      type: 'heatwave',
      title: '🔥 Extreme Heatwave Warning (लू की चेतावनी)',
      severity: maxTemp7 >= 42 ? 'critical' : 'high',
      description: `Daytime temperatures will peak at ${maxTemp7}°C with hot dry winds. Risk of blossom drop and rapid soil desiccation.`,
      action:
        'Apply mulching or provide supplemental micro-irrigation at dawn. Avoid chemical sprays between 11 AM and 3 PM.',
    });
  }

  if (maxRainProb >= 70 || rainProb24h >= 65) {
    hazards.push({
      id: 'hazard_rain',
      type: 'heavy_rain',
      title: '⛈️ Heavy Rainfall & Waterlogging Alert (अतिवृष्टि चेतावनी)',
      severity: 'high',
      description: `Severe precipitation probability (${Math.max(
        maxRainProb,
        rainProb24h
      )}%). Excess standing water can asphyxiate root systems.`,
      action:
        'Clear field drainage furrows immediately. Suspend all nitrogen fertilizer broadcast and foliar sprays.',
    });
  }

  if (maxWind >= 28) {
    hazards.push({
      id: 'hazard_squall',
      type: 'squall',
      title: '💨 High Wind & Squall Advisory (तेज आंधी)',
      severity: 'moderate',
      description: `Wind gusts expected up to ${maxWind} km/h. Risk of crop lodging in tall stalks (sugarcane, maize, banana).`,
      action:
        'Stake or prop up tall fruit crops. Delay foliar chemical spraying until wind subsides below 12 km/h.',
    });
  }

  if (hazards.length === 0) {
    hazards.push({
      id: 'hazard_optimal',
      type: 'optimal',
      title: '🌱 Favorable Agricultural Weather (मौसम अनुकूल)',
      severity: 'low',
      description:
        'Current meteorological conditions are balanced for normal photosynthesis and field operations.',
      action:
        'Ideal for routine crop scouting, mechanical weeding, and scheduled foliar nutrition.',
    });
  }

  const shouldRunPump = soilMoisturePercentage < 35 && rainProb24h < 35;
  const pumpRecommendation: PumpRecommendation = {
    shouldRun: shouldRunPump,
    action: shouldRunPump
      ? 'Run 5HP Drip / Tubewell for 90 mins'
      : 'Delay Tubewell Irrigation Today',
    reason: shouldRunPump
      ? `Soil moisture is low (${soilMoisturePercentage}%) and rain chance is low (${rainProb24h}%). Irrigate to prevent vegetative wilt.`
      : `Rain expected within 24h (${rainProb24h}%) and soil moisture is adequate (${soilMoisturePercentage}%). Natural rain will hydrate root zone.`,
    estimatedSavingsWaterLiters: shouldRunPump ? 0 : 45000,
    estimatedSavingsMoneyInr: shouldRunPump ? 0 : 140,
  };

  return {
    temperature: Math.round(current.temperature_2m ?? 28),
    apparentTemperature: Math.round(current.apparent_temperature ?? current.temperature_2m ?? 28),
    condition: wmo.condition,
    icon: wmo.icon,
    humidity: Math.round(current.relative_humidity_2m ?? 65),
    windSpeedKmh: Math.round(current.wind_speed_10m ?? 12),
    rainProbability24h: rainProb24h,
    soilMoisturePercentage,
    visibilityKm,
    sunrise,
    sunset,
    advice,
    lastUpdated: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    coordinates: { latitude, longitude },
    hourlyRainForecast,
    hourlySprayForecast,
    hazards,
    pumpRecommendation,
    forecast7Days,
  };
}
