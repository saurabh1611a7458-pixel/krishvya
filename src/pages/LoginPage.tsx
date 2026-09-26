import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SignIn } from '@clerk/clerk-react';
import {
  Sprout,
  ArrowLeft,
  ShieldCheck,
  Satellite,
  Droplets,
  Sparkles,
  UserCheck,
  CheckCircle2,
} from 'lucide-react';
import { ASSETS } from '../data/mockData';
import { LanguageSelector } from '../components/common/LanguageSelector';
import { useFarm } from '../context/FarmContext';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { switchTestUser } = useFarm();
  const [demoLoading, setDemoLoading] = useState<string | null>(null);

  const handleDemoLogin = (userKey: 'rajesh' | 'gurpreet') => {
    setDemoLoading(userKey);
    switchTestUser(userKey);
    setTimeout(() => {
      navigate('/dashboard');
    }, 300);
  };

  return (
    <div className="min-h-screen bg-[#FBFBF7] relative flex flex-col justify-between selection:bg-krishi-100 overflow-x-hidden">
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 rounded-full bg-emerald-200/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-amber-100/40 blur-3xl" />

      {/* Top Utility Bar */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/80 border border-earth-200/80 text-sm font-medium text-gray-700 hover:text-krishi-800 hover:border-krishi-400 hover:bg-white transition-all shadow-xs"
        >
          <ArrowLeft className="w-4 h-4 text-krishi-700" />
          <span>Back to Home</span>
        </Link>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/60 text-xs font-semibold text-emerald-800">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Precision Agriculture Cloud</span>
        </div>

        <LanguageSelector compact />
      </header>

      {/* Main Content Area / Centered Login Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-6 sm:px-6 lg:px-8">
        <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl shadow-krishi-900/8 border border-earth-200/90 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[620px]">
          
          {/* Left Column: Form & Authentication */}
          <div className="lg:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-between bg-white">
            <div>
              {/* Brand & Welcoming Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-krishi-600 to-krishi-800 flex items-center justify-center text-white shadow-md shadow-krishi-900/15 ring-4 ring-emerald-50">
                  <Sprout className="w-6 h-6 stroke-[2.2]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-black text-gray-900 tracking-tight">
                      KRISHVYA
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-krishi-100 text-krishi-800">
                      AI Farm
                    </span>
                  </div>
                  <p className="text-[11px] font-semibold text-earth-600">
                    Smart Precision Agriculture Platform
                  </p>
                </div>
              </div>

              {/* Clear Page Greeting */}
              <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                  Welcome Back 👋
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  Sign in to monitor your farm NDVI, localized weather, and AI recommendations.
                </p>
              </div>

              {/* Clerk SignIn Embedded Without Inner Card Box */}
              <div className="w-full">
                <SignIn
                  path="/login"
                  routing="path"
                  signUpUrl="/signup"
                  fallbackRedirectUrl="/dashboard"
                  appearance={{
                    elements: {
                      rootBox: 'w-full',
                      cardBox: 'w-full shadow-none border-0 bg-transparent p-0 m-0 max-w-full',
                      card: 'w-full shadow-none border-0 bg-transparent p-0 m-0 max-w-full',
                      header: 'hidden', // Replaced with our clean branded greeting above
                      headerTitle: 'hidden',
                      headerSubtitle: 'hidden',
                      socialButtonsBlockButton:
                        'w-full rounded-xl border border-gray-200 hover:bg-gray-50 text-xs font-semibold py-3 transition-colors flex items-center justify-center gap-2 text-gray-700 shadow-xs hover:border-krishi-500',
                      socialButtonsBlockButtonText: 'text-xs font-semibold text-gray-700',
                      dividerRow: 'my-4',
                      dividerText: 'text-[11px] font-medium text-gray-400 uppercase tracking-wider px-3',
                      formFieldLabel: 'text-xs font-bold text-gray-700 mb-1.5',
                      formFieldInput:
                        'w-full rounded-xl border border-gray-200 focus:border-krishi-600 focus:ring-2 focus:ring-krishi-100 text-sm py-2.5 px-3 transition-all placeholder:text-gray-400',
                      formButtonPrimary:
                        'w-full bg-krishi-700 hover:bg-krishi-800 text-white text-xs font-bold rounded-xl py-3.5 transition-all shadow-md shadow-krishi-700/20 active:scale-[0.99] mt-2',
                      footerActionLink: 'text-krishi-700 hover:text-krishi-800 font-bold text-xs hover:underline ml-1',
                      footerActionText: 'text-xs text-gray-500',
                      identityPreviewText: 'text-xs font-medium text-gray-700',
                      identityPreviewEditButton: 'text-xs text-krishi-700 font-bold hover:underline',
                      formFieldAction: 'text-xs text-krishi-700 font-semibold hover:underline',
                      formResendCodeLink: 'text-xs text-krishi-700 font-semibold hover:underline',
                      otpCodeFieldInput:
                        'border border-gray-300 rounded-xl focus:border-krishi-600 focus:ring-2 focus:ring-krishi-100 text-base font-bold text-krishi-900',
                    },
                    variables: {
                      colorPrimary: '#15803d',
                      colorText: '#1f2937',
                      borderRadius: '0.75rem',
                      fontFamily: 'inherit',
                    },
                  }}
                />
              </div>
            </div>

            {/* Quick Demo Access Bar */}
            <div className="mt-8 pt-6 border-t border-earth-100">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-earth-600 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Instant 1-Tap Demo Access</span>
                </span>
                <span className="text-[10px] text-gray-400 font-medium">No sign-up required</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleDemoLogin('rajesh')}
                  disabled={Boolean(demoLoading)}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/60 hover:border-emerald-300 transition-all text-left group"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-gray-900 truncate group-hover:text-emerald-900">
                      Rajesh Patel
                    </p>
                    <p className="text-[10px] text-emerald-800 font-medium truncate">
                      🌾 Rice • 2.5 ac • Saoner
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoLogin('gurpreet')}
                  disabled={Boolean(demoLoading)}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl border border-amber-200 bg-amber-50/50 hover:bg-amber-100/60 hover:border-amber-300 transition-all text-left group"
                >
                  <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-gray-900 truncate group-hover:text-amber-900">
                      Gurpreet Singh
                    </p>
                    <p className="text-[10px] text-amber-800 font-medium truncate">
                      🌾 Wheat • 4.0 ac • Muzaffarpur
                    </p>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Authentic Indian Agricultural Visual Showcase */}
          <div className="hidden lg:flex lg:col-span-5 relative bg-gradient-to-br from-krishi-900 via-krishi-950 to-emerald-950 flex-col justify-between p-8 text-white overflow-hidden">
            {/* High-res authentic Indian farmer backdrop */}
            <img
              src={ASSETS.farmerHero}
              alt="Authentic Indian farmer in lush crop field"
              className="absolute inset-0 w-full h-full object-cover opacity-25 mix-blend-luminosity"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-krishi-950/60 to-black/40 pointer-events-none" />

            {/* Top Chip */}
            <div className="relative z-10 flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-medium text-emerald-300 shadow-xs">
                <Satellite className="w-3.5 h-3.5 text-emerald-400" />
                <span>Sentinel-2 Satellite Radar</span>
              </div>
              <span className="text-[11px] font-semibold text-white/70">ISRO & ICAR Synced</span>
            </div>

            {/* Center Features */}
            <div className="relative z-10 space-y-4 my-8">
              <h2 className="text-2xl font-black text-white leading-tight">
                Empowering Indian Farmers with Intelligent Agriculture
              </h2>
              <p className="text-xs text-earth-200 leading-relaxed">
                Connect your farm boundaries and monitor micro-climate patterns, soil moisture, and crop health in real-time.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
                    <Satellite className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Daily Satellite NDVI Health</h4>
                    <p className="text-[11px] text-emerald-100/80 mt-0.5">
                      10m resolution spectral scans to spot crop stress before visible to eyes.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Gemini 2.5 Vision Crop Doctor</h4>
                    <p className="text-[11px] text-emerald-100/80 mt-0.5">
                      Upload leaf photos for instant pest & disease diagnosis with safe remedies.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
                    <Droplets className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Hyperlocal Weather & Spray Windows</h4>
                    <p className="text-[11px] text-emerald-100/80 mt-0.5">
                      Rain probability, wind velocity, and evapotranspiration soil calculations.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Trust Note */}
            <div className="relative z-10 pt-4 border-t border-white/15 flex items-center justify-between text-[11px] text-white/80">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Encrypted & Private Farm Data</span>
              </div>
              <div className="flex items-center gap-1 text-amber-300 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>100% Free</span>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Bottom Footer Note */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 text-center">
        <p className="text-[11px] text-gray-500">
          KRISHVYA • Precision Agricultural Intelligence for Indian Smallholders
        </p>
      </footer>
    </div>
  );
};

