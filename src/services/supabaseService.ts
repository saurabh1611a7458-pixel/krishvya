import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Farm, ProblemCase, ProblemCategory, DiseaseScan, FarmerProfile } from '../types';
import { AlertItem } from '../data/mockData';
import { api } from './api';

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
   * Automatically create or update user profile in Supabase when Clerk auth succeeds
   */
  async syncProfileWithClerk(clerkUser: any): Promise<FarmerProfile | null> {
    if (!clerkUser || !clerkUser.id) return null;

    const clerkId = clerkUser.id;
    const fullName =
      clerkUser.fullName ||
      `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() ||
      'Farmer';
    const email =
      clerkUser.primaryEmailAddress?.emailAddress ||
      clerkUser.emailAddresses?.[0]?.emailAddress ||
      '';
    const phone =
      clerkUser.primaryPhoneNumber?.phoneNumber ||
      clerkUser.phoneNumbers?.[0]?.phoneNumber ||
      '';

    const cacheKey = `krishvya_profile_${clerkId}`;

    const fallbackProfile: FarmerProfile = {
      id: clerkId,
      name: fullName,
      phone: phone,
      email: email,
      role: 'farmer',
      preferredLanguage: 'english',
      district: '',
      state: '',
      village: '',
      totalLandAcres: 0,
      experienceYears: 0,
      voiceAssistantEnabled: true,
      smsNotifications: true,
      createdAt: new Date().toISOString(),
    };

    if (!isSupabaseConfigured) {
      localStorage.setItem(cacheKey, JSON.stringify(fallbackProfile));
      return fallbackProfile;
    }

    try {
      // 1. Check if profile exists by clerk_user_id or id
      const { data: existing, error: fetchErr } = await supabase
        .from('profiles')
        .select('*')
        .or(`clerk_user_id.eq.${clerkId},id.eq.${clerkId}`)
        .maybeSingle();

      const now = new Date().toISOString();

      if (!existing || fetchErr) {
        // Create new profile record in Supabase
        const newRecord: Record<string, any> = {
          id: clerkId,
          clerk_user_id: clerkId,
          full_name: fullName,
          name: fullName,
          email: email || null,
          phone: phone || null,
          role: 'farmer',
          preferred_language: 'english',
          village: '',
          district: '',
          state: '',
          total_land_acres: 0,
          created_at: now,
          updated_at: now,
        };

        const { data: inserted, error: insertErr } = await supabase
          .from('profiles')
          .upsert(newRecord, { onConflict: 'clerk_user_id' })
          .select()
          .maybeSingle();

        if (insertErr) {
          console.warn('[SupabaseService] Profile creation error (persisting locally):', insertErr);
        }

        const profileData = inserted || newRecord;
        const mapped = this.mapProfileRow(profileData, fallbackProfile);
        localStorage.setItem(cacheKey, JSON.stringify(mapped));
        return mapped;
      } else {
        // Profile exists - check if name, email, or clerk_user_id needs updating
        const needsUpdate =
          (fullName && fullName !== 'Farmer' && (existing.full_name !== fullName || existing.name !== fullName)) ||
          (email && existing.email !== email) ||
          (phone && existing.phone !== phone) ||
          !existing.clerk_user_id;

        if (needsUpdate) {
          const updatePayload: Record<string, any> = {
            clerk_user_id: clerkId,
            full_name: fullName || existing.full_name || existing.name,
            name: fullName || existing.name,
            updated_at: now,
          };
          if (email) updatePayload.email = email;
          if (phone) updatePayload.phone = phone;

          const { data: updated, error: updateErr } = await supabase
            .from('profiles')
            .update(updatePayload)
            .eq('id', existing.id)
            .select()
            .maybeSingle();

          if (!updateErr && updated) {
            const mapped = this.mapProfileRow(updated, fallbackProfile);
            localStorage.setItem(cacheKey, JSON.stringify(mapped));
            return mapped;
          }
        }

        const mapped = this.mapProfileRow(existing, fallbackProfile);
        localStorage.setItem(cacheKey, JSON.stringify(mapped));
        return mapped;
      }
    } catch (err) {
      console.warn('[SupabaseService] syncProfileWithClerk failed:', err);
      localStorage.setItem(cacheKey, JSON.stringify(fallbackProfile));
      return fallbackProfile;
    }
  },

  /**
   * Helper to map a profiles row into FarmerProfile
   */
  mapProfileRow(row: any, fallback: FarmerProfile): FarmerProfile {
    return {
      id: row.clerk_user_id || row.id || fallback.id,
      name: row.full_name || row.name || fallback.name,
      email: row.email || fallback.email,
      phone: row.phone || fallback.phone,
      role: (row.role as any) || fallback.role,
      preferredLanguage: (row.preferred_language as any) || fallback.preferredLanguage,
      village: row.village || fallback.village,
      district: row.district || fallback.district,
      state: row.state || fallback.state,
      pincode: row.pincode || fallback.pincode,
      totalLandAcres: Number(row.total_land_acres ?? fallback.totalLandAcres),
      experienceYears: Number(row.experience_years ?? fallback.experienceYears),
      voiceAssistantEnabled: Boolean(row.voice_assistant_enabled ?? fallback.voiceAssistantEnabled),
      smsNotifications: Boolean(row.sms_notifications ?? fallback.smsNotifications),
      createdAt: row.created_at || fallback.createdAt,
    };
  },

  /**
   * Fetch profile by Clerk user ID
   */
  async getProfileByClerkId(clerkUserId: string): Promise<FarmerProfile | null> {
    if (!clerkUserId) return null;
    const cacheKey = `krishvya_profile_${clerkUserId}`;

    if (!isSupabaseConfigured) {
      const cached = localStorage.getItem(cacheKey);
      return cached ? JSON.parse(cached) : null;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`clerk_user_id.eq.${clerkUserId},id.eq.${clerkUserId}`)
        .maybeSingle();

      if (error || !data) {
        const cached = localStorage.getItem(cacheKey);
        return cached ? JSON.parse(cached) : null;
      }

      const mapped = this.mapProfileRow(data, {
        id: clerkUserId,
        name: data.full_name || data.name || 'Farmer',
        phone: data.phone || '',
        email: data.email || '',
        role: 'farmer',
        preferredLanguage: 'english',
        district: data.district || '',
        state: data.state || '',
        village: data.village || '',
        totalLandAcres: Number(data.total_land_acres || 0),
        experienceYears: 0,
        voiceAssistantEnabled: true,
        smsNotifications: true,
        createdAt: data.created_at || new Date().toISOString(),
      });

      localStorage.setItem(cacheKey, JSON.stringify(mapped));
      return mapped;
    } catch (err) {
      console.warn('[SupabaseService] getProfileByClerkId error:', err);
      const cached = localStorage.getItem(cacheKey);
      return cached ? JSON.parse(cached) : null;
    }
  },

  /**
   * Update profile fields in Supabase
   */
  async updateProfile(clerkUserId: string, updates: Partial<FarmerProfile>): Promise<boolean> {
    if (!clerkUserId) return false;
    const cacheKey = `krishvya_profile_${clerkUserId}`;

    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        localStorage.setItem(cacheKey, JSON.stringify({ ...parsed, ...updates }));
      }

      if (!isSupabaseConfigured) return true;

      const payload: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };
      if (updates.name) {
        payload.name = updates.name;
        payload.full_name = updates.name;
      }
      if (updates.email) payload.email = updates.email;
      if (updates.phone) payload.phone = updates.phone;
      if (updates.village) payload.village = updates.village;
      if (updates.district) payload.district = updates.district;
      if (updates.state) payload.state = updates.state;
      if (updates.totalLandAcres !== undefined) payload.total_land_acres = updates.totalLandAcres;
      if (updates.preferredLanguage) payload.preferred_language = updates.preferredLanguage;

      const { error } = await supabase
        .from('profiles')
        .update(payload)
        .or(`clerk_user_id.eq.${clerkUserId},id.eq.${clerkUserId}`);

      return !error;
    } catch (err) {
      console.warn('[SupabaseService] updateProfile error:', err);
      return false;
    }
  },

  /**
   * Helper to map Supabase relational or flattened row into typed Farm
   */
  mapFarmRow(row: any): Farm {
    const cropRow = Array.isArray(row.crop) ? row.crop[0] : row.crop;
    const soilRow = Array.isArray(row.soil) ? row.soil[0] : row.soil;
    const weatherRow = Array.isArray(row.weather) ? row.weather[0] : row.weather;
    const satRow = Array.isArray(row.satellite) ? row.satellite[0] : row.satellite;

    const rawBoundary = row.boundary_vertices || row.boundary;
    const boundary =
      Array.isArray(rawBoundary) && rawBoundary.length >= 3 ? rawBoundary : undefined;

    const farmName = row.farm_name || row.name || 'My Farm';
    const farmAddress = row.location_address || row.address || '';
    const farmSize = Number(row.field_area ?? row.size) || 2.5;

    const cropName =
      typeof row.crop === 'string' && row.crop ? row.crop : cropRow?.name || '';
    const cropVariety = row.crop_variety || cropRow?.variety || '';
    const cropStage = row.crop_stage || cropRow?.stage || 'Flowering';
    const sowingDate = row.sowing_date || cropRow?.sowing_date || '';

    const soilType = row.soil_type || soilRow?.soil_type || 'Loamy Black Cotton';

    return {
      id: row.id,
      name: farmName,
      ownerId: row.clerk_user_id || row.owner_id,
      location: {
        address: farmAddress,
        district: row.district || '',
        state: row.state || '',
        latitude: typeof row.latitude === 'number' ? row.latitude : 0,
        longitude: typeof row.longitude === 'number' ? row.longitude : 0,
        boundaryVertices: boundary,
      },
      size: farmSize,
      sizeUnit: (row.size_unit as 'acres' | 'hectares') || 'acres',
      farmHealthScore: typeof row.farm_health_score === 'number' ? row.farm_health_score : 82,
      irrigationType: row.irrigation_type || 'Drip',
      boundaryVertices: boundary,
      crop: {
        id: cropRow?.id || `crop_${row.id}`,
        name: cropName,
        variety: cropVariety,
        stage: cropStage,
        sowingDate: sowingDate,
        expectedHarvestDate: cropRow?.expected_harvest_date || '',
        imageUrl: cropRow?.image_url,
      },
      soil: {
        healthScore: typeof soilRow?.health_score === 'number' ? soilRow.health_score : 78,
        nitrogen: soilRow?.nitrogen || 'Good',
        phosphorus: soilRow?.phosphorus || 'Medium',
        potassium: soilRow?.potassium || 'Good',
        ph: typeof soilRow?.ph === 'number' ? soilRow.ph : 6.8,
        organicCarbon: soilRow?.organic_carbon || 'Medium (0.6%)',
        moisturePercentage:
          typeof soilRow?.moisture_percentage === 'number'
            ? soilRow.moisture_percentage
            : 42.0,
        soilType: soilType,
        lastTestedDate: soilRow?.last_tested_date,
      },
      weather: {
        temperature:
          typeof weatherRow?.temperature === 'number' ? weatherRow.temperature : 28.0,
        condition: weatherRow?.condition || 'Partly Cloudy',
        conditionIcon: weatherRow?.condition_icon || 'cloud-sun',
        rainProbability:
          typeof weatherRow?.rain_probability === 'number'
            ? weatherRow.rain_probability
            : 45.0,
        humidity: typeof weatherRow?.humidity === 'number' ? weatherRow.humidity : 65.0,
        windSpeedKmh:
          typeof weatherRow?.wind_speed_kmh === 'number' ? weatherRow.wind_speed_kmh : 12.0,
        advice: weatherRow?.advice || 'Conditions are favorable for current crop stage.',
        forecast7Days: Array.isArray(weatherRow?.forecast_7days)
          ? weatherRow.forecast_7days
          : [],
      },
      satellite: {
        healthScore: typeof satRow?.health_score === 'number' ? satRow.health_score : 84,
        ndvi: typeof satRow?.ndvi === 'number' ? satRow.ndvi : 0.76,
        lastUpdated: satRow?.last_updated || '',
        stressDetected: Boolean(satRow?.stress_detected),
        stressAreaDescription: satRow?.stress_area_description,
      },
    };
  },

  /**
   * Fetch all farms owned by a specific authenticated user
   */
  async getFarmsByOwner(ownerIdOrClerkUserId: string): Promise<Farm[]> {
    if (!ownerIdOrClerkUserId) return [];

    const cacheKey = `krishvya_farms_${ownerIdOrClerkUserId}`;

    const getCachedFarms = (): Farm[] => {
      try {
        const cachedUser = localStorage.getItem(cacheKey);
        if (cachedUser) {
          const parsed = JSON.parse(cachedUser);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.filter((f: Farm) => f.ownerId === ownerIdOrClerkUserId);
          }
        }
      } catch {}
      return [];
    };

    let remoteFarms: Farm[] = [];

    // 1. Try Supabase query
    if (isSupabaseConfigured) {
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
          .or(`owner_id.eq.${ownerIdOrClerkUserId},clerk_user_id.eq.${ownerIdOrClerkUserId}`)
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data) && data.length > 0) {
          remoteFarms = data
            .map((row: any) => this.mapFarmRow(row))
            .filter((f: Farm) => f.ownerId === ownerIdOrClerkUserId);
        }
      } catch (err) {
        console.warn('[SupabaseService] getFarmsByOwner Supabase error:', err);
      }
    }

    // 2. If Supabase yielded no farms, check Backend API database
    if (remoteFarms.length === 0) {
      try {
        api.setClerkUserId(ownerIdOrClerkUserId);
        const apiRes = await api.getAllFarms();
        if (apiRes.success && Array.isArray(apiRes.data) && apiRes.data.length > 0) {
          remoteFarms = apiRes.data.filter((f: any) => f.ownerId === ownerIdOrClerkUserId);
        }
      } catch (apiErr) {
        console.warn('[SupabaseService] getFarmsByOwner API fallback error:', apiErr);
      }
    }

    if (remoteFarms.length > 0) {
      try {
        localStorage.setItem(cacheKey, JSON.stringify(remoteFarms));
      } catch {}
      return remoteFarms;
    }

    return getCachedFarms();
  },

  /**
   * Fetch farm along with crop, soil, weather, and satellite data
   */
  async getFarm(farmIdOrOwnerId?: string): Promise<Farm | null> {
    const getCached = (): Farm | null => {
      try {
        if (farmIdOrOwnerId) {
          const userCache = localStorage.getItem(`krishvya_farms_${farmIdOrOwnerId}`);
          if (userCache) {
            const list = JSON.parse(userCache);
            if (Array.isArray(list) && list.length > 0) return list[0];
          }
        }
        const saved = localStorage.getItem('krishvya_farms');
        if (saved) {
          const list = JSON.parse(saved);
          if (Array.isArray(list) && list.length > 0) {
            if (farmIdOrOwnerId) {
              const matched = list.find((f: Farm) => f.id === farmIdOrOwnerId || f.ownerId === farmIdOrOwnerId);
              if (matched) return matched;
            }
            return list[0];
          }
        }
      } catch {}
      return null;
    };

    if (!isSupabaseConfigured) return getCached();

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
        if (farmIdOrOwnerId.startsWith('farm_')) {
          query = query.eq('id', farmIdOrOwnerId);
        } else {
          query = query.or(
            `owner_id.eq.${farmIdOrOwnerId},clerk_user_id.eq.${farmIdOrOwnerId}`
          );
        }
      }

      const { data, error } = await query;

      if (error || !data || data.length === 0) {
        return getCached();
      }

      return this.mapFarmRow(data[0]);
    } catch (err) {
      console.warn('[SupabaseService] getFarm error:', err);
      return getCached();
    }
  },

  /**
   * Save or update farm details in Supabase (including crops and soil)
   */
  async upsertFarm(farm: Farm): Promise<boolean> {
    const ownerId = farm.ownerId;
    const cacheKey = `krishvya_farms_${ownerId}`;
    try {
      // Update user-scoped local storage cache immediately
      const cached = localStorage.getItem(cacheKey);
      let list: Farm[] = cached ? JSON.parse(cached) : [];
      list = [farm, ...list.filter((f) => f.id !== farm.id)];
      localStorage.setItem(cacheKey, JSON.stringify(list));
      localStorage.setItem('krishvya_selected_farm_id', farm.id);
    } catch {}

    // Always sync with backend API (with x-clerk-user-id header)
    try {
      if (ownerId) api.setClerkUserId(ownerId);
      await api.createFarm(farm).catch(() => api.updateFarm(farm));
    } catch (e) {
      console.warn('[SupabaseService] Backend API sync note:', e);
    }

    if (!isSupabaseConfigured) return true;

    try {
      const boundary = farm.boundaryVertices || farm.location?.boundaryVertices || [];
      const now = new Date().toISOString();

      const farmPayload = {
        id: farm.id,
        owner_id: farm.ownerId,
        clerk_user_id: farm.ownerId,
        name: farm.name,
        farm_name: farm.name,
        address: farm.location.address,
        location_address: farm.location.address,
        district: farm.location.district,
        state: farm.location.state,
        latitude: farm.location.latitude,
        longitude: farm.location.longitude,
        size: farm.size,
        field_area: farm.size,
        size_unit: farm.sizeUnit,
        crop: farm.crop?.name || '',
        crop_variety: farm.crop?.variety || '',
        crop_stage: farm.crop?.stage || '',
        soil_type: farm.soil?.soilType || '',
        irrigation_type: farm.irrigationType,
        sowing_date: farm.crop?.sowingDate || null,
        boundary: boundary,
        boundary_vertices: boundary,
        farm_health_score: farm.farmHealthScore,
        updated_at: now,
      };

      const { error: farmError } = await supabase.from('farms').upsert(farmPayload);

      if (farmError) {
        console.warn('[SupabaseService] upsertFarm error:', farmError);
        return false;
      }

      // Upsert Child Crop Row for relational compatibility
      if (farm.crop && farm.crop.name) {
        await supabase.from('crops').upsert(
          {
            farm_id: farm.id,
            name: farm.crop.name,
            variety: farm.crop.variety || '',
            stage: farm.crop.stage || '',
            sowing_date: farm.crop.sowingDate || null,
            expected_harvest_date: farm.crop.expectedHarvestDate || null,
          },
          { onConflict: 'farm_id' }
        );
      }

      // Upsert Child Soil Data Row for relational compatibility
      if (farm.soil && (farm.soil.soilType || farm.soil.healthScore)) {
        await supabase.from('soil_data').upsert(
          {
            farm_id: farm.id,
            soil_type: farm.soil.soilType || '',
            health_score: farm.soil.healthScore || 0,
            nitrogen: farm.soil.nitrogen || 'Good',
            phosphorus: farm.soil.phosphorus || 'Medium',
            potassium: farm.soil.potassium || 'Good',
            ph: farm.soil.ph || 6.8,
            organic_carbon: farm.soil.organicCarbon || '',
            moisture_percentage: farm.soil.moisturePercentage || 0,
            last_tested_date:
              farm.soil.lastTestedDate || new Date().toISOString().split('T')[0],
            updated_at: now,
          },
          { onConflict: 'farm_id' }
        );
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
  async deleteFarm(farmId: string, ownerId?: string): Promise<boolean> {
    if (ownerId) {
      const cacheKey = `krishvya_farms_${ownerId}`;
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const list: Farm[] = JSON.parse(cached);
          const filtered = list.filter((f) => f.id !== farmId);
          localStorage.setItem(cacheKey, JSON.stringify(filtered));
        }
      } catch {}
    }

    try {
      if (ownerId) api.setClerkUserId(ownerId);
      await api.deleteFarm(farmId);
    } catch (e) {
      console.warn('[SupabaseService] API delete note:', e);
    }

    if (!isSupabaseConfigured || !farmId) return true;
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
   * Get latest active AI conversation for an authenticated user
   */
  async getLatestConversation(userId: string, farmId?: string): Promise<{ id: string; user_id: string; farm_id?: string; title?: string; created_at: string } | null> {
    if (!userId) return null;
    const cacheKey = `krishvya_conv_${userId}`;

    // 1. Check local cache first
    let cachedConv: any = null;
    try {
      const raw = localStorage.getItem(cacheKey);
      if (raw) cachedConv = JSON.parse(raw);
    } catch {}

    if (!isSupabaseConfigured) {
      return cachedConv;
    }

    try {
      // Primary: farmer_ai_conversations
      let query = supabase
        .from('farmer_ai_conversations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (farmId) {
        query = query.eq('farm_id', farmId);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        const conv = data[0];
        try {
          localStorage.setItem(cacheKey, JSON.stringify(conv));
        } catch {}
        return conv;
      }

      // Secondary: ai_conversations
      const fallbackQuery = supabase
        .from('ai_conversations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);

      const fallbackRes = await fallbackQuery;
      if (!fallbackRes.error && fallbackRes.data && fallbackRes.data.length > 0) {
        return fallbackRes.data[0];
      }
    } catch (err) {
      console.warn('[SupabaseService] getLatestConversation query error:', err);
    }

    return cachedConv;
  },

  /**
   * Create a new AI conversation thread in Supabase (farmer_ai_conversations)
   */
  async createConversation(userId: string, farmId?: string, title: string = 'Farm Conversation'): Promise<{ id: string; user_id: string; farm_id?: string | null; title?: string; created_at: string }> {
    const newConv = {
      id: `conv_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      user_id: userId,
      farm_id: farmId || null,
      created_at: new Date().toISOString(),
    };

    const cacheKey = `krishvya_conv_${userId}`;
    try {
      localStorage.setItem(cacheKey, JSON.stringify({ ...newConv, title }));
    } catch {}

    if (isSupabaseConfigured) {
      try {
        await supabase.from('farmer_ai_conversations').insert(newConv);
      } catch (err) {
        // Fallback dual insert into ai_conversations
        try {
          await supabase.from('ai_conversations').insert({ ...newConv, title });
        } catch {}
      }
    }

    return { ...newConv, title };
  },

  /**
   * Fetch messages for a specific conversation (farmer_ai_messages)
   */
  async getConversationMessages(conversationId: string): Promise<Array<{ id: string; conversation_id: string; role: 'user' | 'model'; message: string; created_at: string }>> {
    if (!conversationId) return [];
    const cacheKey = `krishvya_msgs_${conversationId}`;

    const getCachedMsgs = (): any[] => {
      try {
        const raw = localStorage.getItem(cacheKey);
        if (raw) return JSON.parse(raw);
      } catch {}
      return [];
    };

    if (!isSupabaseConfigured) {
      return getCachedMsgs();
    }

    try {
      const { data, error } = await supabase
        .from('farmer_ai_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (!error && data && data.length > 0) {
        try {
          localStorage.setItem(cacheKey, JSON.stringify(data));
        } catch {}
        return data;
      }

      // Fallback to ai_messages
      const fallback = await supabase
        .from('ai_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (!fallback.error && fallback.data && fallback.data.length > 0) {
        return fallback.data as any;
      }
    } catch (err) {
      console.warn('[SupabaseService] getConversationMessages query error:', err);
    }

    return getCachedMsgs();
  },

  /**
   * Save a single chat message (turn) to Supabase (farmer_ai_messages)
   */
  async saveChatMessage(conversationId: string, role: 'user' | 'model', message: string, userId: string = 'farmer_user'): Promise<any> {
    const newMsg = {
      id: `msg_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      conversation_id: conversationId,
      user_id: userId,
      role,
      message,
      created_at: new Date().toISOString(),
    };

    const cacheKey = `krishvya_msgs_${conversationId}`;
    try {
      const raw = localStorage.getItem(cacheKey);
      const list = raw ? JSON.parse(raw) : [];
      list.push(newMsg);
      localStorage.setItem(cacheKey, JSON.stringify(list));
    } catch {}

    if (isSupabaseConfigured) {
      try {
        await supabase.from('farmer_ai_messages').insert(newMsg);
      } catch (err) {
        // Fallback to ai_messages
        try {
          await supabase.from('ai_messages').insert({
            id: newMsg.id,
            conversation_id: conversationId,
            role,
            message,
            created_at: newMsg.created_at,
          });
        } catch {}
      }
    }

    return newMsg;
  },

  /**
   * Search agriculture knowledge base (ICAR, data.gov.in, FAOSTAT, SoilGrids)
   */
  async searchAgricultureKnowledge(crop?: string, query?: string): Promise<any[]> {
    if (isSupabaseConfigured) {
      try {
        let req = supabase.from('agriculture_knowledge').select('*');
        if (crop) {
          req = req.or(`crop.ilike.%${crop}%,crop.eq.General`);
        }
        if (query) {
          req = req.or(`topic.ilike.%${query}%,question.ilike.%${query}%,answer.ilike.%${query}%`);
        }
        const { data, error } = await req.limit(10);
        if (!error && data && data.length > 0) {
          return data;
        }
      } catch (e) {
        console.warn('[SupabaseService] searchAgricultureKnowledge error:', e);
      }
    }

    // Default verified ICAR fallback dataset
    return [
      {
        id: 'ak_01',
        crop: crop || 'Soybean',
        category: 'irrigation',
        topic: 'Watering decision',
        answer: 'Avoid standing water. Irrigate only when top 5cm soil is dry.',
        source: 'ICAR-IISR',
      },
      {
        id: 'ak_02',
        crop: crop || 'Soybean',
        category: 'nutrition',
        topic: 'Yellow leaves remedies',
        answer: 'Check for nitrogen deficiency or iron chlorosis. Apply foliar zinc/iron or 19:19:19.',
        source: 'ICAR-IISR',
      },
    ];
  },

  /**
   * Retrieve crop diseases reference
   */
  async getCropDiseases(crop?: string): Promise<any[]> {
    if (isSupabaseConfigured && crop) {
      try {
        const { data, error } = await supabase
          .from('crop_diseases')
          .select('*')
          .ilike('crop', `%${crop}%`);
        if (!error && data && data.length > 0) return data;
      } catch {}
    }
    return [];
  },

  /**
   * Retrieve agronomic crop data
   */
  async getCropData(crop?: string): Promise<any | null> {
    if (isSupabaseConfigured && crop) {
      try {
        const { data, error } = await supabase
          .from('crop_data')
          .select('*')
          .ilike('crop', `%${crop}%`)
          .limit(1);
        if (!error && data && data.length > 0) return data[0];
      } catch {}
    }
    return null;
  },

  /**
   * Log an agricultural event to farm_events in Supabase
   */
  async logFarmEvent(userId: string, farmId: string, eventType: string, description: string): Promise<boolean> {
    const newEvent = {
      id: `evt_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      user_id: userId,
      farm_id: farmId,
      event_type: eventType,
      description,
      created_at: new Date().toISOString(),
    };

    const cacheKey = `krishvya_events_${userId}`;
    try {
      const raw = localStorage.getItem(cacheKey);
      const list = raw ? JSON.parse(raw) : [];
      list.unshift(newEvent);
      localStorage.setItem(cacheKey, JSON.stringify(list.slice(0, 50)));
    } catch {}

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('farm_events').insert(newEvent);
        return !error;
      } catch (err) {
        console.warn('[SupabaseService] logFarmEvent remote error:', err);
        return false;
      }
    }

    return true;
  },

  /**
   * Get farm events history
   */
  async getFarmEvents(userId: string, farmId?: string): Promise<any[]> {
    const cacheKey = `krishvya_events_${userId}`;
    const getCached = () => {
      try {
        const raw = localStorage.getItem(cacheKey);
        if (raw) return JSON.parse(raw);
      } catch {}
      return [];
    };

    if (!isSupabaseConfigured) return getCached();

    try {
      let query = supabase
        .from('farm_events')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (farmId) {
        query = query.eq('farm_id', farmId);
      }

      const { data, error } = await query;
      if (!error && data) {
        try {
          localStorage.setItem(cacheKey, JSON.stringify(data));
        } catch {}
        return data;
      }
    } catch (err) {
      console.warn('[SupabaseService] getFarmEvents error:', err);
    }

    return getCached();
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

