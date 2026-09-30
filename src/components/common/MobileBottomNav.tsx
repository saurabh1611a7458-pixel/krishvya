import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Trees,
  CloudSun,
  Bot,
  MoreHorizontal,
  X,
  Satellite,
  Layers,
  Stethoscope,
  Leaf,
  CalendarDays,
  SlidersHorizontal,
  Bell,
  History,
  Globe2,
  User,
  Pipette,
} from 'lucide-react';
import { LanguageSelector } from './LanguageSelector';
import { useFarm } from '../../context/FarmContext';

export const MobileBottomNav: React.FC = () => {
  const [moreDrawerOpen, setMoreDrawerOpen] = useState(false);
  const { user, farm } = useFarm();

  const farmerName = user?.name || 'Farmer';
  const locationText =
    farm?.location?.district ||
    farm?.location?.state ||
    farm?.location?.address ||
    null;
  const sizeText = farm?.size ? `${farm.size} ${farm.sizeUnit || 'acres'}` : null;
  const farmDetails = [locationText, sizeText].filter(Boolean).join(' • ') || (farm?.name || 'Setup Farm');

  const drawerSections = [
    {
      title: 'FARM HELP',
      items: [
        { name: 'Check Plant', path: '/disease', icon: Stethoscope }, // to="/disease" Check Plant tab
        { name: 'Farm Plan', path: '/crop-planner', icon: CalendarDays },
        { name: 'Alerts', path: '/alerts', icon: Bell },
      ],
    },
    {
      title: 'MY FARM DATA',
      items: [
        { name: 'My Crop', path: '/crop-health', icon: Satellite },
        { name: 'My Soil', path: '/soil', icon: Layers },
      ],
    },
    {
      title: 'MORE TOOLS',
      items: [
        { name: 'Farm History', path: '/history', icon: History },
        { name: 'Tank Dosing', path: '/tank-calculator', icon: Pipette },
        { name: 'Regenerative Farming', path: '/regenerative', icon: Leaf },
        { name: 'What-if', path: '/what-if', icon: SlidersHorizontal },
        { name: 'BRICS Hub', path: '/brics', icon: Globe2 },
        { name: 'Profile / Settings', path: '/profile', icon: User },
      ],
    },
  ];

  return (
    <>
      {/* Fixed 5-Item Bottom Nav for Mobile */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E5E7EB] shadow-md px-1 py-1 select-none">
        <div className="grid grid-cols-5 items-center justify-around">
          {/* 1. Home */}
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl text-[10px] font-bold transition-colors ${
                isActive ? 'text-[#166534] bg-[#EAF4EC]' : 'text-[#4B5563] hover:text-[#166534]'
              }`
            }
          >
            <LayoutDashboard className="w-4 h-4 mb-0.5" />
            <span>Home</span>
          </NavLink>

          {/* 2. My Farm */}
          <NavLink
            to="/farm"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl text-[10px] font-bold transition-colors ${
                isActive ? 'text-[#166534] bg-[#EAF4EC]' : 'text-[#4B5563] hover:text-[#166534]'
              }`
            }
          >
            <Trees className="w-4 h-4 mb-0.5" />
            <span>My Farm</span>
          </NavLink>

          {/* 3. Weather */}
          <NavLink
            to="/weather"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl text-[10px] font-bold transition-colors ${
                isActive ? 'text-[#166534] bg-[#EAF4EC]' : 'text-[#4B5563] hover:text-[#166534]'
              }`
            }
          >
            <CloudSun className="w-4 h-4 mb-0.5" />
            <span>Weather</span>
          </NavLink>

          {/* 4. Ask KRISHVYA */}
          <NavLink
            to="/ai-advisor"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl text-[10px] font-bold transition-colors ${
                isActive ? 'text-[#166534] bg-[#EAF4EC]' : 'text-[#4B5563] hover:text-[#166534]'
              }`
            }
          >
            <Bot className="w-4 h-4 mb-0.5" />
            <span>Ask AI</span>
          </NavLink>

          {/* 5. More */}
          <button
            onClick={() => setMoreDrawerOpen(true)}
            type="button"
            className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl text-[10px] font-bold transition-colors cursor-pointer ${
              moreDrawerOpen ? 'text-[#166534] bg-[#EAF4EC]' : 'text-[#4B5563] hover:text-[#166534]'
            }`}
            aria-label="Open more menu"
          >
            <MoreHorizontal className="w-4 h-4 mb-0.5" />
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
            <div className="p-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F8F8F4]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#166534] text-white flex items-center justify-center font-bold text-xs">
                  {farmerName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-[#1F2937] text-sm">KRISHVYA Menu</h3>
                  <p className="text-[10px] text-[#6B7280]">{farmerName}</p>
                </div>
              </div>
              <button
                onClick={() => setMoreDrawerOpen(false)}
                className="p-1.5 rounded-lg text-[#6B7280] hover:bg-white cursor-pointer"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Language Switcher */}
            <div className="px-4 py-2 border-b border-[#E5E7EB] bg-white flex items-center justify-between">
              <span className="text-xs font-medium text-[#6B7280]">Language:</span>
              <LanguageSelector compact />
            </div>

            {/* Drawer Links */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              {drawerSections.map((sec) => (
                <div key={sec.title} className="space-y-1">
                  <h4 className="px-3 pt-1 text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
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
                          `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                            isActive
                              ? 'bg-[#166534] text-white font-bold'
                              : 'text-[#1F2937] hover:bg-[#EAF4EC] hover:text-[#166534]'
                          }`
                        }
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span>{item.name}</span>
                      </NavLink>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Bottom Farmer Summary in Drawer */}
            <div className="p-3.5 border-t border-[#E5E7EB] bg-[#F8F8F4] text-xs text-[#6B7280] flex justify-between items-center">
              <span className="truncate pr-2 font-medium">{farmDetails}</span>
              <Link
                to="/profile"
                onClick={() => setMoreDrawerOpen(false)}
                className="text-[#166534] font-bold hover:underline shrink-0"
              >
                Settings
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
