import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Sidebar } from '../components/common/Sidebar';
import { MobileBottomNav } from '../components/common/MobileBottomNav';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { useFarm } from '../context/FarmContext';
import { supabaseService } from '../services/supabaseService';
import { CropObservationRecord, SoilTestRecord, DiseaseScan, FarmAlert } from '../types';
import {
  FileText,
  Download,
  Droplets,
  Sprout,
  CheckCircle,
  Calendar,
  MapPin,
  Stethoscope,
  Bell,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';

interface TimelinePoint {
  date: string;
  label: string;
  score: number;
  type: 'crop' | 'soil';
}

export const ReportsPage: React.FC = () => {
  const { farm, farms, selectFarm, user } = useFarm();
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [cropObservations, setCropObservations] = useState<CropObservationRecord[]>([]);
  const [soilTests, setSoilTests] = useState<SoilTestRecord[]>([]);
  const [diseaseScans, setDiseaseScans] = useState<DiseaseScan[]>([]);
  const [alerts, setAlerts] = useState<FarmAlert[]>([]);

  const userId = user?.id || farm.user_id;

  const loadReportData = useCallback(async () => {
    if (!farm?.id || !userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [obs, tests, scans, alts] = await Promise.all([
        supabaseService.getCropObservations(userId, farm.id),
        supabaseService.getSoilTests(userId, farm.id),
        supabaseService.getDiseaseScans(userId, farm.id),
        supabaseService.getFarmAlerts(userId, farm.id),
      ]);
      setCropObservations(obs);
      setSoilTests(tests);
      setDiseaseScans(scans);
      setAlerts(alts);
    } catch (err) {
      console.warn('Failed to load farm report records:', err);
    } finally {
      setLoading(false);
    }
  }, [farm.id, userId]);

  useEffect(() => {
    loadReportData();
  }, [loadReportData]);

  // Dynamically assemble historical health timeline from real observations and soil tests
  const timelinePoints = useMemo<TimelinePoint[]>(() => {
    const points: TimelinePoint[] = [];

    cropObservations.forEach((obs) => {
      if (typeof obs.healthScore === 'number') {
        points.push({
          date: obs.createdAt,
          label: new Date(obs.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
          score: obs.healthScore,
          type: 'crop',
        });
      }
    });

    soilTests.forEach((st) => {
      if (typeof st.healthScore === 'number') {
        points.push({
          date: st.testDate || st.createdAt,
          label: new Date(st.testDate || st.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
          score: st.healthScore,
          type: 'soil',
        });
      }
    });

    // Sort chronologically ascending
    points.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return points;
  }, [cropObservations, soilTests]);

  // Reporting Date Range Calculation
  const dateRangeText = useMemo(() => {
    if (timelinePoints.length > 0) {
      const earliest = new Date(timelinePoints[0].date).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      const latest = new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      return `${earliest} — ${latest}`;
    }
    return `Season ${new Date().getFullYear()} (Telemetry recording active)`;
  }, [timelinePoints]);

  // Generate downloadable structured farm report file
  const handleDownload = (reportType: string) => {
    const timestamp = new Date().toISOString().split('T')[0];
    let content = '';

    if (reportType === 'Soil Health Analysis') {
      const latestTest = soilTests[0];
      content = [
        'KRISHVYA SOIL HEALTH ANALYSIS STATEMENT',
        `Date: ${timestamp}`,
        `Farm: ${farm.name}`,
        `Owner: ${user?.name || farm.user_id || 'Farmer'}`,
        `Location: ${farm.location?.address || farm.location?.district || ''}`,
        `Total Soil Tests: ${soilTests.length}`,
        '',
        'LATEST RECORD:',
        latestTest
          ? [
              `pH: ${latestTest.ph ?? 'N/A'}`,
              `Nitrogen: ${latestTest.nitrogen || 'N/A'}`,
              `Phosphorus: ${latestTest.phosphorus || 'N/A'}`,
              `Potassium: ${latestTest.potassium || 'N/A'}`,
              `Organic Carbon: ${latestTest.organicCarbon || 'N/A'}`,
              `Moisture: ${latestTest.moisturePercentage ?? 'N/A'}%`,
              `Health Score: ${latestTest.healthScore ?? 'N/A'}/100`,
              `Source: ${latestTest.source || 'Soil Health Card'}`,
              `Notes: ${latestTest.notes || 'Routine soil test'}`,
            ].join('\n')
          : 'No soil tests logged in database.',
      ].join('\n');
    } else if (reportType === 'Crop Growth & Yield Statement') {
      const latestObs = cropObservations[0];
      content = [
        'KRISHVYA CROP GROWTH & TELEMETRY STATEMENT',
        `Date: ${timestamp}`,
        `Farm: ${farm.name}`,
        `Crop: ${farm.crop?.name || farm.crop_variety || 'Unspecified'}`,
        `Stage: ${farm.crop?.stage || 'Active'}`,
        `Sowing Date: ${farm.crop?.sowingDate || 'N/A'}`,
        `Crop Health Observations: ${cropObservations.length}`,
        `Disease & Pest Scans: ${diseaseScans.length}`,
        '',
        'LATEST OBSERVATION:',
        latestObs
          ? [
              `Health Score: ${latestObs.healthScore}/100`,
              `NDVI: ${latestObs.ndvi ?? 'N/A'}`,
              `Stage: ${latestObs.stage}`,
              `Notes: ${latestObs.notes || 'N/A'}`,
            ].join('\n')
          : 'No crop observations recorded.',
      ].join('\n');
    } else {
      content = [
        'KRISHVYA COMPREHENSIVE FARM REPORT',
        `Date: ${timestamp}`,
        `Farm Name: ${farm.name}`,
        `Owner: ${user?.name || farm.user_id || 'Farmer'}`,
        `Area: ${farm.size} ${farm.sizeUnit || 'acres'}`,
        `Crop: ${farm.crop?.name || farm.crop_variety || 'General Field'}`,
        `Coordinates: ${farm.location?.latitude || 0}°N, ${farm.location?.longitude || 0}°E`,
        `Irrigation: ${farm.irrigationType || 'Standard'}`,
        '',
        'SUMMARY TOTALS:',
        `- Soil Tests Logged: ${soilTests.length}`,
        `- Crop Observations: ${cropObservations.length}`,
        `- Disease Scans: ${diseaseScans.length}`,
        `- Total Operational Alerts: ${alerts.length}`,
      ].join('\n');
    }

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `KRISHVYA_${reportType.replace(/\s+/g, '_')}_${farm.name.replace(/\s+/g, '_')}_${timestamp}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadSuccess(`Generated and downloaded ${reportType} for ${farm.name}`);
    setTimeout(() => setDownloadSuccess(null), 4000);
  };

  // Compute SVG line path from real historical timeline points
  const svgPathData = useMemo(() => {
    if (timelinePoints.length < 2) return null;
    const width = 500;
    const height = 120;
    const paddingX = 40;
    const paddingY = 20;
    const usableWidth = width - paddingX * 2;
    const usableHeight = height - paddingY * 2;

    const coords = timelinePoints.map((pt, index) => {
      const x = paddingX + (index / (timelinePoints.length - 1)) * usableWidth;
      const y = height - paddingY - (Math.max(0, Math.min(100, pt.score)) / 100) * usableHeight;
      return { x, y, ...pt };
    });

    const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
    const areaPath = `${linePath} L ${coords[coords.length - 1].x.toFixed(1)},${height} L ${coords[0].x.toFixed(1)},${height} Z`;

    return { linePath, areaPath, coords };
  }, [timelinePoints]);

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-10">
        <header className="bg-white border-b border-earth-200/80 px-4 sm:px-8 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sticky top-0 z-20">
          <div>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-krishi-700" />
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                Farm Records
              </h1>
            </div>
            <p className="text-xs text-gray-500">
              Official telemetry statements for {farm.name} • Certified audit trail
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-earth-100 text-xs font-bold text-gray-700">
              <Calendar className="w-3.5 h-3.5 text-krishi-700" />
              <span>{dateRangeText}</span>
            </div>

            <Button
              onClick={() => loadReportData()}
              variant="outline"
              size="sm"
              disabled={loading}
              icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          {downloadSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center gap-2 animate-in fade-in">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{downloadSuccess}</span>
            </div>
          )}

          {/* Farm Switcher & Metadata Banner */}
          <div className="p-4 bg-white rounded-2xl border border-earth-200 text-xs shadow-xs space-y-2">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2 border-b border-earth-100">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-krishi-600 shrink-0" />
                <span className="text-gray-700">
                  Reporting Scope: <strong className="text-gray-900 text-sm">{farm.name}</strong> •{' '}
                  <span className="text-gray-600">
                    {farm.crop?.name || farm.crop_variety || 'General Field'}{' '}
                    {farm.size ? `(${farm.size} ${farm.sizeUnit || 'acres'})` : ''}
                  </span>
                </span>
              </div>

              {farms.length > 1 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-gray-400 text-[11px] font-semibold uppercase mr-1">Switch:</span>
                  {farms.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => selectFarm(f.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                        farm.id === f.id
                          ? 'bg-krishi-700 text-white'
                          : 'bg-earth-100 text-gray-700 hover:bg-earth-200'
                      }`}
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-gray-600">
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-bold block">Soil Tests</span>
                <strong className="text-sm font-black text-gray-900">{soilTests.length} Logged</strong>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-bold block">Crop Observations</span>
                <strong className="text-sm font-black text-gray-900">{cropObservations.length} Scans</strong>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-bold block">Disease Checks</span>
                <strong className="text-sm font-black text-gray-900">{diseaseScans.length} Checks</strong>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-bold block">Operational Alerts</span>
                <strong className="text-sm font-black text-gray-900">{alerts.length} Tracked</strong>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Real Farm Health Trend Graph */}
            <div className="lg:col-span-8 space-y-4">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-krishi-700" />
                      <span>Farm Health Progression</span>
                    </h3>
                    <p className="text-xs text-gray-500">
                      Telemetry progression across recorded observations and soil tests
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-krishi-800">
                      {farm.farmHealthScore ?? cropObservations[0]?.healthScore ?? 'Pending'}
                    </span>
                    <span className="text-xs font-bold text-emerald-700 block">
                      {farm.farmHealthScore || cropObservations[0]?.healthScore ? 'Current Score' : 'Telemetry Pending'}
                    </span>
                  </div>
                </div>

                {svgPathData && svgPathData.coords.length >= 2 ? (
                  <div className="relative h-64 w-full bg-earth-50/60 rounded-2xl p-4 border border-earth-200 flex flex-col justify-between">
                    {/* Reference Grid */}
                    <div className="absolute inset-x-4 top-6 border-b border-gray-200/80 text-[10px] text-gray-400">100</div>
                    <div className="absolute inset-x-4 top-22 border-b border-gray-200/80 text-[10px] text-gray-400">75</div>
                    <div className="absolute inset-x-4 top-38 border-b border-gray-200/80 text-[10px] text-gray-400">50</div>

                    <svg className="w-full h-44 mt-4" viewBox="0 0 500 120" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="realCurveGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#16a34a" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#16a34a" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      <path d={svgPathData.areaPath} fill="url(#realCurveGradient)" />
                      <path
                        d={svgPathData.linePath}
                        fill="none"
                        stroke="#16a34a"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />

                      {/* Milestone nodes */}
                      {svgPathData.coords.map((pt, idx) => (
                        <circle
                          key={idx}
                          cx={pt.x}
                          cy={pt.y}
                          r={idx === svgPathData.coords.length - 1 ? 6 : 4}
                          fill="#15803d"
                          stroke="#ffffff"
                          strokeWidth="2"
                        />
                      ))}
                    </svg>

                    {/* Milestone labels */}
                    <div className="flex justify-between text-xs font-bold text-gray-500 px-4 pt-2 overflow-x-auto">
                      {svgPathData.coords.map((c, i) => (
                        <span key={i} className="whitespace-nowrap">
                          {c.label} ({c.score})
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-10 bg-earth-50/70 rounded-2xl border border-dashed border-earth-300 text-center space-y-2">
                    <ShieldCheck className="w-10 h-10 text-krishi-600 mx-auto" />
                    <h4 className="font-bold text-gray-800 text-sm">
                      Insufficient Historical Telemetry
                    </h4>
                    <p className="text-xs text-gray-500 max-w-md mx-auto">
                      Seasonal progression curves require at least two logged data points. As you record soil tests, crop health scans, or disease checks for {farm.name}, verified health lines will chart here automatically.
                    </p>
                  </div>
                )}
              </Card>

              {/* Download Reports Bar */}
              <Card className="p-6">
                <h3 className="text-base font-bold text-gray-900 mb-1">Download Official Farm Reports</h3>
                <p className="text-xs text-gray-500 mb-4">
                  Formatted for PM-Kisan verification, agricultural bank credit, and crop insurance claims.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Button
                    onClick={() => handleDownload('Farm Comprehensive Report')}
                    variant="primary"
                    size="md"
                    icon={<Download className="w-4 h-4" />}
                    className="font-bold shadow-xs"
                  >
                    Farm Report
                  </Button>

                  <Button
                    onClick={() => handleDownload('Soil Health Analysis')}
                    variant="secondary"
                    size="md"
                    icon={<Download className="w-4 h-4" />}
                    className="font-semibold"
                  >
                    Soil Report
                  </Button>

                  <Button
                    onClick={() => handleDownload('Crop Growth & Yield Statement')}
                    variant="secondary"
                    size="md"
                    icon={<Download className="w-4 h-4" />}
                    className="font-semibold"
                  >
                    Crop Report
                  </Button>
                </div>
              </Card>
            </div>

            {/* Right: Key Verified Field Insights */}
            <div className="lg:col-span-4 space-y-4">
              <Card className="p-6 space-y-4 bg-gradient-to-br from-white to-earth-50/50">
                <h3 className="font-bold text-gray-900 text-base pb-3 border-b border-earth-100">
                  Verified Field Telemetry
                </h3>

                <div className="space-y-3.5">
                  {/* Soil Telemetry Insight */}
                  <div className="p-3.5 bg-white rounded-2xl border border-earth-200/90 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
                        <Droplets className="w-4 h-4 text-sky-600" />
                        <span>Soil Status</span>
                      </div>
                      <span className="text-[10px] font-bold text-gray-500">
                        {soilTests.length} tests logged
                      </span>
                    </div>
                    {soilTests[0] ? (
                      <div className="mt-2 space-y-1 text-xs">
                        <div className="font-black text-gray-900 text-sm">
                          pH {soilTests[0].ph} • {soilTests[0].soilType || farm.soil?.soilType || 'Soil'}
                        </div>
                        <p className="text-gray-500 text-[11px]">
                          Moisture: {soilTests[0].moisturePercentage ?? 'No sensor data'}% • Score: {soilTests[0].healthScore}/100
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 mt-2">
                        No soil test logged yet. Record a test to track soil health.
                      </p>
                    )}
                  </div>

                  {/* Crop Telemetry Insight */}
                  <div className="p-3.5 bg-white rounded-2xl border border-earth-200/90 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
                        <Sprout className="w-4 h-4 text-emerald-600" />
                        <span>Crop Canopy Health</span>
                      </div>
                      <span className="text-[10px] font-bold text-gray-500">
                        {cropObservations.length} observations
                      </span>
                    </div>
                    {cropObservations[0] ? (
                      <div className="mt-2 space-y-1 text-xs">
                        <div className="font-black text-gray-900 text-sm">
                          Score: {cropObservations[0].healthScore}/100
                        </div>
                        <p className="text-gray-500 text-[11px]">
                          Stage: {cropObservations[0].stage} {cropObservations[0].ndvi ? `• NDVI: ${cropObservations[0].ndvi}` : ''}
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 mt-2">
                        No crop health observation recorded yet.
                      </p>
                    )}
                  </div>

                  {/* Disease Doctor Activity Insight */}
                  <div className="p-3.5 bg-white rounded-2xl border border-earth-200/90 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
                        <Stethoscope className="w-4 h-4 text-rose-600" />
                        <span>Pathology Scans</span>
                      </div>
                      <span className="text-[10px] font-bold text-gray-500">
                        {diseaseScans.length} checks
                      </span>
                    </div>
                    {diseaseScans.length > 0 ? (
                      <div className="mt-2 space-y-1 text-xs">
                        <div className="font-bold text-gray-900">
                          Latest: {diseaseScans[0].detectedProblem}
                        </div>
                        <p className="text-gray-500 text-[11px]">
                          Severity: {diseaseScans[0].severity} • Scanned {new Date(diseaseScans[0].createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 mt-2">
                        Zero pest or disease outbreaks logged on this farm.
                      </p>
                    )}
                  </div>

                  {/* Operational Risk Insight */}
                  <div className="p-3.5 bg-white rounded-2xl border border-earth-200/90 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
                        <Bell className="w-4 h-4 text-amber-600" />
                        <span>Active Field Alerts</span>
                      </div>
                      <span className="text-[10px] font-bold text-gray-500">
                        {alerts.filter((a) => !a.isRead).length} unread
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-gray-600">
                      {alerts.filter((a) => !a.isRead).length > 0
                        ? `Attention required: ${alerts.filter((a) => !a.isRead)[0].title}`
                        : 'All farm conditions currently within normal operating limits.'}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </main>
      </div>

      <MobileBottomNav />
    </div>
  );
};
