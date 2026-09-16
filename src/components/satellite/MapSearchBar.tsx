import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  X,
  Loader2,
  MapPin,
  Compass,
  Building,
  Home,
  Navigation,
  Sparkles,
  Globe,
  ChevronLeft,
} from 'lucide-react';
import { searchGlobalLocations, GeocodingResult, parseCoordinates } from '../../services/geocodingService';

interface MapSearchBarProps {
  onSelectLocation: (result: GeocodingResult) => void;
  onMyLocationClick?: () => void;
  isLocatingGps?: boolean;
  hasLiveGps?: boolean;
  activeLocationName?: string;
  collapsible?: boolean;
  className?: string;
}

export const MapSearchBar: React.FC<MapSearchBarProps> = ({
  onSelectLocation,
  onMyLocationClick,
  isLocatingGps = false,
  hasLiveGps = false,
  activeLocationName,
  collapsible = true,
  className = '',
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(!collapsible);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [hasSearched, setHasSearched] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Close dropdown or collapse on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        if (collapsible && !query) {
          setIsExpanded(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [collapsible, query]);

  // Debounced search with request cancellation
  useEffect(() => {
    const trimmed = query.trim();

    if (!trimmed || trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      setIsOpen(false);
      setHasSearched(false);
      return;
    }

    // Direct coordinates show up immediately without network delay
    const coordMatch = parseCoordinates(trimmed);
    if (coordMatch) {
      setResults([coordMatch]);
      setIsOpen(true);
      setLoading(false);
      setHasSearched(true);
      return;
    }

    setLoading(true);
    setHasSearched(true);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const timer = setTimeout(async () => {
      try {
        const searchResults = await searchGlobalLocations(trimmed, controller.signal);
        setResults(searchResults);
        setIsOpen(true);
        setSelectedIndex(-1);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.warn('Location search error:', err);
          setResults([]);
        }
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => {
      clearTimeout(timer);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [query]);

  // Handle selecting a place
  const handleSelect = (item: GeocodingResult) => {
    setQuery(item.placeName || item.displayName.split(',')[0]);
    setIsOpen(false);
    onSelectLocation(item);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < results.length) {
        handleSelect(results[selectedIndex]);
      } else if (results.length > 0) {
        handleSelect(results[0]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      if (collapsible && !query) {
        setIsExpanded(false);
      }
    }
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    setHasSearched(false);
    inputRef.current?.focus();
  };

  const handleOpenSearch = () => {
    setIsExpanded(true);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const renderBadge = (type: GeocodingResult['type']) => {
    switch (type) {
      case 'city':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Building className="w-2.5 h-2.5" /> City
          </span>
        );
      case 'village':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Home className="w-2.5 h-2.5" /> Village
          </span>
        );
      case 'landmark':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <Sparkles className="w-2.5 h-2.5" /> Landmark
          </span>
        );
      case 'coordinate':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <Compass className="w-2.5 h-2.5" /> Coordinates
          </span>
        );
      case 'postcode':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-700 border border-gray-200">
            PIN Code
          </span>
        );
      case 'region':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Globe className="w-2.5 h-2.5" /> Region
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-gray-50 text-gray-600 border border-gray-200">
            <MapPin className="w-2.5 h-2.5" /> Place
          </span>
        );
    }
  };

  return (
    <div ref={containerRef} className={`relative z-[1001] ${className}`}>
      {/* Collapsed Search Icon Button */}
      {!isExpanded ? (
        <button
          onClick={handleOpenSearch}
          type="button"
          className="group flex items-center gap-2 bg-white/95 hover:bg-white text-gray-800 backdrop-blur-md rounded-2xl shadow-xl border border-white/40 px-3.5 py-2 transition-all duration-200 hover:shadow-2xl hover:scale-[1.02] cursor-pointer"
          title={activeLocationName ? `Viewing: ${activeLocationName} — Click to search other locations` : "Search any location worldwide on satellite map"}
        >
          <div className="w-7 h-7 rounded-xl bg-krishi-700 text-white flex items-center justify-center shadow-xs group-hover:bg-krishi-800 transition-colors">
            <Search className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-gray-800 hidden sm:inline pr-1">
            {activeLocationName ? `Search: ${activeLocationName}` : 'Search Satellite Map...'}
          </span>
        </button>
      ) : (
        /* Expanded Floating Search Bar */
        <div className="w-full sm:w-[380px] md:w-[420px] transition-all animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center gap-1.5 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-earth-200/90 p-1.5 transition-all focus-within:ring-2 focus-within:ring-krishi-600 focus-within:border-transparent">
            {collapsible && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  setIsExpanded(false);
                }}
                type="button"
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition-colors shrink-0"
                title="Collapse search"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}

            <div className="flex-1 flex items-center gap-2 px-1">
              <Search className="w-4 h-4 text-krishi-700 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => {
                  if (results.length > 0) setIsOpen(true);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Search city, village, landmark, PIN, coords..."
                className="w-full bg-transparent border-0 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-hidden py-1 font-medium"
              />

              {loading && <Loader2 className="w-3.5 h-3.5 text-krishi-600 animate-spin shrink-0" />}

              {query && !loading && (
                <button
                  onClick={handleClear}
                  type="button"
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {onMyLocationClick && (
              <>
                <div className="h-5 w-px bg-earth-200" />
                <button
                  onClick={onMyLocationClick}
                  disabled={isLocatingGps}
                  type="button"
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    hasLiveGps
                      ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                      : 'bg-earth-100 hover:bg-earth-200 text-gray-700'
                  }`}
                  title="Fly map to live GPS"
                >
                  <Navigation
                    className={`w-3 h-3 ${
                      isLocatingGps ? 'animate-spin text-krishi-600' : hasLiveGps ? 'text-emerald-600' : 'text-gray-500'
                    }`}
                  />
                  <span className="hidden sm:inline text-[11px]">GPS</span>
                </button>
              </>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {isOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white/98 backdrop-blur-md rounded-2xl shadow-2xl border border-earth-200 overflow-hidden max-h-72 overflow-y-auto z-[1002] animate-in fade-in slide-in-from-top-1 duration-150">
              {results.length > 0 ? (
                <ul className="divide-y divide-earth-100 py-1">
                  {results.map((item, index) => (
                    <li
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`px-3.5 py-2.5 cursor-pointer transition-colors flex items-start gap-2.5 text-left ${
                        selectedIndex === index ? 'bg-krishi-50/80 text-krishi-900' : 'hover:bg-earth-50 text-gray-800'
                      }`}
                    >
                      <div className="mt-0.5 text-krishi-700 shrink-0">
                        <MapPin className="w-3.5 h-3.5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="text-xs font-bold text-gray-900 truncate">
                            {item.placeName}
                          </span>
                          {renderBadge(item.type)}
                        </div>
                        <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">
                          {item.address}
                        </p>
                        <span className="text-[10px] font-mono text-gray-400 mt-0.5 block">
                          {item.lat.toFixed(4)}°N, {item.lon.toFixed(4)}°E
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : hasSearched && !loading ? (
                <div className="p-3.5 text-center text-gray-500 text-xs">
                  <MapPin className="w-5 h-5 text-gray-300 mx-auto mb-1" />
                  <p className="font-semibold text-gray-700 text-xs">Location not found</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    No results for "{query}". Check spelling or search coordinates (e.g. 18.5204, 73.8567).
                  </p>
                </div>
              ) : null}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
