import React from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/common/Navbar';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { ASSETS } from '../data/mockData';
import { useLanguage } from '../context/LanguageContext';
import {
  CloudSun,
  Satellite,
  Bot,
  Leaf,
  ArrowRight,
  ShieldCheck,
  Languages,
  Mic,
  Smartphone,
  Sprout,
  HeartHandshake,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { t } = useLanguage();

  const features = [
    {
      title: t('weatherIntelligence'),
      icon: CloudSun,
      emoji: '🌦️',
      color: 'bg-sky-50 text-sky-700 border-sky-200',
      description: 'Micro-local hyper-forecasts, rainfall probability, and frost/heat wave alerts calibrated to your village coordinate.',
    },
    {
      title: t('cropHealth'),
      icon: Satellite,
      emoji: '🛰️',
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      description: 'Regular satellite NDVI vegetative density monitoring and early stress detection before visible symptoms show.',
    },
    {
      title: t('aiFarmAdvisor'),
      icon: Bot,
      emoji: '🤖',
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      description: 'Instant answers on pest diagnosis, fertilizer dose, and harvest timing in simple everyday spoken language.',
    },
    {
      title: t('regenerativeFarming'),
      icon: Leaf,
      emoji: '🌱',
      color: 'bg-amber-50 text-amber-800 border-amber-200',
      description: 'Practical organic carbon practices, intercropping recipes, and mulching tips to cut input cost and restore soil life.',
    },
  ];

  const steps = [
    {
      step: '01',
      title: t('step1Title'),
      desc: t('step1Desc'),
      icon: '📍',
    },
    {
      step: '02',
      title: t('step2Title'),
      desc: t('step2Desc'),
      icon: '🛰️',
    },
    {
      step: '03',
      title: t('step3Title'),
      desc: t('step3Desc'),
      icon: '🧠',
    },
    {
      step: '04',
      title: t('step4Title'),
      desc: t('step4Desc'),
      icon: '📱',
    },
  ];

  return (
    <div className="min-h-screen bg-[#FBFBF7] flex flex-col selection:bg-krishi-100">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-8 pb-16 md:pt-14 md:pb-24 overflow-hidden border-b border-earth-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
            {/* Left Copy */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-krishi-100/80 border border-krishi-200/80 text-krishi-800 text-sm font-semibold shadow-xs">
                <span className="flex h-2 w-2 rounded-full bg-krishi-600 animate-pulse"></span>
                <span>🌾 Designed for Indian Village Farmers</span>
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 tracking-tight leading-[1.1]">
                Your Farm. <br />
                Your Data. <br />
                <span className="text-krishi-700 underline decoration-krishi-300 decoration-wavy decoration-2">
                  Your AI.
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
                {t('taglineSub')}
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
                <Link to="/signup" className="w-full sm:w-auto">
                  <Button variant="primary" size="lg" fullWidth className="shadow-md hover:shadow-xl">
                    {t('startYourFarm')}
                  </Button>
                </Link>
                <a href="#how-it-works" className="w-full sm:w-auto">
                  <Button variant="secondary" size="lg" fullWidth>
                    {t('seeHowItWorks')}
                  </Button>
                </a>
              </div>

              {/* Trust badges */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-krishi-600" />
                  <span className="font-medium">100% Free for Village Farmers</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Languages className="w-4 h-4 text-krishi-600" />
                  <span className="font-medium">7 Indian Regional Languages</span>
                </div>
              </div>
            </div>

            {/* Right Hero Image Card */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                {/* Visual Backdrop Halo */}
                <div className="absolute -inset-2 rounded-3xl bg-gradient-to-tr from-krishi-600/20 via-sun-400/20 to-krishi-400/30 blur-xl opacity-70"></div>

                <div className="relative rounded-3xl overflow-hidden border-4 border-white shadow-soft-lg bg-white group">
                  <img
                    src={ASSETS.farmerHero}
                    alt="Authentic Indian farmer in a lush green agricultural field"
                    className="w-full h-[420px] sm:h-[490px] object-cover object-top transition-transform duration-700 group-hover:scale-105"
                  />

                  {/* Top Status Pill */}
                  <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 text-white text-[11px] font-semibold flex items-center gap-1.5 shadow-md">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>Empowering Indian Farmers</span>
                  </div>

                  {/* Floating Highlight Badge */}
                  <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-white/80 shadow-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-krishi-100 flex items-center justify-center text-krishi-700 font-bold text-lg flex-shrink-0">
                        🌱
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold uppercase tracking-wider text-krishi-800 truncate">
                          Smarter Farmers • Healthier Soil
                        </p>
                        <p className="text-xs text-gray-600 font-medium truncate">
                          Real-time AI & satellite guidance for your fields
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section id="features" className="py-16 md:py-20 bg-white border-b border-earth-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">
              Essential Tools for Every Season
            </h2>
            <p className="mt-3 text-base text-gray-600">
              Clear, practical technology built for real Indian weather, local soil, and village farming conditions.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feat) => {
              const Icon = feat.icon;
              return (
                <Card
                  key={feat.title}
                  hoverable
                  className="flex flex-col justify-between border-earth-200/90 hover:border-krishi-300"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-2xl">{feat.emoji}</span>
                      <div className={`p-2 rounded-xl border ${feat.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{feat.title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{feat.description}</p>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* How KRISHVYA Works (4 Steps) */}
      <section id="how-it-works" className="py-16 md:py-24 bg-earth-50/50 border-b border-earth-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-black uppercase tracking-widest text-krishi-700 bg-krishi-100 px-3 py-1 rounded-full">
              Simple 4-Step Process
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight mt-3">
              {t('howItWorksTitle')}
            </h2>
            <p className="mt-2 text-base text-gray-600">
              No complicated manuals. Simple questions that take under 2 minutes.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((item, index) => (
              <div
                key={item.step}
                className="relative bg-white rounded-2xl p-6 border border-earth-200 shadow-soft flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-3xl">{item.icon}</span>
                    <span className="text-2xl font-black text-krishi-200 font-mono">
                      {item.step}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1.5">{item.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
                </div>
                {index < 3 && (
                  <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                    <ArrowRight className="w-6 h-6 text-krishi-300" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Built for Every Farmer */}
      <section id="about" className="py-16 md:py-20 bg-white border-b border-earth-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-krishi-700">
                Accessible & Friendly
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight mt-1.5 mb-4">
                {t('builtForEveryFarmer')}
              </h2>
              <p className="text-base text-gray-600 leading-relaxed mb-6">
                {t('builtForEveryFarmerDesc')}
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-krishi-100 text-krishi-700 mt-0.5">
                    <Languages className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Regional Indian Languages</h4>
                    <p className="text-sm text-gray-600">
                      Bhojpuri, English, Hindi, Kannada, Marathi, Tamil, Telugu.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-amber-100 text-amber-800 mt-0.5">
                    <Mic className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Voice-Friendly Interaction</h4>
                    <p className="text-sm text-gray-600">
                      Ask questions by speaking or uploading photos if typing is inconvenient.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-sky-100 text-sky-700 mt-0.5">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Fast on 2G / 3G / 4G Networks</h4>
                    <p className="text-sm text-gray-600">
                      Lightweight architecture built to function smoothly on affordable phones and low network zones.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl overflow-hidden shadow-soft-lg border-2 border-earth-200 relative">
              <img
                src={ASSETS.fieldBanner}
                alt="Agricultural field at sunrise"
                className="w-full h-80 sm:h-96 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent flex flex-col justify-end p-6 text-white">
                <div className="flex items-center gap-2 mb-1 text-krishi-300 font-bold text-sm">
                  <HeartHandshake className="w-5 h-5" />
                  <span>Farmer First Promise</span>
                </div>
                <p className="text-lg font-bold">
                  "Your Farm. Your Data. Your AI."
                </p>
                <p className="text-xs text-gray-200 mt-1">
                  We never sell your land data to commercial middlemen.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="py-14 md:py-20 bg-gradient-to-br from-krishi-800 via-krishi-900 to-krishi-950 text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <Sprout className="w-12 h-12 mx-auto text-krishi-300 mb-4 stroke-[2]" />
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4">
            {t('readyToUnderstand')}
          </h2>
          <p className="text-krishi-100 text-base max-w-xl mx-auto mb-8 font-normal leading-relaxed">
            Join thousands of village farmers using smart data to protect crops and increase their seasonal earnings.
          </p>
          <Link to="/signup">
            <Button
              variant="secondary"
              size="lg"
              className="bg-white text-krishi-900 hover:bg-krishi-50 font-bold px-8 shadow-xl"
            >
              {t('getStarted')}
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-earth-900 text-earth-200 py-10 text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-krishi-600 text-white flex items-center justify-center font-bold">
              🌱
            </div>
            <span className="text-lg font-bold text-white tracking-wide">KRISHVYA</span>
            <span className="text-earth-400 text-xs ml-2">© 2026 KRISHVYA Platform</span>
          </div>
          <p className="text-xs text-earth-400 text-center sm:text-right">
            Smart Agriculture for Village Farmers • Built for India
          </p>
        </div>
      </footer>
    </div>
  );
};
