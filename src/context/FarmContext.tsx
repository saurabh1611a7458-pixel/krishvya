import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';
import { Farm, FarmerProfile, ProblemCase, ProblemCategory } from '../types';
import { api } from '../services/api';
import { supabaseService } from '../services/supabaseService';

const getPastDate = (daysAgo: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
};

export const DEMO_USERS: Record<'rajesh' | 'gurpreet', { user: FarmerProfile; farm: Farm }> = {
  rajesh: {
    user: {
      id: 'usr_rajesh_patel',
      name: 'Rajesh Patel',
      phone: '+91 98250 12345',
      email: 'rajesh.patel@krishvya.farm',
      role: 'farmer',
      preferredLanguage: 'english',
      district: 'Anand',
      state: 'Gujarat, India',
      village: 'Anand Rural',
      totalLandAcres: 4.2,
      experienceYears: 16,
      voiceAssistantEnabled: true,
      smsNotifications: true,
      createdAt: '2024-05-10T08:00:00Z',
    },
    farm: {
      id: 'farm_rajesh_01',
      name: 'Patel Cotton Acres',
      ownerId: 'usr_rajesh_patel',
      location: {
        address: 'Anand Rural, Gujarat',
        district: 'Anand',
        state: 'Gujarat, India',
        latitude: 22.5645,
        longitude: 72.9289,
        boundaryVertices: [
          [22.5635, 72.9275],
          [22.5658, 72.9270],
          [22.5662, 72.9305],
          [22.5638, 72.9308],
        ],
      },
      size: 4.2,
      sizeUnit: 'acres',
      farmHealthScore: 88,
      irrigationType: 'Drip',
      boundaryVertices: [
        [22.5635, 72.9275],
        [22.5658, 72.9270],
        [22.5662, 72.9305],
        [22.5638, 72.9308],
      ],
      crop: {
        id: 'crop_cotton_01',
        name: 'Cotton',
        variety: 'Bt-Cotton Rasi-659',
        stage: 'Flowering & Boll Setting',
        sowingDate: getPastDate(65),
        expectedHarvestDate: '',
      },
      soil: {
        healthScore: 84,
        nitrogen: 'Good',
        phosphorus: 'Medium',
        potassium: 'Good',
        ph: 7.2,
        organicCarbon: 'Medium (0.65%)',
        moisturePercentage: 38,
        soilType: 'Sandy Loam',
        lastTestedDate: '2024-06-20',
      },
      weather: {
        temperature: 31,
        condition: 'Sunny',
        conditionIcon: 'sun',
        rainProbability: 15,
        humidity: 58,
        windSpeedKmh: 14,
        advice: 'Good weather for inter-cultivation and micronutrient spray.',
        forecast7Days: [],
      },
      satellite: {
        healthScore: 86,
        ndvi: 0.81,
        lastUpdated: 'Today at 9:00 AM',
        stressDetected: false,
      },
    },
  },
  gurpreet: {
    user: {
      id: 'usr_gurpreet_singh',
      name: 'Gurpreet Singh',
      phone: '+91 98720 54321',
      email: 'gurpreet.singh@krishvya.farm',
      role: 'farmer',
      preferredLanguage: 'english',
      district: 'Bathinda',
      state: 'Punjab, India',
      village: 'Bathinda Canal Belt',
      totalLandAcres: 7.5,
      experienceYears: 22,
      voiceAssistantEnabled: true,
      smsNotifications: true,
      createdAt: '2024-04-15T08:00:00Z',
    },
    farm: {
      id: 'farm_gurpreet_01',
      name: 'Bathinda Green Field',
      ownerId: 'usr_gurpreet_singh',
      location: {
        address: 'Bathinda Canal Belt, Punjab',
        district: 'Bathinda',
        state: 'Punjab, India',
        latitude: 30.2110,
        longitude: 74.9455,
        boundaryVertices: [
          [30.2095, 74.9435],
          [30.2130, 74.9430],
          [30.2132, 74.9480],
          [30.2098, 74.9485],
        ],
      },
      size: 7.5,
      sizeUnit: 'acres',
      farmHealthScore: 92,
      irrigationType: 'Flood',
      boundaryVertices: [
        [30.2095, 74.9435],
        [30.2130, 74.9430],
        [30.2132, 74.9480],
        [30.2098, 74.9485],
      ],
      crop: {
        id: 'crop_wheat_01',
        name: 'Wheat',
        variety: 'PBW-550 Golden',
        stage: 'Tillering',
        sowingDate: getPastDate(30),
        expectedHarvestDate: '',
      },
      soil: {
        healthScore: 90,
        nitrogen: 'High',
        phosphorus: 'Good',
        potassium: 'Good',
        ph: 7.6,
        organicCarbon: 'High (0.82%)',
        moisturePercentage: 52,
        soilType: 'Alluvial Clay Loam',
        lastTestedDate: '2024-10-25',
      },
      weather: {
        temperature: 24,
        condition: 'Clear Sky',
        conditionIcon: 'sun',
        rainProbability: 10,
        humidity: 62,
        windSpeedKmh: 10,
        advice: 'Optimal soil moisture. No irrigation needed this week.',
        forecast7Days: [],
      },
      satellite: {
        healthScore: 91,
        ndvi: 0.85,
        lastUpdated: 'Yesterday at 3:00 PM',
        stressDetected: false,
      },
    },
  },
};

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
  irrigationType: 'Rainfed',
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
};

interface FarmContextType {
  user: FarmerProfile;
  farm: Farm;
  farms: Farm[];
  selectedFarmId: string;
  selectFarm: (farmId: string) => void;
  createFarm: (farmData: Partial<Farm>) => Promise<Farm>;
  deleteFarm: (farmId: string) => Promise<void>;
  switchTestUser: (userKey: 'clerk' | 'rajesh' | 'gurpreet') => void;
  activeUserKey: 'clerk' | 'rajesh' | 'gurpreet';
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
}

const FarmContext = createContext<FarmContextType | undefined>(undefined);

export const FarmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeUserKey, setActiveUserKey] = useState<'clerk' | 'rajesh' | 'gurpreet'>(() => {
    const saved = localStorage.getItem('krishvya_active_user_key');
    return (saved as any) || 'clerk';
  });

  const { user: clerkUser, isLoaded: clerkLoaded, isSignedIn: clerkSignedIn } = useUser();
  const { signOut: clerkSignOut } = useClerk();

  const [isLoading, setIsLoading] = useState<boolean>(!clerkLoaded);
  const [isSyncingAuth, setIsSyncingAuth] = useState<boolean>(false);

  const [user, setUser] = useState<FarmerProfile>(() => {
    const savedKey = localStorage.getItem('krishvya_active_user_key');
    if (savedKey === 'rajesh') return DEMO_USERS.rajesh.user;
    if (savedKey === 'gurpreet') return DEMO_USERS.gurpreet.user;
    return EMPTY_FARMER;
  });

  const [farms, setFarms] = useState<Farm[]>(() => {
    const savedKey = localStorage.getItem('krishvya_active_user_key');
    if (savedKey === 'rajesh') return [DEMO_USERS.rajesh.farm];
    if (savedKey === 'gurpreet') return [DEMO_USERS.gurpreet.farm];
    return [];
  });

  const [isNewUser, setIsNewUser] = useState<boolean>(() => {
    return localStorage.getItem('krishvya_is_new_user') === 'true';
  });

  const [selectedFarmId, setSelectedFarmId] = useState<string>(() => {
    const savedKey = localStorage.getItem('krishvya_active_user_key');
    if (savedKey === 'rajesh') return DEMO_USERS.rajesh.farm.id;
    if (savedKey === 'gurpreet') return DEMO_USERS.gurpreet.farm.id;
    return '';
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
          name: clerkUser?.fullName || clerkUser?.firstName || 'Farmer',
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
              setSelectedFarmId((prev) =>
                ownedFarms.some((f) => f.id === prev) ? prev : ownedFarms[0].id
              );
              setIsNewUser(false);
              localStorage.setItem('krishvya_is_new_user', 'false');
            } else {
              setSelectedFarmId('');
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
  }, [clerkLoaded, clerkSignedIn, clerkUser, activeUserKey]);

  // Persist activeUserKey
  useEffect(() => {
    localStorage.setItem('krishvya_active_user_key', activeUserKey);
  }, [activeUserKey]);

  // Switch between Test Users to demonstrate 100% data isolation
  const switchTestUser = useCallback(
    (userKey: 'clerk' | 'rajesh' | 'gurpreet') => {
      setActiveUserKey(userKey);
      if (userKey === 'rajesh') {
        setUser(DEMO_USERS.rajesh.user);
        setFarms([DEMO_USERS.rajesh.farm]);
        setSelectedFarmId(DEMO_USERS.rajesh.farm.id);
        setIsAuthenticated(true);
        setIsNewUser(false);
        setIsLoading(false);
      } else if (userKey === 'gurpreet') {
        setUser(DEMO_USERS.gurpreet.user);
        setFarms([DEMO_USERS.gurpreet.farm]);
        setSelectedFarmId(DEMO_USERS.gurpreet.farm.id);
        setIsAuthenticated(true);
        setIsNewUser(false);
        setIsLoading(false);
      } else {
        // Switch to Clerk
        setIsSyncingAuth(true);
        setIsLoading(true);
        if (clerkUser) {
          api.setClerkUserId(clerkUser.id);
          supabaseService.syncProfileWithClerk(clerkUser).then((synced) => {
            if (synced) setUser(synced);
          });
          supabaseService.getFarmsByOwner(clerkUser.id).then((loadedFarms) => {
            const owned = (loadedFarms || []).filter((f) => f.ownerId === clerkUser.id);
            setFarms(owned);
            if (owned.length > 0) {
              setSelectedFarmId(owned[0].id);
              setIsNewUser(false);
              localStorage.setItem('krishvya_is_new_user', 'false');
            } else {
              setSelectedFarmId('');
              setIsNewUser(true);
              localStorage.setItem('krishvya_is_new_user', 'true');
            }
            setIsSyncingAuth(false);
            setIsLoading(false);
          });
        } else {
          setUser(EMPTY_FARMER);
          setFarms([]);
          setSelectedFarmId('');
          setIsNewUser(false);
          setIsSyncingAuth(false);
          setIsLoading(false);
        }
        setIsAuthenticated(Boolean(clerkSignedIn || api.getToken()));
      }
    },
    [clerkUser, clerkSignedIn]
  );

  const selectFarm = (farmId: string) => {
    setSelectedFarmId(farmId);
  };

  const refreshData = useCallback(async () => {
    try {
      const currentUserId =
        activeUserKey === 'clerk' && clerkUser?.id ? clerkUser.id : user.id;

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
  }, [user.id, activeUserKey, clerkUser?.id]);

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
    };

    // 1. Optimistic UI update across all components immediately without refresh
    setFarms((prev) => prev.map((f) => (f.id === farm.id ? updated : f)));

    // 2. Persist to Supabase & backend
    try {
      await supabaseService.upsertFarm(updated);
    } catch (err) {
      console.warn('[Supabase] Failed to persist farm:', err);
    }
  };

  const createFarm = async (newFarmData: Partial<Farm> & Record<string, any>): Promise<Farm> => {
    const ownerId =
      activeUserKey === 'clerk' && clerkUser?.id ? clerkUser.id : user.id || `usr_${Date.now()}`;
    const newId = `farm_${Date.now()}`;

    const newFarm: Farm = {
      id: newId,
      name: newFarmData.name || 'New Farm Parcel',
      ownerId: ownerId,
      location: {
        address:
          newFarmData.location?.address ||
          newFarmData.address ||
          '',
        district: newFarmData.location?.district || newFarmData.district || user.district || '',
        state: newFarmData.location?.state || newFarmData.state || user.state || '',
        latitude: typeof newFarmData.location?.latitude === 'number'
          ? newFarmData.location.latitude
          : (typeof newFarmData.latitude === 'number' ? newFarmData.latitude : 0),
        longitude: typeof newFarmData.location?.longitude === 'number'
          ? newFarmData.location.longitude
          : (typeof newFarmData.longitude === 'number' ? newFarmData.longitude : 0),
        boundaryVertices: newFarmData.boundaryVertices || newFarmData.location?.boundaryVertices,
      },
      size: Number(newFarmData.size) || 1,
      sizeUnit: newFarmData.sizeUnit || 'acres',
      farmHealthScore: Number(newFarmData.farmHealthScore) || 82,
      irrigationType: (newFarmData.irrigationType as any) || 'Drip',
      boundaryVertices: newFarmData.boundaryVertices,
      crop: newFarmData.crop ? {
        id: `crop_${Date.now()}`,
        name: newFarmData.crop.name || '',
        variety: newFarmData.crop.variety || '',
        stage: newFarmData.crop.stage || 'Flowering',
        sowingDate: newFarmData.crop.sowingDate || new Date().toISOString().split('T')[0],
      } : {
        id: `crop_${Date.now()}`,
        name: '',
        variety: '',
        stage: '' as any,
        sowingDate: '',
      },
      soil: newFarmData.soil || {
        healthScore: 78,
        nitrogen: 'Good',
        phosphorus: 'Medium',
        potassium: 'Good',
        ph: 6.8,
        organicCarbon: 'Medium',
        moisturePercentage: 40,
        soilType: (newFarmData.soil as any)?.soilType || (newFarmData as any).soilType || 'Loamy',
      },
      weather: {
        temperature: 28,
        condition: 'Partly Cloudy',
        conditionIcon: 'cloud-sun',
        rainProbability: 20,
        humidity: 60,
        windSpeedKmh: 10,
        advice: 'Conditions are favorable for farm operations.',
        forecast7Days: [],
      },
      satellite: {
        healthScore: 84,
        ndvi: 0.78,
        lastUpdated: 'Live telemetry active',
        stressDetected: false,
      },
    };

    // 1. Immediately update UI state without requiring page reload
    setFarms((prev) => [newFarm, ...prev.filter((f) => f.id !== newId)]);
    setSelectedFarmId(newId);
    setIsNewUser(false);
    localStorage.setItem('krishvya_is_new_user', 'false');

    // 2. Persist to Supabase & backend
    try {
      await supabaseService.upsertFarm(newFarm);
    } catch (e) {
      console.warn('Failed to insert new farm into Supabase:', e);
    }

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
    localStorage.removeItem('krishvya_is_new_user');

    setUser(EMPTY_FARMER);
    setFarms([]);
    setSelectedFarmId('');
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
        switchTestUser,
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
