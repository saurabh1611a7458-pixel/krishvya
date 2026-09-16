import React, { useState } from 'react';
import { MapPin, Navigation, Layers } from 'lucide-react';

interface MapPlaceholderProps {
  locationName?: string;
  acres?: number;
  interactive?: boolean;
  onLocationSelect?: (lat: number, lng: number, address: string) => void;
  className?: string;
  lat?: number;
  lon?: number;
}

export const MapPlaceholder: React.FC<MapPlaceholderProps> = ({
  locationName = 'Maharashtra, India',
  acres = 2.5,
  interactive = false,
  onLocationSelect,
  className = '',
  lat,
  lon,
}) => {
  const [pinPos, setPinPos] = useState({ x: 50, y: 48 });
  const [mapType, setMapType] = useState<'satellite' | 'terrain'>('satellite');

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    setPinPos({ x, y });
    if (onLocationSelect) {
      const baseLat = typeof lat === 'number' ? lat : 0;
      const baseLon = typeof lon === 'number' ? lon : 0;
      onLocationSelect(baseLat + (y - 50) * 0.001, baseLon + (x - 50) * 0.001, locationName);
    }
  };


  return (
    <div
      className={`relative rounded-2xl overflow-hidden border border-earth-300/80 shadow-inner group ${className}`}
      style={{ minHeight: '260px' }}
      onClick={handleMapClick}
    >
      {/* Background Satellite Texture with agricultural fields */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
        style={{
          backgroundImage:
            mapType === 'satellite'
              ? `radial-gradient(circle, rgba(22, 101, 52, 0.25) 0%, rgba(15, 23, 42, 0.45) 100%), url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1000&q=80')`
              : `url('https://images.unsplash.com/photo-1586771107445-d3ca888129ff?auto=format&fit=crop&w=1000&q=80')`,
        }}
      >
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:32px_32px] opacity-40"></div>
      </div>

      {/* Field Boundary SVG Polygon */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
        <polygon
          points="35,32 68,36 64,68 32,62"
          fill="rgba(34, 197, 94, 0.28)"
          stroke="#22c55e"
          strokeWidth="1.2"
          strokeDasharray="2,2"
        />
      </svg>

      {/* Pin Marker */}
      <div
        className="absolute -translate-x-1/2 -translate-y-full transition-all duration-300 pointer-events-none"
        style={{ left: `${pinPos.x}%`, top: `${pinPos.y}%` }}
      >
        <div className="relative flex flex-col items-center">
          <div className="bg-krishi-700 text-white p-2 rounded-full shadow-lg ring-4 ring-white/80 animate-bounce">
            <MapPin className="w-5 h-5 text-white" />
          </div>
          <div className="mt-1 bg-gray-900/90 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow backdrop-blur-xs whitespace-nowrap">
            {locationName}
          </div>
        </div>
      </div>

      {/* Top Map Controls */}
      <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-10">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setMapType(mapType === 'satellite' ? 'terrain' : 'satellite');
          }}
          className="p-2 rounded-xl bg-white/90 text-gray-700 shadow hover:bg-white text-xs font-semibold flex items-center gap-1 backdrop-blur-xs"
        >
          <Layers className="w-4 h-4 text-krishi-700" />
          <span className="capitalize hidden sm:inline">{mapType}</span>
        </button>
      </div>

      {/* Bottom Information Pill */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
        <div className="bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-xl shadow-md border border-white/60 flex items-center gap-2">
          <Navigation className="w-4 h-4 text-krishi-700" />
          <div>
            <div className="text-xs font-bold text-gray-900">{locationName}</div>
            <div className="text-[10px] text-gray-500 font-mono">Area: {acres} acres • High accuracy</div>
          </div>
        </div>

        {interactive && (
          <div className="bg-krishi-800/90 text-white text-xs font-medium px-3 py-1.5 rounded-xl shadow backdrop-blur-xs hidden sm:block">
            📍 Click to adjust pin
          </div>
        )}
      </div>
    </div>
  );
};
