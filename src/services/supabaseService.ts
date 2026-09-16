import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Farm, ProblemCase, ProblemCategory, DiseaseScan } from '../types';
import { AlertItem } from '../data/mockData';

export const supabaseService = {
  /**
   * Check if Supabase is connected and responding
   */
  async ping(): Promise<boolean> {
    if (!isSupabaseConfigured) return false;
    try {
      const { error } = await supabase.from('farms').select('id').limit(1);
      return !error;
    } catch {
      return false;
    }
  },

  /**
  /**
   * Helper to map Supabase relational row into typed Farm
   */
  mapFarmRow(row: any): Farm {
    const cropRow = Array.isArray(row.crop) ? row.crop[0] : row.crop;
    const soilRow = Array.isArray(row.soil) ? row.soil[0] : row.soil;
    const weatherRow = Array.isArray(row.weather) ? row.weather[0] : row.weather;
    const satRow = Array.isArray(row.satellite) ? row.satellite[0] : row.satellite;

    const boundary = Array.isArray(row.boundary_vertices) && row.boundary_vertices.length >= 3
      ? row.boundary_vertices
      : undefined;

    return {
      id: row.id,
      name: row.name || 'My Farm',
      ownerId: row.owner_id,
      location: {
        address: row.address || '',
        district: row.district || '',
        state: row.state || '',
        latitude: typeof row.latitude === 'number' ? row.latitude : 0,
        longitude: typeof row.longitude === 'number' ? row.longitude : 0,
        boundaryVertices: boundary,
      },
      size: Number(row.size) || 0,
      sizeUnit: (row.size_unit as 'acres' | 'hectares') || 'acres',
      farmHealthScore: typeof row.farm_health_score === 'number' ? row.farm_health_score : 0,
      irrigationType: row.irrigation_type || 'Drip',
      boundaryVertices: boundary,
      crop: {
        id: cropRow?.id || '',
        name: cropRow?.name || '',
        variety: cropRow?.variety || '',
        stage: cropRow?.stage || '',
        sowingDate: cropRow?.sowing_date || '',
        expectedHarvestDate: cropRow?.expected_harvest_date || '',
        imageUrl: cropRow?.image_url,
      },
      soil: {
        healthScore: typeof soilRow?.health_score === 'number' ? soilRow.health_score : 0,
        nitrogen: soilRow?.nitrogen || '',
        phosphorus: soilRow?.phosphorus || '',
        potassium: soilRow?.potassium || '',
        ph: typeof soilRow?.ph === 'number' ? soilRow.ph : 0,
        organicCarbon: soilRow?.organic_carbon || '',
        moisturePercentage: typeof soilRow?.moisture_percentage === 'number' ? soilRow.moisture_percentage : 0,
        soilType: soilRow?.soil_type || '',
        lastTestedDate: soilRow?.last_tested_date,
      },
      weather: {
        temperature: typeof weatherRow?.temperature === 'number' ? weatherRow.temperature : 0,
        condition: weatherRow?.condition || '',
        conditionIcon: weatherRow?.condition_icon || 'cloud-sun',
        rainProbability: typeof weatherRow?.rain_probability === 'number' ? weatherRow.rain_probability : 0,
        humidity: typeof weatherRow?.humidity === 'number' ? weatherRow.humidity : 0,
        windSpeedKmh: typeof weatherRow?.wind_speed_kmh === 'number' ? weatherRow.wind_speed_kmh : 0,
        advice: weatherRow?.advice || '',
        forecast7Days: Array.isArray(weatherRow?.forecast_7days) ? weatherRow.forecast_7days : [],
      },
      satellite: {
        healthScore: typeof satRow?.health_score === 'number' ? satRow.health_score : 0,
        ndvi: typeof satRow?.ndvi === 'number' ? satRow.ndvi : 0,
        lastUpdated: satRow?.last_updated || '',
        stressDetected: Boolean(satRow?.stress_detected),
        stressAreaDescription: satRow?.stress_area_description,
      },
    };
  },

  /**
   * Fetch all farms owned by a specific authenticated user
   */
  async getFarmsByOwner(ownerId: string): Promise<Farm[]> {
    if (!isSupabaseConfigured || !ownerId) return [];

    try {
      const { data, error } = await supabase
        .from('farms')
        .select(`
          *,
          crop:crops(*),
          soil:soil_data(*),
          weather:weather_data(*),
          satellite:satellite_data(*)
        `)
        .eq('owner_id', ownerId)
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        return [];
      }

      return data.map((row: any) => this.mapFarmRow(row));
    } catch (err) {
      console.warn('[SupabaseService] getFarmsByOwner error:', err);
      return [];
    }
  },

  /**
   * Fetch farm along with crop, soil, weather, and satellite data
   */
  async getFarm(farmIdOrOwnerId?: string): Promise<Farm | null> {
    if (!isSupabaseConfigured) return null;

    try {
      let query = supabase
        .from('farms')
        .select(`
          *,
          crop:crops(*),
          soil:soil_data(*),
          weather:weather_data(*),
          satellite:satellite_data(*)
        `)
        .order('created_at', { ascending: false })
        .limit(1);

      if (farmIdOrOwnerId) {
        // If it starts with farm_, search by id, otherwise search by owner_id
        if (farmIdOrOwnerId.startsWith('farm_')) {
          query = query.eq('id', farmIdOrOwnerId);
        } else {
          query = query.eq('owner_id', farmIdOrOwnerId);
        }
      }

      const { data, error } = await query;

      if (error || !data || data.length === 0) {
        return null;
      }

      return this.mapFarmRow(data[0]);
    } catch (err) {
      console.warn('[SupabaseService] getFarm error:', err);
      return null;
    }
  },

  /**
   * Save or update farm details in Supabase (including crops and soil)
   */
  async upsertFarm(farm: Farm): Promise<boolean> {
    if (!isSupabaseConfigured) return false;

    try {
      const boundary = farm.boundaryVertices || farm.location?.boundaryVertices || [];

      const { error: farmError } = await supabase.from('farms').upsert({
        id: farm.id,
        owner_id: farm.ownerId,
        name: farm.name,
        address: farm.location.address,
        district: farm.location.district,
        state: farm.location.state,
        latitude: farm.location.latitude,
        longitude: farm.location.longitude,
        size: farm.size,
        size_unit: farm.sizeUnit,
        farm_health_score: farm.farmHealthScore,
        irrigation_type: farm.irrigationType,
        boundary_vertices: boundary,
        updated_at: new Date().toISOString(),
      });

      if (farmError) {
        console.warn('[SupabaseService] upsertFarm error:', farmError);
        return false;
      }

      // Upsert Crop
      if (farm.crop && farm.crop.name) {
        await supabase.from('crops').upsert({
          farm_id: farm.id,
          name: farm.crop.name,
          variety: farm.crop.variety || '',
          stage: farm.crop.stage || '',
          sowing_date: farm.crop.sowingDate || null,
          expected_harvest_date: farm.crop.expectedHarvestDate || null,
        }, { onConflict: 'farm_id' });
      }

      // Upsert Soil Data
      if (farm.soil && (farm.soil.soilType || farm.soil.healthScore)) {
        await supabase.from('soil_data').upsert({
          farm_id: farm.id,
          soil_type: farm.soil.soilType || '',
          health_score: farm.soil.healthScore || 0,
          nitrogen: farm.soil.nitrogen || 'Good',
          phosphorus: farm.soil.phosphorus || 'Medium',
          potassium: farm.soil.potassium || 'Good',
          ph: farm.soil.ph || 6.8,
          organic_carbon: farm.soil.organicCarbon || '',
          moisture_percentage: farm.soil.moisturePercentage || 0,
          last_tested_date: farm.soil.lastTestedDate || new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString(),
        }, { onConflict: 'farm_id' });
      }

      return true;
    } catch (err) {
      console.warn('[SupabaseService] upsertFarm failed:', err);
      return false;
    }
  },

  /**
   * Delete a farm and cascading records in Supabase
   */
  async deleteFarm(farmId: string): Promise<boolean> {
    if (!isSupabaseConfigured || !farmId) return false;
    try {
      const { error } = await supabase.from('farms').delete().eq('id', farmId);
      return !error;
    } catch (err) {
      console.warn('[SupabaseService] deleteFarm error:', err);
      return false;
    }
  },

  /**
   * Fetch all problem cases from Supabase
   */
  async getProblemCases(farmerId?: string): Promise<ProblemCase[]> {
    if (!isSupabaseConfigured) return [];

    try {
      let query = supabase
        .from('problem_cases')
        .select('*')
        .order('created_at', { ascending: false });

      if (farmerId) {
        query = query.eq('farmer_id', farmerId);
      }

      const { data, error } = await query;

      if (error || !data) {
        return [];
      }

      return data.map((row: any) => ({
        id: row.id,
        farmerId: row.farmer_id,
        farmId: row.farm_id,
        category: row.category as ProblemCategory,
        title: row.title,
        description: row.description,
        status: row.status,
        confidenceScore: Number(row.confidence_score),
        aiRecommendation: row.ai_recommendation,
        expertNotes: row.expert_notes,
        createdAt: row.created_at,
        resolvedAt: row.resolved_at,
      }));
    } catch (err) {
      console.warn('[SupabaseService] getProblemCases error:', err);
      return [];
    }
  },

  /**
   * Submit a new problem case to Supabase
   */
  async createProblemCase(problem: {
    id?: string;
    farmerId: string;
    farmId: string;
    category: string;
    title: string;
    description: string;
    status: string;
    confidenceScore?: number;
    aiRecommendation?: string;
  }): Promise<ProblemCase | null> {
    if (!isSupabaseConfigured) return null;

    try {
      const caseId = problem.id || `case_${Date.now()}`;
      const payload = {
        id: caseId,
        farmer_id: problem.farmerId,
        farm_id: problem.farmId,
        category: problem.category,
        title: problem.title,
        description: problem.description,
        status: problem.status,
        confidence_score: problem.confidenceScore,
        ai_recommendation: problem.aiRecommendation,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('problem_cases')
        .insert(payload)
        .select()
        .single();

      if (error || !data) {
        console.warn('[SupabaseService] createProblemCase error:', error);
        return null;
      }

      return {
        id: data.id,
        farmerId: data.farmer_id,
        farmId: data.farm_id,
        category: data.category as ProblemCategory,
        title: data.title,
        description: data.description,
        status: data.status,
        confidenceScore: Number(data.confidence_score),
        aiRecommendation: data.ai_recommendation,
        expertNotes: data.expert_notes,
        createdAt: data.created_at,
      };
    } catch (err) {
      console.warn('[SupabaseService] createProblemCase failed:', err);
      return null;
    }
  },

  /**
   * Resolve an expert problem case in Supabase
   */
  async resolveProblemCase(id: string, expertNotes: string): Promise<boolean> {
    if (!isSupabaseConfigured) return false;

    try {
      const { error } = await supabase
        .from('problem_cases')
        .update({
          status: 'resolved',
          expert_notes: expertNotes,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', id);

      return !error;
    } catch (err) {
      console.warn('[SupabaseService] resolveProblemCase error:', err);
      return false;
    }
  },

  /**
   * Fetch regional alerts from Supabase
   */
  async getAlerts(district: string = 'Nagpur'): Promise<AlertItem[]> {
    if (!isSupabaseConfigured) return [];

    try {
      let query = supabase
        .from('alerts')
        .select('*')
        .order('timestamp', { ascending: false });

      if (district) {
        query = query.ilike('district', `%${district}%`);
      }

      const { data, error } = await query;

      if (error || !data) {
        return [];
      }

      return data.map((row: any) => ({
        id: row.id,
        category: row.category as 'weather' | 'crop' | 'soil',
        title: row.title,
        description: row.description,
        timestamp: row.timestamp || 'Just now',
        severity: (row.severity === 'low' ? 'info' : row.severity) as 'high' | 'medium' | 'info',
        actionableText: row.actionable_text,
      }));
    } catch (err) {
      console.warn('[SupabaseService] getAlerts error:', err);
      return [];
    }
  },

  /**
   * Subscribe to real-time updates on problem cases (WebSocket)
   */
  subscribeToProblemCases(callback: (updatedCase: ProblemCase) => void): () => void {
    if (!isSupabaseConfigured) return () => {};

    try {
      const channel = supabase
        .channel('krishvya-realtime-problem-cases')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'problem_cases' },
          (payload) => {
            const row: any = payload.new;
            if (row && row.id) {
              callback({
                id: row.id,
                farmerId: row.farmer_id,
                farmId: row.farm_id,
                category: row.category as ProblemCategory,
                title: row.title,
                description: row.description,
                status: row.status,
                confidenceScore: Number(row.confidence_score),
                aiRecommendation: row.ai_recommendation,
                expertNotes: row.expert_notes,
                createdAt: row.created_at,
                resolvedAt: row.resolved_at,
              });
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (err) {
      console.warn('[SupabaseService] Problem cases subscription error:', err);
      return () => {};
    }
  },

  /**
   * Fetch the latest weather record for a farm from Supabase
   */
  async getWeatherData(farmId?: string): Promise<any | null> {
    if (!isSupabaseConfigured) return null;

    try {
      let query = supabase
        .from('weather_data')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1);

      if (farmId) {
        query = query.eq('farm_id', farmId);
      }

      const { data, error } = await query;

      if (error || !data || data.length === 0) {
        return null;
      }

      return data[0];
    } catch (err) {
      console.warn('[SupabaseService] getWeatherData error:', err);
      return null;
    }
  },

  /**
   * Upsert live weather data into Supabase weather_data table
   * Gracefully falls back to baseline schema if extended columns are not yet migrated
   */
  async upsertWeatherData(farmId: string, weather: any): Promise<boolean> {
    if (!isSupabaseConfigured) return false;

    try {
      const updatedAt = new Date().toISOString();
      const extendedPayload: Record<string, any> = {
        farm_id: farmId,
        temperature: weather.temperature,
        apparent_temperature: weather.apparentTemperature,
        condition: weather.condition,
        condition_icon: weather.icon || 'cloud-sun',
        rain_probability: weather.rainProbability24h ?? weather.rainProbability ?? 60,
        humidity: weather.humidity,
        wind_speed_kmh: weather.windSpeedKmh,
        soil_moisture: weather.soilMoisturePercentage,
        advice: weather.advice,
        pump_action: weather.pumpRecommendation?.action,
        pump_savings_water: weather.pumpRecommendation?.estimatedSavingsWaterLiters,
        pump_savings_inr: weather.pumpRecommendation?.estimatedSavingsMoneyInr,
        hazards: weather.hazards,
        hourly_spray: weather.hourlySprayForecast,
        forecast_7days: weather.forecast7Days,
        updated_at: updatedAt,
      };

      // 1. Try upserting full extended payload
      const { error: extError } = await supabase
        .from('weather_data')
        .upsert(extendedPayload, { onConflict: 'farm_id' });

      if (!extError) {
        return true;
      }

      // 2. If extended columns fail (e.g. schema not yet migrated), fallback to baseline columns
      console.info('[SupabaseService] Falling back to baseline weather_data schema columns');
      const baselinePayload = {
        farm_id: farmId,
        temperature: weather.temperature,
        condition: weather.condition,
        condition_icon: weather.icon || 'cloud-sun',
        rain_probability: weather.rainProbability24h ?? weather.rainProbability ?? 60,
        humidity: weather.humidity,
        wind_speed_kmh: weather.windSpeedKmh,
        advice: weather.advice,
        updated_at: updatedAt,
      };

      const { error: baseError } = await supabase
        .from('weather_data')
        .upsert(baselinePayload, { onConflict: 'farm_id' });

      if (baseError) {
        console.warn('[SupabaseService] upsertWeatherData baseline error:', baseError);
        return false;
      }

      return true;
    } catch (err) {
      console.warn('[SupabaseService] upsertWeatherData failed:', err);
      return false;
    }
  },

  /**
   * Subscribe to real-time weather changes via Supabase WebSockets
   */
  subscribeToWeatherData(farmId: string, callback: (weatherRow: any) => void): () => void {
    if (!isSupabaseConfigured) return () => {};

    try {
      const channel = supabase
        .channel(`krishvya-realtime-weather-${farmId || 'default'}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'weather_data' },
          (payload) => {
            const row: any = payload.new;
            if (row && (!farmId || row.farm_id === farmId)) {
              callback(row);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (err) {
      console.warn('[SupabaseService] Weather realtime subscription error:', err);
      return () => {};
    }
  },

  /**
   * Record extreme agricultural weather hazards to Supabase alerts table
   */
  async syncWeatherHazardAlert(hazard: any, district: string = 'Nagpur'): Promise<boolean> {
    if (!isSupabaseConfigured || !hazard || hazard.type === 'optimal') return false;

    try {
      const alertId = `hazard_${hazard.type}_${Date.now()}`;
      const { error } = await supabase.from('alerts').insert({
        id: alertId,
        district,
        category: 'weather',
        title: hazard.title,
        description: hazard.description,
        severity: hazard.severity === 'critical' ? 'high' : hazard.severity || 'medium',
        actionable_text: hazard.action,
        timestamp: new Date().toISOString(),
      });

      return !error;
    } catch (err) {
      console.warn('[SupabaseService] syncWeatherHazardAlert error:', err);
      return false;
    }
  },

  /**
   * Fetch saved daily AI recommendations from Supabase
   */
  async getDailyRecommendations(farmId: string): Promise<any[]> {
    if (!isSupabaseConfigured) return [];
    try {
      const { data, error } = await supabase
        .from('ai_recommendations')
        .select('*')
        .eq('farm_id', farmId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error || !data) return [];
      return data;
    } catch (err) {
      console.warn('[SupabaseService] getDailyRecommendations error:', err);
      return [];
    }
  },

  /**
   * Upsert or save new daily AI recommendations to Supabase
   */
  async saveDailyRecommendations(farmId: string, cards: any[]): Promise<boolean> {
    if (!isSupabaseConfigured || !cards || cards.length === 0) return false;
    try {
      const rows = cards.map((c) => ({
        id: c.id || `rec_${c.category}_${Date.now()}`,
        farm_id: farmId,
        category: c.category,
        title: c.title,
        summary: c.summary,
        detailed_action: c.detailedAction || c.detailed_action,
        urgency: c.urgency || 'optimal',
        confidence_score: c.confidenceScore || c.confidence_score || 90,
        feedback_rating: c.feedbackRating || c.feedback_rating || null,
        created_at: new Date().toISOString(),
      }));

      const { error } = await supabase.from('ai_recommendations').upsert(rows);
      return !error;
    } catch (err) {
      console.warn('[SupabaseService] saveDailyRecommendations error:', err);
      return false;
    }
  },

  /**
   * Update feedback rating (positive / negative) on a recommendation card
   */
  async submitRecommendationFeedback(recommendationId: string, rating: 'positive' | 'negative'): Promise<boolean> {
    if (!isSupabaseConfigured) return false;
    try {
      const { error } = await supabase
        .from('ai_recommendations')
        .update({ feedback_rating: rating })
        .eq('id', recommendationId);

      return !error;
    } catch (err) {
      console.warn('[SupabaseService] submitRecommendationFeedback error:', err);
      return false;
    }
  },

  /**
   * Fetch recent farm memories / problem interactions from Supabase
   */
  async getFarmMemories(farmId: string): Promise<any[]> {
    if (!isSupabaseConfigured) return [];
    try {
      const { data, error } = await supabase
        .from('ai_chat_memories')
        .select('*')
        .eq('farm_id', farmId)
        .order('created_at', { ascending: false })
        .limit(15);

      if (error || !data) return [];
      return data;
    } catch (err) {
      console.warn('[SupabaseService] getFarmMemories error:', err);
      return [];
    }
  },

  /**
   * Save a conversational memory turn to Supabase
   */
  async saveFarmMemory(farmId: string, query: string, reply: string, context?: any, topic?: string): Promise<boolean> {
    if (!isSupabaseConfigured) return false;
    try {
      const { error } = await supabase.from('ai_chat_memories').insert({
        id: `mem_${Date.now()}`,
        farm_id: farmId,
        user_query: query,
        ai_response: reply,
        context_snapshot: context || null,
        topic: topic || 'General Advisory',
        created_at: new Date().toISOString(),
      });

      return !error;
    } catch (err) {
      console.warn('[SupabaseService] saveFarmMemory error:', err);
      return false;
    }
  },

  /**
   * Update feedback on a chat response memory
   */
  async submitMemoryFeedback(memoryId: string, feedback: 'positive' | 'negative'): Promise<boolean> {
    if (!isSupabaseConfigured) return false;
    try {
      const { error } = await supabase
        .from('ai_chat_memories')
        .update({ feedback })
        .eq('id', memoryId);

      return !error;
    } catch (err) {
      console.warn('[SupabaseService] submitMemoryFeedback error:', err);
      return false;
    }
  },

  /**
   * Save a crop disease scan to Supabase with automatic user/farm isolation & offline caching
   */
  async saveDiseaseScan(scan: DiseaseScan): Promise<boolean> {
    const cacheKey = `krishvya_disease_scans_${scan.userId}_${scan.farmId}`;
    try {
      // 1. Update local cache immediately for zero-latency UI
      const localSaved = localStorage.getItem(cacheKey);
      let localList: DiseaseScan[] = localSaved ? JSON.parse(localSaved) : [];
      localList = [scan, ...localList.filter((s) => s.id !== scan.id)].slice(0, 30);
      localStorage.setItem(cacheKey, JSON.stringify(localList));

      if (!isSupabaseConfigured) return true;

      // 2. Persist to Supabase disease_scans table
      const row = {
        id: scan.id,
        user_id: scan.userId,
        farm_id: scan.farmId,
        image_url: scan.imageUrl,
        crop: scan.crop,
        detected_problem: scan.detectedProblem,
        scientific_name: scan.scientificName || null,
        severity: scan.severity,
        confidence: scan.confidence,
        symptoms: scan.symptoms,
        action_steps: scan.actionSteps,
        causes: scan.causes || [],
        recommendation: scan.recommendation || scan.actionSteps.join('. '),
        organic_treatment: scan.organicTreatment || null,
        chemical_treatment: scan.chemicalTreatment || null,
        preventative_measures: scan.preventativeMeasures || [],
        precautions: scan.precautions || null,
        is_uncertain: Boolean(scan.isUncertain),
        created_at: scan.createdAt || new Date().toISOString(),
      };

      const { error } = await supabase.from('disease_scans').upsert(row);
      if (error) {
        console.warn('[SupabaseService] saveDiseaseScan error, cached locally:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.warn('[SupabaseService] saveDiseaseScan failed:', err);
      return false;
    }
  },

  /**
   * Fetch historical disease scans strictly isolated by user ID and farm ID
   */
  async getDiseaseScans(userId: string, farmId: string): Promise<DiseaseScan[]> {
    const cacheKey = `krishvya_disease_scans_${userId}_${farmId}`;
    let cachedList: DiseaseScan[] = [];
    try {
      const saved = localStorage.getItem(cacheKey);
      if (saved) {
        cachedList = JSON.parse(saved);
      }
    } catch {}

    if (!isSupabaseConfigured || !userId || !farmId) {
      return cachedList;
    }

    try {
      const { data, error } = await supabase
        .from('disease_scans')
        .select('*')
        .eq('user_id', userId)
        .eq('farm_id', farmId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error || !data || data.length === 0) {
        return cachedList;
      }

      const mapped: DiseaseScan[] = data.map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        farmId: row.farm_id,
        imageUrl: row.image_url,
        crop: row.crop,
        detectedProblem: row.detected_problem,
        scientificName: row.scientific_name,
        severity: row.severity,
        confidence: Number(row.confidence),
        symptoms: Array.isArray(row.symptoms) ? row.symptoms : [],
        actionSteps: Array.isArray(row.action_steps) ? row.action_steps : [],
        causes: Array.isArray(row.causes) ? row.causes : [],
        recommendation: row.recommendation,
        organicTreatment: row.organic_treatment,
        chemicalTreatment: row.chemical_treatment,
        preventativeMeasures: Array.isArray(row.preventative_measures) ? row.preventative_measures : [],
        precautions: row.precautions,
        isUncertain: Boolean(row.is_uncertain),
        createdAt: row.created_at,
      }));

      // Refresh local cache with latest confirmed Supabase records
      try {
        localStorage.setItem(cacheKey, JSON.stringify(mapped));
      } catch {}

      return mapped;
    } catch (err) {
      console.warn('[SupabaseService] getDiseaseScans error:', err);
      return cachedList;
    }
  },

  /**
   * Delete a scan from Supabase and local cache
   */
  async deleteDiseaseScan(scanId: string, userId?: string, farmId?: string): Promise<boolean> {
    if (userId && farmId) {
      const cacheKey = `krishvya_disease_scans_${userId}_${farmId}`;
      try {
        const saved = localStorage.getItem(cacheKey);
        if (saved) {
          const list: DiseaseScan[] = JSON.parse(saved);
          localStorage.setItem(cacheKey, JSON.stringify(list.filter((s) => s.id !== scanId)));
        }
      } catch {}
    }

    if (!isSupabaseConfigured) return true;

    try {
      const { error } = await supabase.from('disease_scans').delete().eq('id', scanId);
      return !error;
    } catch (err) {
      console.warn('[SupabaseService] deleteDiseaseScan error:', err);
      return false;
    }
  },
};

