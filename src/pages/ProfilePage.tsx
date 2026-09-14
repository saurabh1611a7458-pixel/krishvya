import React, { useState } from 'react';
import { Sidebar } from '../components/common/Sidebar';
import { MobileBottomNav } from '../components/common/MobileBottomNav';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { LanguageSelector } from '../components/common/LanguageSelector';
import { useFarm } from '../context/FarmContext';
import { useLanguage } from '../context/LanguageContext';
import { User, Phone, Mail, MapPin, Globe, Mic, Bell, Save, Check, LogOut } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, updateProfile, logout } = useFarm();
  const { t } = useLanguage();

  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone);
  const [email, setEmail] = useState(user.email);
  const [location, setLocation] = useState(user.state);
  const [voiceEnabled, setVoiceEnabled] = useState(user.voiceAssistantEnabled);
  const [notifications, setNotifications] = useState(user.smsNotifications);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name,
      phone,
      email,
      state: location,
      voiceAssistantEnabled: voiceEnabled,
      smsNotifications: notifications,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="min-h-screen bg-[#FBFBF7] flex">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-10">
        <header className="bg-white border-b border-earth-200/80 px-4 sm:px-8 py-4 flex items-center justify-between sticky top-0 z-20">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              {t('profile')} & Settings
            </h1>
            <p className="text-xs text-gray-500">Manage your account and village preferences</p>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            icon={<LogOut className="w-4 h-4 text-red-600" />}
            className="text-red-600 hover:bg-red-50"
          >
            {t('logout')}
          </Button>
        </header>

        <main className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full space-y-6">
          {savedSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-800 text-sm font-semibold border border-emerald-200 flex items-center gap-2">
              <Check className="w-5 h-5 text-emerald-600" />
              <span>Your profile preferences have been updated!</span>
            </div>
          )}

          {/* Profile Header Badge */}
          <Card className="p-6 flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <div className="w-20 h-20 rounded-full bg-krishi-700 text-white font-black text-2xl flex items-center justify-center shadow-md">
              {name.charAt(0)}
            </div>
            <div className="text-center sm:text-left flex-1">
              <h2 className="text-2xl font-black text-gray-900">{name}</h2>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 mt-1 rounded-full bg-krishi-100 text-krishi-800 text-xs font-bold capitalize">
                <span>🌱</span>
                <span>{user.role}</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">{email}</p>
            </div>
          </Card>

          <form onSubmit={handleSave} className="space-y-6">
            {/* Account Details Card */}
            <Card className="p-6 space-y-4">
              <h3 className="font-bold text-gray-900 text-base pb-3 border-b border-earth-100 flex items-center gap-2">
                <User className="w-4 h-4 text-krishi-700" />
                <span>{t('accountInfo')}</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  icon={<User className="w-4 h-4" />}
                />
                <Input
                  label="Mobile Number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  icon={<Phone className="w-4 h-4" />}
                />
                <Input
                  label="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  icon={<Mail className="w-4 h-4" />}
                />
                <Input
                  label="Location / State"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  icon={<MapPin className="w-4 h-4" />}
                />
              </div>
            </Card>

            {/* Preferences Card */}
            <Card className="p-6 space-y-4">
              <h3 className="font-bold text-gray-900 text-base pb-3 border-b border-earth-100 flex items-center gap-2">
                <Globe className="w-4 h-4 text-krishi-700" />
                <span>{t('preferences')}</span>
              </h3>

              <div className="space-y-4">
                {/* Language Row */}
                <div className="flex items-center justify-between py-2 border-b border-earth-100">
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">Preferred Language (भाषा)</h4>
                    <p className="text-xs text-gray-500">All recommendations and voice guidance in this language</p>
                  </div>
                  <LanguageSelector />
                </div>

                {/* Voice Assistant Toggle */}
                <div className="flex items-center justify-between py-2 border-b border-earth-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-amber-50 text-amber-800">
                      <Mic className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">{t('voiceAssistant')}</h4>
                      <p className="text-xs text-gray-500">Read daily advisories aloud in local voice</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={voiceEnabled}
                      onChange={(e) => setVoiceEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-krishi-600"></div>
                  </label>
                </div>

                {/* Notifications Toggle */}
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-sky-50 text-sky-700">
                      <Bell className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">{t('notifications')}</h4>
                      <p className="text-xs text-gray-500">Receive SMS weather storm alerts and pest warnings</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications}
                      onChange={(e) => setNotifications(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-krishi-600"></div>
                  </label>
                </div>
              </div>
            </Card>

            <div className="flex justify-end">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                icon={<Save className="w-5 h-5" />}
                className="shadow-md"
              >
                {t('saveChanges')}
              </Button>
            </div>
          </form>
        </main>
      </div>

      <MobileBottomNav />
    </div>
  );
};
