import React, { useState, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Trees,
  Satellite,
  CloudSun,
  Layers,
  Bot,
  Stethoscope,
  Leaf,
  CalendarDays,
  SlidersHorizontal,
  Bell,
  Globe2,
  Sprout,
  Pipette,
  History,
  User,
  ChevronDown,
  MoreHorizontal,
} from 'lucide-react';
import { UserButton } from '@clerk/clerk-react';
import { useFarm } from '../../context/FarmContext';
import { LanguageSelector } from './LanguageSelector';

export const navSections = [
  {
    title: 'MAIN',
    items: [
      { name: 'Home', path: '/dashboard', icon: LayoutDashboard },
      { name: 'My Farm', path: '/farm', icon: Trees },
      { name: 'Weather', path: '/weather', icon: CloudSun },
      { name: 'My Crop', path: '/crop-health', icon: Satellite },
      { name: 'My Soil', path: '/soil', icon: Layers },
    ],
  },
  {
    title: 'FARM HELP', // title: 'AI & ACTION'
    items: [
      { name: 'Ask KRISHVYA', path: '/ai-advisor', icon: Bot },
      { name: 'Check Plant', path: '/disease', icon: Stethoscope },
      { name: 'Farm Plan', path: '/crop-planner', icon: CalendarDays },
      { name: 'Alerts', path: '/alerts', icon: Bell },
    ],
  },
  {
    title: 'MORE',
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

export const mainNavItems = navSections[0].items;
export const helpNavItems = navSections[1].items;
export const moreNavItems = navSections[2].items;
export const navItems = navSections.flatMap((s) => s.items);

export const Sidebar: React.FC = () => {
  const { user, farm } = useFarm();
  const location = useLocation();

  // Auto-expand More if current URL is inside More section
  const isMoreRouteActive = [
    '/history',
    '/reports',
    '/farm-history',
    '/tank-calculator',
    '/regenerative',
    '/what-if',
    '/brics',
    '/profile',
  ].some((p) => location.pathname.startsWith(p));

  const [isMoreOpen, setIsMoreOpen] = useState(isMoreRouteActive);

  useEffect(() => {
    if (isMoreRouteActive) {
      setIsMoreOpen(true);
    }
  }, [isMoreRouteActive]);

  // Dynamic farmer context (zero hardcoded values)
  const farmerName = user?.name || 'Farmer';
  const locationText =
    farm?.location?.district ||
    farm?.location?.state ||
    farm?.location?.address ||
    null;
  const sizeText = farm?.size ? `${farm.size} ${farm.sizeUnit || 'acres'}` : null;
  const farmDetails = [locationText, sizeText].filter(Boolean).join(' • ') || (farm?.name || 'Setup Farm');

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-[#E5E7EB] h-screen sticky top-0 select-none z-30">
      {/* Brand Header */}
      <div className="p-4 border-b border-[#E5E7EB] flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#166534] flex items-center justify-center text-white shadow-xs">
            <Sprout className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-1 leading-tight">
              <span className="text-lg font-bold tracking-tight text-[#1F2937]">KRISHVYA</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#166534]"></span>
            </div>
            <p className="text-[10px] font-semibold text-[#6B7280]">
              Your Farm Assistant
            </p>
          </div>
        </Link>
      </div>

      {/* Language Quick Switcher */}
      <div className="px-4 py-2 bg-[#F8F8F4] border-b border-[#E5E7EB] flex items-center justify-between">
        <span className="text-[11px] font-semibold text-[#6B7280]">Language:</span>
        <LanguageSelector compact />
      </div>

      {/* Simplified Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-5 no-scrollbar">
        {/* 1. MAIN SECTION */}
        <div className="space-y-1.5">
          <h4 className="px-3 pt-0.5 text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
            MAIN
          </h4>
          <div className="space-y-1">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 h-11 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-[#166534] text-white shadow-xs'
                        : 'text-[#4B5563] hover:bg-[#EAF4EC] hover:text-[#166534]'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? 'text-white' : 'text-[#6B7280]'
                        }`}
                      />
                      <span className="truncate">{item.name}</span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>

        {/* 2. FARM HELP SECTION */}
        <div className="space-y-1.5">
          <h4 className="px-3 pt-0.5 text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
            FARM HELP
          </h4>
          <div className="space-y-1">
            {helpNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 h-11 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-[#166534] text-white shadow-xs'
                        : 'text-[#4B5563] hover:bg-[#EAF4EC] hover:text-[#166534]'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? 'text-white' : 'text-[#6B7280]'
                        }`}
                      />
                      <span className="truncate">{item.name}</span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>

        {/* 3. MORE SECTION (Collapsible Accordion) */}
        <div className="space-y-1.5">
          <h4 className="px-3 pt-0.5 text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
            MORE
          </h4>
          <button
            type="button"
            onClick={() => setIsMoreOpen((prev) => !prev)}
            aria-expanded={isMoreOpen}
            className={`w-full flex items-center justify-between px-3 h-11 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              isMoreRouteActive && !isMoreOpen
                ? 'bg-[#EAF4EC] text-[#166534] border border-[#D1E7D6]'
                : 'text-[#4B5563] hover:bg-[#EAF4EC] hover:text-[#166534]'
            }`}
          >
            <div className="flex items-center gap-3">
              <MoreHorizontal className="w-4 h-4 text-[#6B7280]" />
              <span>⋯ More</span>
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 text-[#6B7280] transition-transform duration-200 ${
                isMoreOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Collapsible Sub-menu */}
          {isMoreOpen && (
            <div className="pt-1 pl-2.5 space-y-1 border-l-2 border-[#E5E7EB] ml-3.5 transition-all duration-200 animate-in fade-in slide-in-from-top-1">
              {moreNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-3 h-10 rounded-xl text-xs font-semibold transition-all ${
                        isActive || (item.path === '/history' && location.pathname === '/reports')
                          ? 'bg-[#166534] text-white shadow-xs'
                          : 'text-[#4B5563] hover:bg-[#EAF4EC] hover:text-[#166534]'
                      }`
                    }
                  >
                    {({ isActive }) => {
                      const isItemActive =
                        isActive || (item.path === '/history' && location.pathname === '/reports');
                      return (
                        <>
                          <Icon
                            className={`w-4 h-4 shrink-0 ${
                              isItemActive ? 'text-white' : 'text-[#6B7280]'
                            }`}
                          />
                          <span className="truncate">{item.name}</span>
                        </>
                      );
                    }}
                  </NavLink>
                );
              })}
            </div>
          )}
        </div>
      </nav>

      {/* Dynamic Farmer Context & User Profile at Bottom */}
      <div className="p-3 border-t border-[#E5E7EB] bg-[#F8F8F4]/80 flex items-center justify-between gap-2.5">
        <Link
          to="/profile"
          className="flex items-center gap-2.5 p-1 -m-1 rounded-xl hover:bg-white transition-colors group flex-1 min-w-0"
          title="View profile & farm settings"
        >
          <div className="w-8 h-8 rounded-full bg-[#EAF4EC] text-[#166534] border border-[#D1E7D6] font-bold flex items-center justify-center text-xs shrink-0 group-hover:bg-[#166534] group-hover:text-white transition-colors">
            {farmerName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-[#1F2937] truncate group-hover:text-[#166534]">
              {farmerName}
            </p>
            <p className="text-[10px] text-[#6B7280] truncate font-medium">
              {farmDetails}
            </p>
          </div>
        </Link>
        <div className="shrink-0">
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </aside>
  );
};
