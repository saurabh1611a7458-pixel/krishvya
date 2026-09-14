import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';
import { Farm, FarmerProfile, ProblemCase, ProblemCategory } from '../types';
import { MOCK_FARM, MOCK_FARMER } from '../data/mockData';
import { api } from '../services/api';
import { supabaseService } from '../services/supabaseService';

interface FarmContextType {
  user: FarmerProfile;
  farm: Farm;
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
  const [user, setUser] = useState<FarmerProfile>(() => {
    const saved = localStorage.getItem('krishvya_user');
    return saved ? JSON.parse(saved) : MOCK_FARMER;
  });

  const [farm, setFarm] = useState<Farm>(() => {
    const saved = localStorage.getItem('krishvya_farm');
    return saved ? JSON.parse(saved) : MOCK_FARM;
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('krishvya_auth') === 'true' || Boolean(api.getToken());
  });

  const [problemCases, setProblemCases] = useState<ProblemCase[]>(() => {
    const saved = localStorage.getItem('krishvya_cases');
    return saved ? JSON.parse(saved) : [];
  });

  const { user: clerkUser, isLoaded: clerkLoaded, isSignedIn: clerkSignedIn } = useUser();
  const { signOut: clerkSignOut } = useClerk();

  // Sync Clerk authenticated user with FarmContext
  useEffect(() => {
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
  }, [clerkLoaded, clerkSignedIn, clerkUser]);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('krishvya_user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('krishvya_farm', JSON.stringify(farm));
  }, [farm]);

  useEffect(() => {
    localStorage.setItem('krishvya_auth', isAuthenticated ? 'true' : 'false');
  }, [isAuthenticated]);

  useEffect(() => {
    localStorage.setItem('krishvya_cases', JSON.stringify(problemCases));
  }, [problemCases]);

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

      // 2. Fetch farm data from Supabase Cloud Database (with API fallback)
      const sbFarm = await supabaseService.getFarm(user.id);
      if (sbFarm) {
        setFarm(sbFarm);
      } else {
        const farmRes = await api.getFarm();
        if (farmRes.success && farmRes.data) {
          setFarm((prev) => ({
            ...prev,
            ...farmRes.data,
          }));
        }
      }

      // 3. Fetch problem cases from Supabase Cloud Database (with API fallback)
      const sbCases = await supabaseService.getProblemCases();
      if (sbCases && sbCases.length > 0) {
        setProblemCases(sbCases);
      } else {
        const problemsRes = await api.getProblems();
        if (problemsRes.success && Array.isArray(problemsRes.data) && problemsRes.data.length > 0) {
          const mappedCases: ProblemCase[] = problemsRes.data.map((c: any) => ({
            id: c.id,
            farmerId: c.farmerId || user.id,
            farmId: c.farmId || farm.id,
            category: c.category as ProblemCategory,
            title: c.title,
            description: c.description,
            status: c.status,
            confidenceScore: c.confidenceScore,
            aiRecommendation: c.aiRecommendation,
            expertNotes: c.expertNotes,
            createdAt: c.createdAt,
            resolvedAt: c.resolvedAt,
          }));
          setProblemCases(mappedCases);
        }
      }
    } catch (err) {
      console.warn('[KRISHVYA FarmProvider] Could not sync with live database:', err);
    }
  }, [user.id, farm.id]);

  // Initial sync on startup
  useEffect(() => {
    refreshData();
  }, [refreshData]);

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
          setFarm((prev) => ({ ...prev, ...res.farm }));
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
          setFarm((prev) => ({ ...prev, ...res.farm }));
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

  const updateFarm = async (updatedFields: Partial<Farm>) => {
    const updated = {
      ...farm,
      ...updatedFields,
    };
    setFarm(updated);

    // Persist to Supabase Cloud Database
    supabaseService.upsertFarm(updated).catch((err) =>
      console.warn('[Supabase] Failed to persist farm:', err)
    );

    try {
      await api.updateFarm(updatedFields);
    } catch (err) {
      console.warn('Failed to persist farm updates to server:', err);
    }
  };

  const updateProfile = (updatedProfile: Partial<FarmerProfile>) => {
    setUser((prev) => ({
      ...prev,
      ...updatedProfile,
    }));
  };

  const submitProblem = (category: ProblemCategory, description: string = ''): ProblemCase => {
    // Section 26 Intelligent Triage Engine
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

    // Persist to Supabase Cloud Database in background
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

    // Persist to SQLite via API in background
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

    // Resolve in Supabase Cloud Database
    supabaseService.resolveProblemCase(caseId, expertNotes).catch((err) =>
      console.warn('[Supabase] Resolve problem delayed:', err)
    );

    try {
      await api.resolveExpertCase(caseId, expertNotes);
    } catch (err) {
      console.warn('Resolve problem call delayed:', err);
    }
  };

  // Real-time Supabase subscription for live problem triage & expert advice
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
