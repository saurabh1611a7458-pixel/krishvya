import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';
import { Farm, FarmerProfile, ProblemCase, ProblemCategory } from '../types';
import { api } from '../services/api';
import { supabaseService } from '../services/supabaseService';


export const EMPTY_FARMER: FarmerProfile = {
  id: '',
  name: '',
  phone: '',
  email: '',
  role: 'farmer',
  preferredLanguage: 'english',
  district: '',
  state: '',
  village: '',
  totalLandAcres: 0,
  experienceYears: 0,
  voiceAssistantEnabled: true,
  smsNotifications: true,
  createdAt: '',
};

export const EMPTY_FARM: Farm = {
  id: '',
  name: '',
  ownerId: '',
  location: {
    address: '',
    district: '',
    state: '',
    latitude: 0,
    longitude: 0,
  },
  size: 0,
  sizeUnit: 'acres',
  farmHealthScore: 0,
  irrigationType: '' as any,
  crop: {
    id: '',
    name: '',
    variety: '',
    stage: '' as any,
    sowingDate: '',
  },
  soil: {
    healthScore: 0,
    nitrogen: 'Medium',
    phosphorus: 'Medium',
    potassium: 'Medium',
    ph: 7.0,
    organicCarbon: 'Medium',
    moisturePercentage: 0,
    soilType: '',
  },
  weather: {
    temperature: 0,
    condition: '',
    conditionIcon: '',
    rainProbability: 0,
    humidity: 0,
    windSpeedKmh: 0,
    advice: '',
    forecast7Days: [],
  },
  satellite: {
    healthScore: 0,
    ndvi: 0,
    lastUpdated: '',
    stressDetected: false,
  },
  farm_id: '',
  user_id: '',
  clerk_user_id: '',
  farm_name: '',
  location_address: '',
  latitude: 0,
  longitude: 0,
  boundary: [],
  field_area: 0,
  crop_variety: '',
  crop_stage: '',
  soil_type: '',
  irrigation_type: '',
  sowing_date: '',
  created_at: '',
  updated_at: '',
};

interface FarmContextType {
  user: FarmerProfile;
  farm: Farm;
  farms: Farm[];
  selectedFarmId: string;
  selectFarm: (farmId: string) => void;
  createFarm: (farmData: Partial<Farm>) => Promise<Farm>;
  deleteFarm: (farmId: string) => Promise<void>;
  activeUserKey: 'clerk';
  isAuthenticated: boolean;
  isLoading: boolean;
  isNewUser: boolean;
  setIsNewUser: (isNew: boolean) => void;
  isSyncingAuth: boolean;
  problemCases: ProblemCase[];
  login: (emailOrPhone: string, password?: string) => Promise<{ success: boolean; message?: string }>;
  signup: (
    name: string,
    phone: string,
    email: string,
    role: 'farmer' | 'expert',
    password?: string
  ) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  updateFarm: (updatedFarm: Partial<Farm>) => Promise<void>;
  updateProfile: (updatedProfile: Partial<FarmerProfile>) => void;
  submitProblem: (category: ProblemCategory, description?: string) => ProblemCase;
  resolveProblem: (caseId: string, expertNotes: string) => Promise<void>;
  refreshData: () => Promise<void>;
  refreshSelectedFarm: () => Promise<void>;
}

const FarmContext = createContext<FarmContextType | undefined>(undefined);

export const FarmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const activeUserKey = 'clerk' as const;

  const { user: clerkUser, isLoaded: clerkLoaded, isSignedIn: clerkSignedIn } = useUser();
  const { signOut: clerkSignOut } = useClerk();

  const [isLoading, setIsLoading] = useState<boolean>(!clerkLoaded);
  const [isSyncingAuth, setIsSyncingAuth] = useState<boolean>(false);

  const [user, setUser] = useState<FarmerProfile>(EMPTY_FARMER);
  const [farms, setFarms] = useState<Farm[]>([]);

  const [isNewUser, setIsNewUser] = useState<boolean>(() => {
    return localStorage.getItem('krishvya_is_new_user') === 'true';
  });

  const [selectedFarmId, setSelectedFarmId] = useState<string>(() => {
    return localStorage.getItem('krishvya_selected_farm_id') || '';
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return Boolean(clerkSignedIn || localStorage.getItem('krishvya_auth') === 'true');
  });

  const [problemCases, setProblemCases] = useState<ProblemCase[]>([]);

  // Selected farm: strictly from user's actual farms, otherwise clean EMPTY_FARM (no fake demo values)
  const farm = farms.find((f) => f.id === selectedFarmId) || farms[0] || EMPTY_FARM;

  const prevClerkIdRef = useRef<string | null>(null);

  // Sync Clerk authenticated user with Supabase database when activeUserKey is 'clerk'
  useEffect(() => {
    if (activeUserKey !== 'clerk') return;
    if (!clerkLoaded) return;

    const currentClerkId = clerkSignedIn && clerkUser ? clerkUser.id : null;

    // Detect user change or logout immediately
    if (prevClerkIdRef.current !== currentClerkId) {
      console.log(`[FarmContext] Auth user transitioned from ${prevClerkIdRef.current} to ${currentClerkId}`);
      
      // Wipe state immediately so previous user's data NEVER flashes
      setFarms([]);
      setSelectedFarmId('');

      if (!currentClerkId) {
        setUser(EMPTY_FARMER);
        setIsAuthenticated(false);
        setIsNewUser(false);
        setIsSyncingAuth(false);
        setIsLoading(false);
      } else {
        // Initial setup for incoming Clerk user
        setUser({
          ...EMPTY_FARMER,
          id: currentClerkId,
          name: clerkUser?.fullName || clerkUser?.firstName || '',
          email: clerkUser?.primaryEmailAddress?.emailAddress || '',
          phone: clerkUser?.primaryPhoneNumber?.phoneNumber || '',
        });
      }
      prevClerkIdRef.current = currentClerkId;
    }

    if (clerkSignedIn && clerkUser) {
      let isMounted = true;
      setIsSyncingAuth(true);
      setIsLoading(true);

      const syncWithSupabase = async () => {
        try {
          api.setClerkUserId(clerkUser.id);

          // 1. Sync or create user profile in Supabase profiles table
          const syncedProfile = await supabaseService.syncProfileWithClerk(clerkUser);
          if (isMounted && syncedProfile) {
            setUser(syncedProfile);
          }

          // 2. Fetch authenticated user's farms from Supabase
          const userFarms = await supabaseService.getFarmsByOwner(clerkUser.id);
          if (isMounted) {
            // Strictly enforce isolation: only farms owned by this user
            const ownedFarms = (userFarms || []).filter((f) => f.ownerId === clerkUser.id);
            setFarms(ownedFarms);

            if (ownedFarms.length > 0) {
              const savedFarmId = localStorage.getItem('krishvya_selected_farm_id');
              const initialSelectedId =
                savedFarmId && ownedFarms.some((f) => f.id === savedFarmId)
                  ? savedFarmId
                  : ownedFarms[0].id;

              setSelectedFarmId(initialSelectedId);
              localStorage.setItem('krishvya_selected_farm_id', initialSelectedId);
              setIsNewUser(false);
              localStorage.setItem('krishvya_is_new_user', 'false');
            } else {
              setSelectedFarmId('');
              localStorage.removeItem('krishvya_selected_farm_id');
              setIsNewUser(true);
              localStorage.setItem('krishvya_is_new_user', 'true');
            }
            setIsAuthenticated(true);
          }
        } catch (err) {
          console.warn('[FarmContext] Clerk-Supabase sync error:', err);
        } finally {
          if (isMounted) {
            setIsSyncingAuth(false);
            setIsLoading(false);
          }
        }
      };

      syncWithSupabase();

      return () => {
        isMounted = false;
      };
    } else if (clerkLoaded && !clerkSignedIn && !api.getToken()) {
      setIsAuthenticated(false);
      setIsNewUser(false);
      setIsLoading(false);
    }
  }, [clerkLoaded, clerkSignedIn, clerkUser]);

  const selectFarm = (farmId: string) => {
    setSelectedFarmId(farmId);
    try {
      localStorage.setItem('krishvya_selected_farm_id', farmId);
    } catch {}
  };

  const refreshData = useCallback(async () => {
    try {
      const currentUserId = clerkUser?.id || user.id;

      if (!currentUserId) return;

      api.setClerkUserId(currentUserId);

      // 1. Fetch user farms
      const ownerFarms = await supabaseService.getFarmsByOwner(currentUserId);
      const owned = (ownerFarms || []).filter((f) => f.ownerId === currentUserId);
      setFarms(owned);

      if (owned.length > 0) {
        setIsNewUser(false);
        localStorage.setItem('krishvya_is_new_user', 'false');
        setSelectedFarmId((prev) =>
          owned.some((f) => f.id === prev) ? prev : owned[0].id
        );
      } else {
        setSelectedFarmId('');
        setIsNewUser(true);
        localStorage.setItem('krishvya_is_new_user', 'true');
      }

      // 2. Fetch problem cases
      const sbCases = await supabaseService.getProblemCases(currentUserId);
      if (sbCases && sbCases.length > 0) {
        setProblemCases(sbCases);
      }
    } catch (err) {
      console.warn('[KRISHVYA FarmProvider] Could not sync with live database:', err);
    }
  }, [user.id, clerkUser?.id]);

  const updateFarm = async (updatedFields: Partial<Farm>) => {
    if (!farm.id) return;

    const updated = {
      ...farm,
      ...updatedFields,
      location: {
        ...farm.location,
        ...(updatedFields.location || {}),
      },
      crop: {
        ...farm.crop,
        ...(updatedFields.crop || {}),
      },
      soil: {
        ...farm.soil,
        ...(updatedFields.soil || {}),
      },
      farm_name: updatedFields.name || updatedFields.farm_name || farm.name,
      location_address:
        updatedFields.location?.address ||
        updatedFields.location_address ||
        farm.location.address,
      latitude:
        typeof updatedFields.location?.latitude === 'number'
          ? updatedFields.location.latitude
          : (typeof updatedFields.latitude === 'number' ? updatedFields.latitude : farm.location.latitude),
      longitude:
        typeof updatedFields.location?.longitude === 'number'
          ? updatedFields.location.longitude
          : (typeof updatedFields.longitude === 'number' ? updatedFields.longitude : farm.location.longitude),
      field_area:
        updatedFields.size !== undefined
          ? Number(updatedFields.size)
          : (updatedFields.field_area !== undefined ? Number(updatedFields.field_area) : farm.size),
      crop_variety: updatedFields.crop?.variety || updatedFields.crop_variety || farm.crop.variety,
      crop_stage: updatedFields.crop?.stage || updatedFields.crop_stage || farm.crop.stage,
      soil_type: (updatedFields.soil as any)?.soilType || updatedFields.soil_type || farm.soil.soilType,
      irrigation_type: (updatedFields.irrigationType as any) || updatedFields.irrigation_type || farm.irrigationType,
      sowing_date: updatedFields.crop?.sowingDate || updatedFields.sowing_date || farm.crop.sowingDate,
      updated_at: new Date().toISOString(),
    };

    // 1. Supabase UPDATE first (as required by data flow contract)
    try {
      await supabaseService.upsertFarm(updated);
    } catch (err) {
      console.warn('[Supabase] Failed to persist farm update:', err);
    }

    // 2. Refresh selected farm from Supabase / API into FarmContext
    const ownerId = clerkUser?.id || user.id;
    if (ownerId) {
      try {
        const freshFarms = await supabaseService.getFarmsByOwner(ownerId);
        if (freshFarms && freshFarms.length > 0) {
          setFarms(freshFarms);
        } else {
          setFarms((prev) => prev.map((f) => (f.id === farm.id ? updated : f)));
        }
      } catch (refErr) {
        setFarms((prev) => prev.map((f) => (f.id === farm.id ? updated : f)));
      }
    } else {
      setFarms((prev) => prev.map((f) => (f.id === farm.id ? updated : f)));
    }
  };

  const createFarm = async (newFarmData: Partial<Farm> & Record<string, any>): Promise<Farm> => {
    const ownerId = clerkUser?.id || user.id;
    if (!ownerId) {
      throw new Error('Authentication required to create farm.');
    }
    const newId = newFarmData.id || `farm_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const farmName = newFarmData.name || newFarmData.farm_name || 'My Farm Parcel';
    const farmAddress =
      newFarmData.location?.address ||
      newFarmData.location_address ||
      newFarmData.address ||
      '';
    const farmSize = Number(newFarmData.size ?? newFarmData.field_area) || 0;
    const boundary = newFarmData.boundary || newFarmData.boundaryVertices || newFarmData.location?.boundaryVertices;
    const cropName = newFarmData.crop?.name || (typeof newFarmData.crop === 'string' ? newFarmData.crop : '');
    const cropVariety = newFarmData.crop?.variety || newFarmData.crop_variety || '';
    const cropStage = newFarmData.crop?.stage || newFarmData.crop_stage || '';
    const sowingDate = newFarmData.crop?.sowingDate || newFarmData.sowing_date || '';
    const soilType = (newFarmData.soil as any)?.soilType || newFarmData.soil_type || (newFarmData as any).soilType || '';
    const irrigationType = (newFarmData.irrigationType as any) || newFarmData.irrigation_type || '';

    const newFarm: Farm = {
      id: newId,
      name: farmName,
      ownerId: ownerId,
      location: {
        address: farmAddress,
        district: newFarmData.location?.district || newFarmData.district || user.district || '',
        state: newFarmData.location?.state || newFarmData.state || user.state || '',
        latitude: typeof newFarmData.location?.latitude === 'number'
          ? newFarmData.location.latitude
          : (typeof newFarmData.latitude === 'number' ? newFarmData.latitude : 0),
        longitude: typeof newFarmData.location?.longitude === 'number'
          ? newFarmData.location.longitude
          : (typeof newFarmData.longitude === 'number' ? newFarmData.longitude : 0),
        boundaryVertices: boundary,
      },
      size: farmSize,
      sizeUnit: newFarmData.sizeUnit || 'acres',
      farmHealthScore: Number(newFarmData.farmHealthScore) || 0,
      irrigationType: irrigationType as any,
      boundaryVertices: boundary,
      crop: {
        id: `crop_${Date.now()}`,
        name: cropName,
        variety: cropVariety,
        stage: cropStage as any,
        sowingDate: sowingDate,
      },
      soil: newFarmData.soil || {
        healthScore: 0,
        nitrogen: 'Medium',
        phosphorus: 'Medium',
        potassium: 'Medium',
        ph: 7.0,
        organicCarbon: 'Medium',
        moisturePercentage: 0,
        soilType: soilType,
      },
      weather: newFarmData.weather || {
        temperature: 0,
        condition: '',
        conditionIcon: '',
        rainProbability: 0,
        humidity: 0,
        windSpeedKmh: 0,
        advice: '',
        forecast7Days: [],
      },
      satellite: newFarmData.satellite || {
        healthScore: 0,
        ndvi: 0,
        lastUpdated: '',
        stressDetected: false,
      },
      // Canonical Supabase fields for direct access
      farm_id: newId,
      user_id: ownerId,
      clerk_user_id: ownerId,
      farm_name: farmName,
      location_address: farmAddress,
      latitude: typeof newFarmData.location?.latitude === 'number'
        ? newFarmData.location.latitude
        : (typeof newFarmData.latitude === 'number' ? newFarmData.latitude : 0),
      longitude: typeof newFarmData.location?.longitude === 'number'
        ? newFarmData.location.longitude
        : (typeof newFarmData.longitude === 'number' ? newFarmData.longitude : 0),
      boundary: boundary,
      field_area: farmSize,
      crop_variety: cropVariety,
      crop_stage: cropStage,
      soil_type: soilType,
      irrigation_type: irrigationType,
      sowing_date: sowingDate,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // 1. Supabase INSERT / UPSERT first
    try {
      await supabaseService.upsertFarm(newFarm);
    } catch (e) {
      console.warn('Failed to insert new farm into Supabase:', e);
    }

    // 2. Refresh farms and select the new farm in FarmContext
    try {
      const freshFarms = await supabaseService.getFarmsByOwner(ownerId);
      if (freshFarms && freshFarms.length > 0) {
        setFarms(freshFarms);
      } else {
        setFarms((prev) => [newFarm, ...prev.filter((f) => f.id !== newId)]);
      }
    } catch (e) {
      setFarms((prev) => [newFarm, ...prev.filter((f) => f.id !== newId)]);
    }

    setSelectedFarmId(newId);
    try {
      localStorage.setItem('krishvya_selected_farm_id', newId);
    } catch {}
    setIsNewUser(false);
    localStorage.setItem('krishvya_is_new_user', 'false');

    return newFarm;
  };

  const deleteFarm = async (farmId: string) => {
    const ownerId = clerkUser?.id || user.id;

    // 1. Immediately update UI state
    setFarms((prev) => {
      const filtered = prev.filter((f) => f.id !== farmId);
      if (selectedFarmId === farmId) {
        setSelectedFarmId(filtered.length > 0 ? filtered[0].id : '');
        if (filtered.length === 0) {
          setIsNewUser(true);
          localStorage.setItem('krishvya_is_new_user', 'true');
        }
      }
      return filtered;
    });

    // 2. Persist deletion to Supabase & backend
    try {
      await supabaseService.deleteFarm(farmId, ownerId);
    } catch (e) {
      console.warn('Failed to delete farm from Supabase:', e);
    }
  };

  const updateProfile = (updatedProfile: Partial<FarmerProfile>) => {
    setUser((prev) => ({
      ...prev,
      ...updatedProfile,
    }));
    const ownerId = clerkUser?.id || user.id;
    if (ownerId) {
      supabaseService.updateProfile(ownerId, updatedProfile).catch(console.warn);
    }
  };

  const login = async (emailOrPhone: string, password?: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await api.login(emailOrPhone, password);
      if (res.success) {
        if (res.user) {
          setUser((prev) => ({
            ...prev,
            id: res.user.id,
            name: res.user.name,
            phone: res.user.phone,
            email: res.user.email || prev.email,
            role: res.user.role || prev.role,
          }));
        }
        if (res.farm) {
          setFarms([res.farm]);
          setSelectedFarmId(res.farm.id);
        }
        setIsAuthenticated(true);
        return { success: true, message: res.message };
      } else {
        return {
          success: false,
          message: res.message || 'Invalid credentials. Please check your phone/email and password.',
        };
      }
    } catch (err: any) {
      console.error('[KRISHVYA Auth] Login error:', err);
      return {
        success: false,
        message: 'Could not connect to KRISHVYA database server. Please verify backend is running.',
      };
    }
  };

  const signup = async (
    name: string,
    phone: string,
    email: string,
    role: 'farmer' | 'expert',
    password?: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await api.signup({
        name,
        phone,
        email,
        role,
        password,
      });

      if (res.success) {
        const newUser: FarmerProfile = {
          ...EMPTY_FARMER,
          id: res.user?.id || `usr_${Date.now()}`,
          name,
          phone,
          email,
          role,
        };
        setUser(newUser);

        if (res.farm) {
          setFarms([res.farm]);
          setSelectedFarmId(res.farm.id);
        }
        setIsAuthenticated(true);
        return { success: true, message: res.message };
      } else {
        return {
          success: false,
          message: res.message || 'Failed to create account in database.',
        };
      }
    } catch (err: any) {
      console.error('[KRISHVYA Auth] Signup error:', err);
      return {
        success: false,
        message: 'Could not connect to KRISHVYA database server. Please verify backend is running.',
      };
    }
  };

  const logout = () => {
    api.removeToken();
    api.setClerkUserId(null);

    const currentId = clerkUser?.id || user.id;
    if (currentId) {
      try {
        localStorage.removeItem(`krishvya_profile_${currentId}`);
        localStorage.removeItem(`krishvya_farms_${currentId}`);
      } catch {}
    }
    localStorage.removeItem('krishvya_selected_farm_id');
    localStorage.removeItem('krishvya_auth');
    localStorage.removeItem('krishvya_user');
    localStorage.removeItem('krishvya_farms');
    setUser(EMPTY_FARMER);
    setFarms([]);
    setSelectedFarmId('');
    setProblemCases([]);
    setIsAuthenticated(false);
    setIsNewUser(false);
    setIsLoading(false);

    if (clerkSignedIn) {
      clerkSignOut().catch((err) => console.warn('Clerk signOut error:', err));
    }
  };

  const submitProblem = (category: ProblemCategory, description: string = ''): ProblemCase => {
    const isUrgent = category === 'disease_pest' || category === 'weather_damage';
    const confidence = isUrgent ? 74 : 88;

    const tempId = `case_${Date.now()}`;
    const newCase: ProblemCase = {
      id: tempId,
      farmerId: user.id,
      farmId: farm.id,
      category,
      title: `${category.replace(/_/g, ' ').toUpperCase()} Reported`,
      description: description || 'Reported from quick problem selector',
      status: confidence < 85 ? 'expert_review' : 'ai_analyzing',
      confidenceScore: confidence,
      aiRecommendation:
        confidence >= 85
          ? 'Automated advisory: Standard localized mitigation protocol issued based on soil and crop stage.'
          : 'Case escalated to Dr. Sunita Deshmukh for agronomist verification.',
      createdAt: new Date().toISOString(),
    };

    setProblemCases((prev) => [newCase, ...prev]);

    supabaseService.createProblemCase({
      id: tempId,
      farmerId: user.id,
      farmId: farm.id,
      category,
      title: newCase.title,
      description: newCase.description,
      status: newCase.status,
      confidenceScore: newCase.confidenceScore,
      aiRecommendation: newCase.aiRecommendation,
    }).then((sbRes) => {
      if (sbRes?.id && sbRes.id !== tempId) {
        setProblemCases((prev) =>
          prev.map((c) => (c.id === tempId ? { ...c, id: sbRes.id } : c))
        );
      }
    }).catch((err) => console.warn('[Supabase] Problem write delayed:', err));

    api.submitProblem(category, description).then((res) => {
      if (res.success && res.data?.id) {
        setProblemCases((prev) =>
          prev.map((c) => (c.id === tempId ? { ...c, id: res.data.id } : c))
        );
      }
    }).catch((err) => console.warn('Problem write to DB delayed:', err));

    return newCase;
  };

  const resolveProblem = async (caseId: string, expertNotes: string) => {
    setProblemCases((prev) =>
      prev.map((c) =>
        c.id === caseId
          ? {
              ...c,
              status: 'resolved' as const,
              expertNotes,
              resolvedAt: new Date().toISOString(),
            }
          : c
      )
    );

    supabaseService.resolveProblemCase(caseId, expertNotes).catch((err) =>
      console.warn('[Supabase] Resolve problem delayed:', err)
    );

    try {
      await api.resolveExpertCase(caseId, expertNotes);
    } catch (err) {
      console.warn('Resolve problem call delayed:', err);
    }
  };

  useEffect(() => {
    const unsubscribe = supabaseService.subscribeToProblemCases((updatedCase) => {
      setProblemCases((prev) => {
        const exists = prev.some((c) => c.id === updatedCase.id);
        if (exists) {
          return prev.map((c) => (c.id === updatedCase.id ? { ...c, ...updatedCase } : c));
        }
        return [updatedCase, ...prev];
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <FarmContext.Provider
      value={{
        user,
        farm,
        farms,
        selectedFarmId,
        selectFarm,
        createFarm,
        deleteFarm,
        activeUserKey,
        isAuthenticated,
        isLoading,
        isNewUser,
        setIsNewUser,
        isSyncingAuth,
        problemCases,
        login,
        signup,
        logout,
        updateFarm,
        updateProfile,
        submitProblem,
        resolveProblem,
        refreshData,
        refreshSelectedFarm: refreshData,
      }}
    >
      {children}
    </FarmContext.Provider>
  );
};

export const useFarm = () => {
  const context = useContext(FarmContext);
  if (!context) {
    throw new Error('useFarm must be used within a FarmProvider');
  }
  return context;
};
