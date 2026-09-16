import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';
import { Farm, FarmerProfile, ProblemCase, ProblemCategory } from '../types';
import { MOCK_FARMER, FARM_A_PUNE, FARM_B_NAGPUR } from '../data/mockData';
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

  const [user, setUser] = useState<FarmerProfile>(() => {
    const savedKey = localStorage.getItem('krishvya_active_user_key');
    if (savedKey === 'rajesh') return DEMO_USERS.rajesh.user;
    if (savedKey === 'gurpreet') return DEMO_USERS.gurpreet.user;
    const saved = localStorage.getItem('krishvya_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.name !== 'Ramesh Singh' && parsed.village !== 'Saoner') {
          return parsed;
        }
      } catch {}
    }
    return MOCK_FARMER;
  });

  const [farms, setFarms] = useState<Farm[]>(() => {
    const savedKey = localStorage.getItem('krishvya_active_user_key');
    if (savedKey === 'rajesh') return [DEMO_USERS.rajesh.farm];
    if (savedKey === 'gurpreet') return [DEMO_USERS.gurpreet.farm];
    const saved = localStorage.getItem('krishvya_farms');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (
          Array.isArray(parsed) &&
          parsed.length > 0 &&
          !parsed.some((f: any) =>
            f.name === 'Ramesh Shwet Farm' ||
            f.id === 'farm_01' ||
            f.location?.address?.includes('Saoner') ||
            f.location?.latitude === 21.3855
          )
        ) {
          return parsed;
        }
      } catch {}
    }
    return [FARM_A_PUNE, FARM_B_NAGPUR];
  });

  const [selectedFarmId, setSelectedFarmId] = useState<string>(() => {
    const savedKey = localStorage.getItem('krishvya_active_user_key');
    if (savedKey === 'rajesh') return DEMO_USERS.rajesh.farm.id;
    if (savedKey === 'gurpreet') return DEMO_USERS.gurpreet.farm.id;
    const saved = localStorage.getItem('krishvya_selected_farm_id');
    if (saved && saved !== 'farm_01') return saved;
    return FARM_A_PUNE.id;
  });

  const farm = farms.find((f) => f.id === selectedFarmId) || farms[0] || FARM_A_PUNE;


  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('krishvya_auth') === 'true' || Boolean(api.getToken());
  });

  const [problemCases, setProblemCases] = useState<ProblemCase[]>(() => {
    const saved = localStorage.getItem('krishvya_cases');
    return saved ? JSON.parse(saved) : [];
  });

  const { user: clerkUser, isLoaded: clerkLoaded, isSignedIn: clerkSignedIn } = useUser();
  const { signOut: clerkSignOut } = useClerk();

  // Sync Clerk authenticated user with FarmContext when activeUserKey is 'clerk'
  useEffect(() => {
    if (activeUserKey !== 'clerk') return;

    if (clerkLoaded && clerkSignedIn && clerkUser) {
      setUser((prev) => ({
        ...prev,
        id: clerkUser.id,
        name: clerkUser.fullName || clerkUser.firstName || prev.name,
        email: clerkUser.primaryEmailAddress?.emailAddress || prev.email,
        phone: clerkUser.primaryPhoneNumber?.phoneNumber || prev.phone,
      }));
      setIsAuthenticated(true);
    } else if (clerkLoaded && !clerkSignedIn && !api.getToken()) {
      setIsAuthenticated(false);
    }
  }, [clerkLoaded, clerkSignedIn, clerkUser, activeUserKey]);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('krishvya_active_user_key', activeUserKey);
  }, [activeUserKey]);

  useEffect(() => {
    localStorage.setItem('krishvya_user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('krishvya_farms', JSON.stringify(farms));
  }, [farms]);

  useEffect(() => {
    localStorage.setItem('krishvya_selected_farm_id', selectedFarmId);
  }, [selectedFarmId]);

  useEffect(() => {
    localStorage.setItem('krishvya_auth', isAuthenticated ? 'true' : 'false');
  }, [isAuthenticated]);

  useEffect(() => {
    localStorage.setItem('krishvya_cases', JSON.stringify(problemCases));
  }, [problemCases]);

  // Switch between Test Users to demonstrate 100% data isolation
  const switchTestUser = useCallback(
    (userKey: 'clerk' | 'rajesh' | 'gurpreet') => {
      setActiveUserKey(userKey);
      if (userKey === 'rajesh') {
        setUser(DEMO_USERS.rajesh.user);
        setFarms([DEMO_USERS.rajesh.farm]);
        setSelectedFarmId(DEMO_USERS.rajesh.farm.id);
        setIsAuthenticated(true);
      } else if (userKey === 'gurpreet') {
        setUser(DEMO_USERS.gurpreet.user);
        setFarms([DEMO_USERS.gurpreet.farm]);
        setSelectedFarmId(DEMO_USERS.gurpreet.farm.id);
        setIsAuthenticated(true);
      } else {
        // Switch to Clerk
        if (clerkUser) {
          setUser({
            ...MOCK_FARMER,
            id: clerkUser.id,
            name: clerkUser.fullName || clerkUser.firstName || 'Farmer',
            email: clerkUser.primaryEmailAddress?.emailAddress || '',
            phone: clerkUser.primaryPhoneNumber?.phoneNumber || '',
          });
        } else {
          setUser(MOCK_FARMER);
        }
        setIsAuthenticated(Boolean(clerkSignedIn || api.getToken()));
        // Try to fetch clerk user's farms from Supabase
        const targetId = clerkUser?.id || user.id;
        supabaseService.getFarmsByOwner(targetId).then((loadedFarms) => {
          if (loadedFarms.length > 0) {
            setFarms(loadedFarms);
            setSelectedFarmId(loadedFarms[0].id);
          } else {
            setFarms([FARM_A_PUNE, FARM_B_NAGPUR]);
            setSelectedFarmId(FARM_A_PUNE.id);
          }
        });
      }
    },
    [clerkUser, clerkSignedIn, user.id]
  );

  const selectFarm = (farmId: string) => {
    setSelectedFarmId(farmId);
  };

  const refreshData = useCallback(async () => {
    try {
      // 1. Check current authenticated user if token present
      const token = api.getToken();
      if (token) {
        const meRes = await api.getMe();
        if (meRes.success && meRes.user) {
          setUser((prev) => ({
            ...prev,
            id: meRes.user.id,
            name: meRes.user.name,
            phone: meRes.user.phone,
            email: meRes.user.email || prev.email,
            role: meRes.user.role || prev.role,
            district: meRes.user.profile?.district || prev.district,
            state: meRes.user.profile?.state || prev.state,
            village: meRes.user.profile?.village || prev.village,
          }));
          setIsAuthenticated(true);
        }
      }

      // 2. Fetch all farms for the current user from Supabase Cloud Database
      const ownerFarms = await supabaseService.getFarmsByOwner(user.id);
      if (ownerFarms && ownerFarms.length > 0) {
        setFarms(ownerFarms);
        if (!ownerFarms.some((f) => f.id === selectedFarmId)) {
          setSelectedFarmId(ownerFarms[0].id);
        }
      } else {
        const singleFarm = await supabaseService.getFarm(user.id);
        if (singleFarm) {
          setFarms([singleFarm]);
          setSelectedFarmId(singleFarm.id);
        } else {
          const farmRes = await api.getFarm();
          if (farmRes.success && farmRes.data) {
            setFarms((prev) => {
              const exists = prev.some((f) => f.id === farmRes.data.id);
              return exists
                ? prev.map((f) => (f.id === farmRes.data.id ? { ...f, ...farmRes.data } : f))
                : [farmRes.data, ...prev];
            });
            setSelectedFarmId(farmRes.data.id);
          }
        }
      }

      // 3. Fetch problem cases from Supabase Cloud Database
      const sbCases = await supabaseService.getProblemCases(user.id);
      if (sbCases && sbCases.length > 0) {
        setProblemCases(sbCases);
      } else {
        const problemsRes = await api.getProblems();
        if (problemsRes.success && Array.isArray(problemsRes.data) && problemsRes.data.length > 0) {
          const mappedCases: ProblemCase[] = problemsRes.data.map((c: any) => ({
            id: c.id,
            farmerId: c.farmerId || user.id,
            farmId: c.farmId || c.farm_id || farm.id,
            category: (c.category as ProblemCategory) || 'other',
            title: c.title || 'Farm Issue Report',
            description: c.description || c.farmer_description || '',
            status: c.status || 'submitted',
            confidenceScore: c.confidenceScore || c.confidence_score,
            aiRecommendation: c.aiRecommendation,
            expertNotes: c.expertNotes || c.expert_notes,
            createdAt: c.createdAt || c.created_at || new Date().toISOString(),
            resolvedAt: c.resolvedAt,
          }));
          setProblemCases(mappedCases);
        }

      }
    } catch (err) {
      console.warn('[KRISHVYA FarmProvider] Could not sync with live database:', err);
    }
  }, [user.id, selectedFarmId, farm.id]);

  // Initial sync on startup
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const updateFarm = async (updatedFields: Partial<Farm>) => {
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

    // 1. Optimistic UI update across all components
    setFarms((prev) => prev.map((f) => (f.id === farm.id ? updated : f)));

    // 2. Persist to Supabase Cloud Database (Single Source of Truth)
    try {
      await supabaseService.upsertFarm(updated);
      // Immediately refetch the verified farm record from Supabase
      const freshFarm = await supabaseService.getFarm(updated.id);
      if (freshFarm) {
        setFarms((prev) => prev.map((f) => (f.id === updated.id ? freshFarm : f)));
      }
    } catch (err) {
      console.warn('[Supabase] Failed to persist/sync farm:', err);
    }

    try {
      await api.updateFarm({
        ...updatedFields,
        id: farm.id,
        location: updated.location,
      });
    } catch (err) {
      console.warn('Failed to persist farm updates to server:', err);
    }
  };

  const createFarm = async (newFarmData: Partial<Farm>): Promise<Farm> => {
    const newId = `farm_${Date.now()}`;
    const defaultFarm: Farm = {
      id: newId,
      name: newFarmData.name || 'New Farm Parcel',
      ownerId: user.id,
      location: {
        address: newFarmData.location?.address || `${user.village || 'Primary'}, ${user.district}`,
        district: newFarmData.location?.district || user.district,
        state: newFarmData.location?.state || user.state,
        latitude: newFarmData.location?.latitude || farm.location?.latitude || 0,
        longitude: newFarmData.location?.longitude || farm.location?.longitude || 0,
        boundaryVertices: newFarmData.boundaryVertices,
      },

      size: newFarmData.size || 2.0,
      sizeUnit: newFarmData.sizeUnit || 'acres',
      farmHealthScore: 80,
      irrigationType: newFarmData.irrigationType || 'Drip',
      boundaryVertices: newFarmData.boundaryVertices,
      crop: newFarmData.crop || {
        id: `crop_${Date.now()}`,
        name: '',
        variety: '',
        stage: '',
        sowingDate: '',
      },
      soil: newFarmData.soil || {
        healthScore: 75,
        nitrogen: 'Medium',
        phosphorus: 'Medium',
        potassium: 'Good',
        ph: 6.8,
        organicCarbon: 'Medium (0.6%)',
        moisturePercentage: 40,
        soilType: 'Loamy',
      },
      weather: farm.weather,
      satellite: farm.satellite,
    };

    setFarms((prev) => [defaultFarm, ...prev]);
    setSelectedFarmId(newId);

    // Save to Supabase
    supabaseService.upsertFarm(defaultFarm).catch((e) =>
      console.warn('Failed to insert new farm into Supabase:', e)
    );

    return defaultFarm;
  };

  const deleteFarm = async (farmId: string) => {
    setFarms((prev) => {
      const filtered = prev.filter((f) => f.id !== farmId);
      if (selectedFarmId === farmId && filtered.length > 0) {
        setSelectedFarmId(filtered[0].id);
      }
      return filtered;
    });

    supabaseService.deleteFarm(farmId).catch((e) =>
      console.warn('Failed to delete farm from Supabase:', e)
    );
  };

  const updateProfile = (updatedProfile: Partial<FarmerProfile>) => {
    setUser((prev) => ({
      ...prev,
      ...updatedProfile,
    }));
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
          ...MOCK_FARMER,
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
    setIsAuthenticated(false);
    if (clerkSignedIn) {
      clerkSignOut();
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
