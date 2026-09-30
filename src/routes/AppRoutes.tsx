import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { useFarm } from '../context/FarmContext';
import { Suspense, lazy } from 'react';

// Lazy-loaded route components for optimized bundle splitting
const LandingPage = lazy(() => import('../pages/LandingPage').then(m => ({ default: m.LandingPage })));
const LoginPage = lazy(() => import('../pages/LoginPage').then(m => ({ default: m.LoginPage })));
const SignupPage = lazy(() => import('../pages/SignupPage').then(m => ({ default: m.SignupPage })));
const OtpVerifyPage = lazy(() => import('../pages/OtpVerifyPage').then(m => ({ default: m.OtpVerifyPage })));
const OnboardingPage = lazy(() => import('../pages/OnboardingPage').then(m => ({ default: m.OnboardingPage })));
const DashboardPage = lazy(() => import('../pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const ProblemPage = lazy(() => import('../pages/ProblemPage').then(m => ({ default: m.ProblemPage })));
const FarmPage = lazy(() => import('../pages/FarmPage').then(m => ({ default: m.FarmPage })));
const ProfilePage = lazy(() => import('../pages/ProfilePage').then(m => ({ default: m.ProfilePage })));
const CropHealthPage = lazy(() => import('../pages/CropHealthPage').then(m => ({ default: m.CropHealthPage })));
const WeatherPage = lazy(() => import('../pages/WeatherPage').then(m => ({ default: m.WeatherPage })));
const SoilHealthPage = lazy(() => import('../pages/SoilHealthPage').then(m => ({ default: m.SoilHealthPage })));
const AiAdvisorPage = lazy(() => import('../pages/AiAdvisorPage').then(m => ({ default: m.AiAdvisorPage })));
const DiseaseDoctorPage = lazy(() => import('../pages/DiseaseDoctorPage').then(m => ({ default: m.DiseaseDoctorPage })));
const AlertsPage = lazy(() => import('../pages/AlertsPage').then(m => ({ default: m.AlertsPage })));
const RegenerativePage = lazy(() => import('../pages/RegenerativePage').then(m => ({ default: m.RegenerativePage })));
const WhatIfPage = lazy(() => import('../pages/WhatIfPage').then(m => ({ default: m.WhatIfPage })));
const ReportsPage = lazy(() => import('../pages/ReportsPage').then(m => ({ default: m.ReportsPage })));
const ExpertDashboardPage = lazy(() => import('../pages/ExpertDashboardPage').then(m => ({ default: m.ExpertDashboardPage })));
const BricsHubPage = lazy(() => import('../pages/BricsHubPage').then(m => ({ default: m.BricsHubPage })));
const PlantScannerPage = lazy(() => import('../pages/PlantScannerPage').then(m => ({ default: m.PlantScannerPage })));
const CropPlannerPage = lazy(() => import('../pages/CropPlannerPage').then(m => ({ default: m.CropPlannerPage })));
const HistoryPage = lazy(() => import('../pages/HistoryPage').then(m => ({ default: m.HistoryPage })));
const AdminDashboardPage = lazy(() => import('../pages/AdminDashboardPage').then(m => ({ default: m.AdminDashboardPage })));
const TankCalculatorPage = lazy(() => import('../pages/TankCalculatorPage').then(m => ({ default: m.TankCalculatorPage })));

const PageLoadingFallback: React.FC = () => (
  <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-4">
    <div className="w-10 h-10 border-4 border-krishi-700 border-t-transparent rounded-full animate-spin mb-3" />
    <p className="text-xs font-semibold text-gray-600">Loading KRISHVYA...</p>
  </div>
);

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoaded: clerkLoaded, isSignedIn: clerkSignedIn } = useUser();
  const { isAuthenticated, isNewUser, isSyncingAuth, farms } = useFarm();
  const location = useLocation();

  // 1. While Clerk auth or initial Supabase sync is running
  if (!clerkLoaded || isSyncingAuth) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-krishi-700 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-bold text-gray-800">Connecting to KRISHVYA Farm Cloud...</p>
        <p className="text-xs text-gray-500 mt-1">Syncing profile & farm intelligence with Supabase</p>
      </div>
    );
  }

  // 2. Unauthenticated check
  const isAuth = Boolean(clerkSignedIn || isAuthenticated);
  if (!isAuth) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. New User check: only redirect if the user has 0 farms
  const hasFarms = Boolean(farms && farms.length > 0);
  if (isNewUser && !hasFarms && location.pathname !== '/onboarding' && location.pathname !== '/farm') {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};

export const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<PageLoadingFallback />}>
      <Routes>
      {/* Public & Clerk Authentication Pages */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login/*" element={<LoginPage />} />
      <Route path="/signup/*" element={<SignupPage />} />
      <Route path="/sign-in/*" element={<Navigate to="/login" replace />} />
      <Route path="/sign-up/*" element={<Navigate to="/signup" replace />} />
      <Route path="/verify-otp" element={<OtpVerifyPage />} />

      {/* Onboarding & Dashboard Protected */}
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <OnboardingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/problem"
        element={
          <ProtectedRoute>
            <ProblemPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/farm"
        element={
          <ProtectedRoute>
            <FarmPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      {/* Core Intelligence Views Protected */}
      <Route
        path="/crop-health"
        element={
          <ProtectedRoute>
            <CropHealthPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/weather"
        element={
          <ProtectedRoute>
            <WeatherPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/soil"
        element={
          <ProtectedRoute>
            <SoilHealthPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ai-advisor"
        element={
          <ProtectedRoute>
            <AiAdvisorPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/disease"
        element={
          <ProtectedRoute>
            <DiseaseDoctorPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/alerts"
        element={
          <ProtectedRoute>
            <AlertsPage />
          </ProtectedRoute>
        }
      />

      {/* Advanced Tools & Ecosystem Views Protected */}
      <Route
        path="/regenerative"
        element={
          <ProtectedRoute>
            <RegenerativePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/what-if"
        element={
          <ProtectedRoute>
            <WhatIfPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/plant-scanner"
        element={
          <ProtectedRoute>
            <PlantScannerPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/crop-planner"
        element={
          <ProtectedRoute>
            <CropPlannerPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tank-calculator"
        element={
          <ProtectedRoute>
            <TankCalculatorPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <ReportsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/history"
        element={
          <ProtectedRoute>
            <HistoryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/brics"
        element={
          <ProtectedRoute>
            <BricsHubPage />
          </ProtectedRoute>
        }
      />

      {/* Role Dashboards Protected */}
      <Route
        path="/expert/dashboard"
        element={
          <ProtectedRoute>
            <ExpertDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute>
            <AdminDashboardPage />
          </ProtectedRoute>
        }
      />

      {/* Route Aliases */}
      <Route path="/soil-health" element={<Navigate to="/soil" replace />} />
      <Route path="/disease-doctor" element={<Navigate to="/disease" replace />} />
      <Route path="/check-plant" element={<Navigate to="/disease" replace />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </Suspense>
  );
};
