import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Farm, ProblemCase, ProblemCategory } from '../types';
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
   * Fetch farm along with crop, soil, weather, and satellite data
   */
  async getFarm(ownerId?: string): Promise<Farm | null> {
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

      if (ownerId) {
        query = query.eq('owner_id', ownerId);
      }

      const { data, error } = await query;

      if (error || !data || data.length === 0) {
        return null;
      }

      const row = data[0];
      const cropRow = Array.isArray(row.crop) ? row.crop[0] : row.crop;
      const soilRow = Array.isArray(row.soil) ? row.soil[0] : row.soil;
      const weatherRow = Array.isArray(row.weather) ? row.weather[0] : row.weather;
      const satRow = Array.isArray(row.satellite) ? row.satellite[0] : row.satellite;

      return {
        id: row.id,
        name: row.name,
        ownerId: row.owner_id,
        location: {
          address: row.address,
          district: row.district,
          state: row.state,
          latitude: row.latitude,
          longitude: row.longitude,
        },
        size: Number(row.size),
        sizeUnit: row.size_unit as 'acres' | 'hectares',
        farmHealthScore: row.farm_health_score,
        irrigationType: row.irrigation_type,
        crop: {
          id: cropRow?.id || 'crop_01',
          name: cropRow?.name || 'Soybean',
          variety: cropRow?.variety || 'JS-335 Gold',
          stage: cropRow?.stage || 'Flowering',
          sowingDate: cropRow?.sowing_date || '2024-06-15',
          expectedHarvestDate: cropRow?.expected_harvest_date || '2024-10-20',
          imageUrl: cropRow?.image_url,
        },
        soil: {
          healthScore: soilRow?.health_score || 78,
          nitrogen: soilRow?.nitrogen || 'Good',
          phosphorus: soilRow?.phosphorus || 'Medium',
          potassium: soilRow?.potassium || 'Good',
          ph: Number(soilRow?.ph) || 6.7,
          organicCarbon: soilRow?.organic_carbon || 'Medium (0.6%)',
          moisturePercentage: Number(soilRow?.moisture_percentage) || 42.0,
          soilType: soilRow?.soil_type || 'Loamy Black Cotton',
          lastTestedDate: soilRow?.last_tested_date,
        },
        weather: {
          temperature: Number(weatherRow?.temperature) || 28.0,
          condition: weatherRow?.condition || 'Partly Cloudy',
          conditionIcon: weatherRow?.condition_icon || 'cloud-sun',
          rainProbability: Number(weatherRow?.rain_probability) || 60.0,
          humidity: Number(weatherRow?.humidity) || 72.0,
          windSpeedKmh: Number(weatherRow?.wind_speed_kmh) || 12.0,
          advice: weatherRow?.advice || 'Rain expected tomorrow. Delay irrigation today.',
          forecast7Days: [
            { day: 'Mon', temp: 28, icon: 'cloud-rain', rainProb: 65 },
            { day: 'Tue', temp: 29, icon: 'cloud-sun', rainProb: 30 },
            { day: 'Wed', temp: 29, icon: 'sun', rainProb: 15 },
            { day: 'Thu', temp: 30, icon: 'sun', rainProb: 10 },
            { day: 'Fri', temp: 29, icon: 'cloud-sun', rainProb: 20 },
            { day: 'Sat', temp: 28, icon: 'cloud-rain', rainProb: 50 },
            { day: 'Sun', temp: 29, icon: 'sun', rainProb: 25 },
          ],
        },
        satellite: {
          healthScore: satRow?.health_score || 82,
          ndvi: Number(satRow?.ndvi) || 0.78,
          lastUpdated: satRow?.last_updated || 'Yesterday at 4:30 PM',
          stressDetected: Boolean(satRow?.stress_detected),
          stressAreaDescription: satRow?.stress_area_description,
        },
      };
    } catch (err) {
      console.warn('[SupabaseService] getFarm error:', err);
      return null;
    }
  },

  /**
   * Save or update farm details in Supabase
   */
  async upsertFarm(farm: Farm): Promise<boolean> {
    if (!isSupabaseConfigured) return false;

    try {
      const { error } = await supabase.from('farms').upsert({
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
        updated_at: new Date().toISOString(),
      });

      if (error) {
        console.warn('[SupabaseService] upsertFarm error:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.warn('[SupabaseService] upsertFarm failed:', err);
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
      console.warn('[SupabaseService] Realtime subscription error:', err);
      return () => {};
    }
  },
};
