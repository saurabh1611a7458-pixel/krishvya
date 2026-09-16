import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Loader2, Check } from 'lucide-react';
import { searchGlobalLocations, reverseGeocode, GeocodingResult, parseCoordinates } from '../../services/geocodingService';

interface LocationSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelectLocation: (result: {
    lat: number;
    lon: number;
    displayName: string;
    district?: string;
    state?: string;
  }) => void;
  currentLat?: number;
  currentLon?: number;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

export const LocationSearchInput: React.FC<LocationSearchInputProps> = ({
  value,
  onChange,
  onSelectLocation,
  currentLat,
  currentLon,
  placeholder = 'Search village, district, city or enter coordinates...',
  className = '',
  required = false,
}) => {
  const [suggestions, setSuggestions] = useState<GeocodingResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced geocoding search
  useEffect(() => {
    const trimmed = value.trim();
    if (!trimmed || trimmed.length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    // Direct coordinates
    const directCoords = parseCoordinates(trimmed);
    if (directCoords) {
      setSuggestions([directCoords]);
      setShowDropdown(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    const timer = setTimeout(async () => {
      try {
        const results = await searchGlobalLocations(trimmed, controller.signal);
        setSuggestions(results);
        if (results.length > 0) {
          setShowDropdown(true);
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.warn('Autocomplete lookup error:', err);
        }
      } finally {
        setLoading(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [value]);

  const handleSelect = (item: GeocodingResult) => {
    const parts = item.displayName.split(',').map((p) => p.trim());
    const district = parts.length > 2 ? parts[parts.length - 3] : parts[0];
    const state = parts.length > 1 ? parts[parts.length - 2] : '';

    onChange(item.displayName);
    onSelectLocation({
      lat: item.lat,
      lon: item.lon,
      displayName: item.displayName,
      district,
      state,
    });
    setShowDropdown(false);
    setSuggestions([]);
  };

  const handleGpsClick = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const rev = await reverseGeocode(latitude, longitude);
          const addressName = rev ? rev.displayName : `${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E`;
          onChange(addressName);
          onSelectLocation({
            lat: latitude,
            lon: longitude,
            displayName: addressName,
            district: rev?.district,
            state: rev?.state,
          });
        } catch (e) {
          console.warn('GPS reverse geocode error:', e);
          const fallback = `${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E`;
          onChange(fallback);
          onSelectLocation({
            lat: latitude,
            lon: longitude,
            displayName: fallback,
          });
        } finally {
          setIsLocating(false);
          setShowDropdown(false);
        }
      },
      () => {
        setIsLocating(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const hasCoords = typeof currentLat === 'number' && typeof currentLon === 'number' && (currentLat !== 0 || currentLon !== 0);

  return (
    <div ref={dropdownRef} className={`relative w-full ${className}`}>
      <div className="relative flex items-center">
        <MapPin className="absolute left-3 w-4 h-4 text-krishi-600 pointer-events-none shrink-0" />
        <input
          ref={inputRef}
          type="text"
          required={required}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => {
            if (suggestions.length > 0) setShowDropdown(true);
          }}
          className="w-full pl-9 pr-24 py-2 border border-earth-300 rounded-xl text-sm focus:ring-2 focus:ring-krishi-600 focus:outline-none bg-white font-medium"
          placeholder={placeholder}
        />

        <div className="absolute right-1.5 flex items-center gap-1">
          {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400 mr-1" />}
          <button
            type="button"
            onClick={handleGpsClick}
            disabled={isLocating}
            title="Use current GPS location"
            className="inline-flex items-center gap-1 px-2 py-1 bg-krishi-50 hover:bg-krishi-100 text-krishi-800 rounded-lg text-xs font-bold border border-krishi-200 transition-colors shadow-2xs cursor-pointer"
          >
            <Navigation className={`w-3 h-3 ${isLocating ? 'animate-spin text-krishi-700' : 'text-krishi-700'}`} />
            <span>{isLocating ? 'Locating' : 'GPS'}</span>
          </button>
        </div>
      </div>

      {/* Verified Coordinates Pill */}
      {hasCoords && (
        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium">
          <Check className="w-3 h-3 text-emerald-600 shrink-0" />
          <span>Coordinates linked:</span>
          <span className="font-mono bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
            {currentLat?.toFixed(4)}°N, {currentLon?.toFixed(4)}°E
          </span>
        </div>
      )}

      {/* Suggestions Dropdown */}
      {showDropdown && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-earth-200 max-h-56 overflow-y-auto z-[9999] py-1">
          {suggestions.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelect(item)}
              className="w-full text-left px-3 py-2 hover:bg-krishi-50 transition-colors flex items-start gap-2.5 border-b border-earth-100 last:border-0 cursor-pointer"
            >
              <MapPin className="w-4 h-4 text-krishi-600 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-gray-900 truncate">
                  {item.placeName || item.displayName.split(',')[0]}
                </div>
                <div className="text-[11px] text-gray-500 truncate">
                  {item.displayName}
                </div>
                <div className="text-[10px] font-mono text-krishi-700 mt-0.5">
                  {item.lat.toFixed(4)}°N, {item.lon.toFixed(4)}°E
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
