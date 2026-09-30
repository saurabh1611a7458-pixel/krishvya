import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  Home,
  Trees,
  Bot,
  Menu,
  X,
  Satellite,
  CloudSun,
  Layers,
  Stethoscope,
  Leaf,
  CalendarDays,
  SlidersHorizontal,
  Bell,
  History,
  FileText,
  Globe2,
  User,
  Pipette,
} from 'lucide-react';
import { LanguageSelector } from './LanguageSelector';
import { useFarm } from '../../context/FarmContext';

export const MobileBottomNav: React.FC = () => {
  const [moreDrawerOpen, setMoreDrawerOpen] = useState(false);
  const { user, farm } = useFarm();

  const moreSections = [
    {
      title: 'MAIN',
      items: [
        { name: 'Weather', path: '/weather', icon: CloudSun },
        { name: 'My Crop', path: '/crop-health', icon: Satellite },
        { name: 'My Soil', path: '/soil', icon: Layers },
      ],
    },
    {
      title: 'AI & ACTION',
      items: [
        { name: 'Farm Plan', path: '/crop-planner', icon: CalendarDays },
        { name: 'Alerts', path: '/alerts', icon: Bell },
      ],
    },
    {
      title: 'MORE',
      items: [
        { name: 'Farm Records', path: '/reports', icon: FileText },
        { name: 'Past Activities', path: '/history', icon: History },
        { name: 'Tank Dosing', path: '/tank-calculator', icon: Pipette },
        { name: 'Regenerative', path: '/regenerative', icon: Leaf },
        { name: 'What-if', path: '/what-if', icon: SlidersHorizontal },
        { name: 'BRICS Hub', path: '/brics', icon: Globe2 },
        { name: 'Profile / Settings', path: '/profile', icon: User },
      ],
    },
  ];

  return (
    <>
      {/* Fixed Bottom Nav for Mobile */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-earth-200/90 shadow-lg px-1 py-1 select-none">
        <div className="grid grid-cols-5 items-center justify-around">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl text-[10px] font-bold transition-colors ${
                isActive ? 'text-krishi-700 bg-krishi-50' : 'text-gray-500 hover:text-gray-800'
              }`
            }
          >
            <Home className="w-4 h-4 mb-0.5" />
            <span>Home</span>
          </NavLink>

          <NavLink
            to="/farm"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl text-[10px] font-bold transition-colors ${
                isActive ? 'text-krishi-700 bg-krishi-50' : 'text-gray-500 hover:text-gray-800'
              }`
            }
          >
            <Trees className="w-4 h-4 mb-0.5" />
            <span>My Farm</span>
          </NavLink>

          <NavLink
            to="/disease"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl text-[10px] font-bold transition-colors ${
                isActive ? 'text-krishi-700 bg-krishi-50' : 'text-gray-500 hover:text-gray-800'
              }`
            }
          >
            <Stethoscope className="w-4 h-4 mb-0.5" />
            <span>Check Plant</span>
          </NavLink>

          <NavLink
            to="/ai-advisor"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl text-[10px] font-bold transition-colors ${
                isActive ? 'text-krishi-700 bg-krishi-50' : 'text-gray-500 hover:text-gray-800'
              }`
            }
          >
            <Bot className="w-4 h-4 mb-0.5" />
            <span>Ask AI</span>
          </NavLink>

          <button
            onClick={() => setMoreDrawerOpen(true)}
            type="button"
            className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl text-[10px] font-bold transition-colors ${
              moreDrawerOpen ? 'text-krishi-700 bg-krishi-50' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <Menu className="w-4 h-4 mb-0.5" />
            <span>More</span>
          </button>
        </div>
      </nav>

      {/* Slide-over Drawer for "More" Navigation */}
      {moreDrawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMoreDrawerOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 max-w-xs w-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-4 border-b border-earth-200 flex items-center justify-between bg-earth-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-krishi-700 text-white flex items-center justify-center font-bold text-sm">
                  K
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">KRISHVYA Menu</h3>
                  <p className="text-[10px] text-gray-500">{user.name}</p>
                </div>
              </div>
              <button
                onClick={() => setMoreDrawerOpen(false)}
                className="p-1.5 rounded-lg text-gray-500 hover:bg-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Language switch */}
            <div className="p-3 border-b border-earth-100 flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">Language:</span>
              <LanguageSelector compact />
            </div>

            {/* Drawer Links */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              {moreSections.map((sec) => (
                <div key={sec.title} className="space-y-1">
                  <h4 className="px-3 pt-1 text-[10px] font-black uppercase tracking-wider text-gray-400">
                    {sec.title}
                  </h4>
                  {sec.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={() => setMoreDrawerOpen(false)}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
                            isActive
                              ? 'bg-krishi-700 text-white font-bold'
                              : 'text-gray-700 hover:bg-earth-100'
                          }`
                        }
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.name}</span>
                      </NavLink>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Bottom farmer summary in drawer */}
            <div className="p-3 border-t border-earth-100 bg-earth-50/50 text-xs text-gray-500 flex justify-between items-center">
              <span>{farm.crop.name} • {farm.size} {farm.sizeUnit}</span>
              <Link
                to="/profile"
                onClick={() => setMoreDrawerOpen(false)}
                className="text-krishi-700 font-semibold hover:underline"
              >
                Profile & Settings
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
