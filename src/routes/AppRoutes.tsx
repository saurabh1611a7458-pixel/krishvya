import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from '../pages/LandingPage';
import { LoginPage } from '../pages/LoginPage';
import { SignupPage } from '../pages/SignupPage';
import { OtpVerifyPage } from '../pages/OtpVerifyPage';
import { OnboardingPage } from '../pages/OnboardingPage';
import { DashboardPage } from '../pages/DashboardPage';
import { ProblemPage } from '../pages/ProblemPage';
import { FarmPage } from '../pages/FarmPage';
import { ProfilePage } from '../pages/ProfilePage';
import { CropHealthPage } from '../pages/CropHealthPage';
import { WeatherPage } from '../pages/WeatherPage';
import { SoilHealthPage } from '../pages/SoilHealthPage';
import { AiAdvisorPage } from '../pages/AiAdvisorPage';
import { DiseaseDoctorPage } from '../pages/DiseaseDoctorPage';
import { AlertsPage } from '../pages/AlertsPage';
import { RegenerativePage } from '../pages/RegenerativePage';
import { WhatIfPage } from '../pages/WhatIfPage';
import { ReportsPage } from '../pages/ReportsPage';
import { ExpertDashboardPage } from '../pages/ExpertDashboardPage';
import { BricsHubPage } from '../pages/BricsHubPage';
import { PlantScannerPage } from '../pages/PlantScannerPage';
import { CropPlannerPage } from '../pages/CropPlannerPage';
import { HistoryPage } from '../pages/HistoryPage';
import { AdminDashboardPage } from '../pages/AdminDashboardPage';
import { TankCalculatorPage } from '../pages/TankCalculatorPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public & Clerk Authentication Pages */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login/*" element={<LoginPage />} />
      <Route path="/signup/*" element={<SignupPage />} />
      <Route path="/sign-in/*" element={<Navigate to="/login" replace />} />
      <Route path="/sign-up/*" element={<Navigate to="/signup" replace />} />
      <Route path="/verify-otp" element={<OtpVerifyPage />} />

      {/* Onboarding & Dashboard */}
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/problem" element={<ProblemPage />} />
      <Route path="/farm" element={<FarmPage />} />
      <Route path="/profile" element={<ProfilePage />} />

      {/* Core Intelligence Views */}
      <Route path="/crop-health" element={<CropHealthPage />} />
      <Route path="/weather" element={<WeatherPage />} />
      <Route path="/soil" element={<SoilHealthPage />} />
      <Route path="/ai-advisor" element={<AiAdvisorPage />} />
      <Route path="/disease" element={<DiseaseDoctorPage />} />
      <Route path="/alerts" element={<AlertsPage />} />

      {/* Advanced Tools & Ecosystem Views */}
      <Route path="/regenerative" element={<RegenerativePage />} />
      <Route path="/what-if" element={<WhatIfPage />} />
      <Route path="/plant-scanner" element={<PlantScannerPage />} />
      <Route path="/crop-planner" element={<CropPlannerPage />} />
      <Route path="/tank-calculator" element={<TankCalculatorPage />} />
      <Route path="/reports" element={<ReportsPage />} />
      <Route path="/history" element={<HistoryPage />} />
      <Route path="/brics" element={<BricsHubPage />} />

      {/* Role Dashboards */}
      <Route path="/expert/dashboard" element={<ExpertDashboardPage />} />
      <Route path="/admin/dashboard" element={<AdminDashboardPage />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
