import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useFarm, EMPTY_FARM } from './FarmContext';
import { supabaseService } from '../services/supabaseService';
import { api } from '../services/api';
import {
  FarmIntelligence,
  synthesizeFarmIntelligence,
} from '../services/farmIntelligence';
import { SoilTestRecord, DiseaseScan, CropObservationRecord } from '../types';

interface FarmIntelligenceContextType {
  intelligence: FarmIntelligence;
  isLoadingIntelligence: boolean;
  refreshIntelligence: () => Promise<void>;
  weatherData: any | null;
}

const defaultIntelligence = synthesizeFarmIntelligence({
  farm: EMPTY_FARM,
});

const FarmIntelligenceContext = createContext<FarmIntelligenceContextType | undefined>(undefined);

export const FarmIntelligenceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { farm, user } = useFarm();
  const [weatherData, setWeatherData] = useState<any | null>(null);
  const [soilTests, setSoilTests] = useState<SoilTestRecord[]>([]);
  const [cropObservations, setCropObservations] = useState<CropObservationRecord[]>([]);
  const [diseaseScans, setDiseaseScans] = useState<DiseaseScan[]>([]);
  const [isLoadingIntelligence, setIsLoadingIntelligence] = useState<boolean>(false);

  const fetchFarmTelemetry = useCallback(async () => {
    if (!farm || !farm.id || !user?.id) {
      setWeatherData(null);
      setSoilTests([]);
      setCropObservations([]);
      setDiseaseScans([]);
      return;
    }

    setIsLoadingIntelligence(true);
    try {
      // 1. Fetch live Open-Meteo weather if farm has coordinates
      const lat = farm.location?.latitude || (farm as any).latitude;
      const lon = farm.location?.longitude || (farm as any).longitude;

      let liveWeather = null;
      if (typeof lat === 'number' && typeof lon === 'number' && lat !== 0 && lon !== 0) {
        try {
          const res = await api.getLiveWeather(lat, lon);
          if (res && res.data) {
            liveWeather = {
              temperature: res.data.temperature,
              apparentTemperature: res.data.apparentTemperature,
              condition: res.data.condition,
              rainProbability: res.data.rainProbability24h ?? res.data.rainProbability,
              humidity: res.data.humidity,
              windSpeedKmh: res.data.windSpeedKmh,
              forecast7Days: res.data.forecast7Days,
            };
            setWeatherData(res.data);
          }
        } catch (wErr) {
          console.warn('[FarmIntelligence] Open-Meteo live weather fetch failed, using farm state:', wErr);
        }
      }

      if (!liveWeather && farm.weather) {
        liveWeather = farm.weather;
      }

      // 2. Fetch Soil Tests from Supabase
      const sTests = await supabaseService.getSoilTests(user.id, farm.id);
      setSoilTests(sTests || []);

      // 3. Fetch Crop Observations from Supabase
      const cObs = await supabaseService.getCropObservations(user.id, farm.id);
      setCropObservations(cObs || []);

      // 4. Fetch Disease Scans from Supabase
      const dScans = await supabaseService.getDiseaseScans(user.id, farm.id);
      setDiseaseScans(dScans || []);
    } catch (err) {
      console.warn('[FarmIntelligence] Error refreshing telemetry:', err);
    } finally {
      setIsLoadingIntelligence(false);
    }
  }, [farm, user?.id]);

  useEffect(() => {
    fetchFarmTelemetry();
  }, [fetchFarmTelemetry]);

  // Compute the centralized intelligence whenever any telemetry changes
  const intelligence = useMemo(() => {
    return synthesizeFarmIntelligence({
      farm,
      weather: weatherData || farm.weather,
      soilTests,
      cropObservations,
      diseaseScans,
    });
  }, [farm, weatherData, soilTests, cropObservations, diseaseScans]);

  return (
    <FarmIntelligenceContext.Provider
      value={{
        intelligence,
        isLoadingIntelligence,
        refreshIntelligence: fetchFarmTelemetry,
        weatherData,
      }}
    >
      {children}
    </FarmIntelligenceContext.Provider>
  );
};

export const useFarmIntelligence = (): FarmIntelligenceContextType => {
  const context = useContext(FarmIntelligenceContext);
  if (!context) {
    return {
      intelligence: defaultIntelligence,
      isLoadingIntelligence: false,
      refreshIntelligence: async () => {},
      weatherData: null,
    };
  }
  return context;
};
