import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Trees,
  Satellite,
  CloudSun,
  Layers,
  Bot,
  Stethoscope,
  ScanLine,
  Leaf,
  CalendarDays,
  SlidersHorizontal,
  Bell,
  History,
  FileText,
  Globe2,
  User,
  Sprout,
  Pipette,
} from 'lucide-react';
import { UserButton } from '@clerk/clerk-react';
import { useFarm } from '../../context/FarmContext';
import { LanguageSelector } from './LanguageSelector';

export const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'My Farm', path: '/farm', icon: Trees },
  { name: 'Crop Health', path: '/crop-health', icon: Satellite },
  { name: 'Weather', path: '/weather', icon: CloudSun },
  { name: 'Soil Health', path: '/soil', icon: Layers },
  { name: 'AI Advisor', path: '/ai-advisor', icon: Bot },
  { name: 'Disease Doctor', path: '/disease', icon: Stethoscope },
  { name: 'Tank Dosing & Mix', path: '/tank-calculator', icon: Pipette },
  { name: 'Plant Scanner', path: '/plant-scanner', icon: ScanLine },
  { name: 'Regenerative', path: '/regenerative', icon: Leaf },
  { name: 'Crop Planner', path: '/crop-planner', icon: CalendarDays },
  { name: 'What-if', path: '/what-if', icon: SlidersHorizontal },
  { name: 'Alerts', path: '/alerts', icon: Bell },
  { name: 'History', path: '/history', icon: History },
  { name: 'Reports', path: '/reports', icon: FileText },
  { name: 'BRICS Hub', path: '/brics', icon: Globe2 },
  { name: 'Profile', path: '/profile', icon: User },
];

export const Sidebar: React.FC = () => {
  const { user, farm } = useFarm();

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-earth-200/90 h-screen sticky top-0 select-none z-30">
      {/* Brand Header */}
      <div className="p-5 border-b border-earth-100 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-krishi-700 flex items-center justify-center text-white shadow-sm">
            <Sprout className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="text-xl font-black tracking-tight text-krishi-900">KRISHVYA</span>
              <span className="w-1.5 h-1.5 rounded-full bg-krishi-500"></span>
            </div>
            <p className="text-[9px] font-semibold tracking-wider text-earth-600 uppercase">
              Smart Indian Farm
            </p>
          </div>
        </Link>
      </div>

      {/* Language Quick Switcher */}
      <div className="px-4 py-2.5 bg-earth-50/70 border-b border-earth-100 flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500">Language / भाषा:</span>
        <LanguageSelector compact />
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 no-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-krishi-700 text-white shadow-sm font-semibold'
                    : 'text-gray-600 hover:bg-earth-100 hover:text-gray-900'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`w-4 h-4 flex-shrink-0 ${
                      isActive ? 'text-white' : 'text-gray-500'
                    }`}
                  />
                  <span className="truncate">{item.name}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Farm Quick Badge & Farmer User profile */}
      <div className="p-3.5 border-t border-earth-200 bg-earth-50/60 flex items-center justify-between gap-2">
        <Link
          to="/profile"
          className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-white transition-colors group flex-1 min-w-0"
        >
          <div className="w-8 h-8 rounded-full bg-krishi-100 text-krishi-800 font-bold flex items-center justify-center border border-krishi-300 text-xs flex-shrink-0">
            {user.name ? user.name.charAt(0) : 'K'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-gray-800 truncate group-hover:text-krishi-700">
              {user.name}
            </p>
            <p className="text-[10px] text-gray-500 truncate">
              {farm.location.district || farm.location.state} • {farm.size} {farm.sizeUnit}
            </p>
          </div>
        </Link>
        <div className="flex-shrink-0">
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </aside>
  );
};
