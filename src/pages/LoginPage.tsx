import React from 'react';
import { Link } from 'react-router-dom';
import { SignIn } from '@clerk/clerk-react';
import { Sprout, ArrowLeft, ShieldCheck } from 'lucide-react';
import { ASSETS } from '../data/mockData';
import { LanguageSelector } from '../components/common/LanguageSelector';

export const LoginPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#FBFBF7] flex flex-col justify-center selection:bg-krishi-100">
      {/* Top Utility Bar */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-krishi-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
        <LanguageSelector compact />
      </div>

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-4xl bg-white rounded-3xl shadow-soft-lg border border-earth-200/80 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          {/* Left: Clerk SignIn Component */}
          <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center items-center">
            <div className="w-full max-w-md">
              {/* Brand Header */}
              <div className="flex items-center gap-2.5 mb-6">
                <div className="w-10 h-10 rounded-xl bg-krishi-700 flex items-center justify-center text-white shadow-sm">
                  <Sprout className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <span className="text-xl font-black text-krishi-900 tracking-tight">
                    KRISHVYA
                  </span>
                  <p className="text-[10px] font-semibold text-earth-600 uppercase tracking-wider">
                    Smart Indian Farm
                  </p>
                </div>
              </div>

              {/* Clerk SignIn */}
              <SignIn
                path="/login"
                routing="path"
                signUpUrl="/signup"
                fallbackRedirectUrl="/dashboard"
                appearance={{
                  elements: {
                    rootBox: 'w-full',
                    card: 'shadow-none p-0 border-0 bg-transparent w-full',
                    headerTitle: 'text-2xl font-black text-gray-900 tracking-tight',
                    headerSubtitle: 'text-xs text-gray-500',
                    socialButtonsBlockButton:
                      'rounded-xl border border-earth-200 hover:bg-earth-50 text-xs font-semibold py-2.5 transition-colors',
                    formButtonPrimary:
                      'bg-krishi-700 hover:bg-krishi-800 text-white text-xs font-bold rounded-xl py-3 transition-colors shadow-sm',
                    formFieldInput:
                      'rounded-xl border border-earth-200 focus:border-krishi-600 focus:ring-1 focus:ring-krishi-600 text-sm py-2.5',
                    footerActionLink: 'text-krishi-700 hover:text-krishi-800 font-semibold text-xs',
                    identityPreviewText: 'text-xs font-medium text-gray-700',
                    identityPreviewEditButton: 'text-xs text-krishi-700 font-semibold',
                  },
                  variables: {
                    colorPrimary: '#15803d',
                    colorText: '#1f2937',
                    borderRadius: '0.75rem',
                  },
                }}
              />
            </div>
          </div>

          {/* Right: Authentic Indian Farmer Visual Backdrop */}
          <div className="hidden lg:block lg:col-span-5 relative bg-krishi-800">
            <img
              src={ASSETS.farmerHero}
              alt="Authentic Indian farmer in lush green field"
              className="w-full h-full object-cover opacity-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent flex flex-col justify-end p-8 text-white">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-krishi-600/80 backdrop-blur-md text-white text-[11px] font-semibold mb-2 self-start border border-white/20 shadow-sm">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                <span>Protected by Clerk Identity</span>
              </div>
              <h3 className="text-xl font-black leading-snug">
                Your Farm. Your Data. Your AI.
              </h3>
              <p className="text-xs text-earth-200 mt-1 leading-relaxed">
                Log in to access your micro-local weather radar, Sentinel-2 NDVI vegetative health, and spray tank dosing tools.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
