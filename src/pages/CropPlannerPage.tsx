import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sidebar } from '../components/common/Sidebar';
import { MobileBottomNav } from '../components/common/MobileBottomNav';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { useFarm } from '../context/FarmContext';
import { useFarmIntelligence } from '../context/FarmIntelligenceContext';
import { supabaseService } from '../services/supabaseService';
import {
  CheckCircle2,
  Clock,
  Sprout,
  Droplets,
  ShieldCheck,
  Layers,
  ArrowRight,
  MessageSquare,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Camera,
} from 'lucide-react';

export const CropPlannerPage: React.FC = () => {
  const navigate = useNavigate();
  const { farm, user } = useFarm();
  const { intelligence, weatherData } = useFarmIntelligence();

  const [selectedSeason, setSelectedSeason] = useState<'rabi' | 'zaid'>('rabi');
  const [showOtherRotationOptions, setShowOtherRotationOptions] = useState(false);
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(new Set());
  const [isMarkingDone, setIsMarkingDone] = useState<string | null>(null);

  // Farm context
  const cropName = farm.crop?.name || farm.crop_variety || '';
  const cropStage = farm.crop?.stage || farm.crop_stage || '';
  const areaDisplay = farm.size ? `${farm.size} ${farm.sizeUnit || 'acres'}` : 'Area not specified';
  const irrigationType = farm.irrigationType || (farm as any).irrigation_type || 'Drip irrigation';
  const hasCrop = Boolean(cropName);

  // Storage key for completed tasks isolated by user and farm
  const cacheKey = `krishvya_completed_tasks_${user?.id || 'anon'}_${farm?.id || 'default'}`;

  // Load completed tasks on mount from local storage and remote farm events
  useEffect(() => {
    let isMounted = true;
    try {
      const saved = localStorage.getItem(cacheKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && isMounted) {
          setCompletedTaskIds(new Set(parsed));
        }
      }
    } catch {}

    const syncWithHistory = async () => {
      if (!user?.id || !farm?.id) return;
      try {
        const events = await supabaseService.getFarmEvents(user.id, farm.id);
        if (events && isMounted) {
          const taskEventTitles = events
            .filter((e) => e.event_type === 'task_completed')
            .map((e) => e.description);

          setCompletedTaskIds((prev) => {
            const next = new Set(prev);
            intelligence.weeklyTasks.forEach((t) => {
              if (taskEventTitles.some((desc) => desc && desc.includes(t.title))) {
                next.add(t.id);
              }
            });
            return next;
          });
        }
      } catch (err) {
        console.warn('Failed to sync completed tasks with history:', err);
      }
    };

    syncWithHistory();
    return () => {
      isMounted = false;
    };
  }, [user?.id, farm?.id, cacheKey, intelligence.weeklyTasks]);

  // Handle Mark as Done
  const handleMarkAsDone = async (taskId: string, taskTitle: string) => {
    if (!user?.id || !farm?.id) return;
    setIsMarkingDone(taskId);

    try {
      const nextSet = new Set(completedTaskIds);
      nextSet.add(taskId);
      setCompletedTaskIds(nextSet);
      localStorage.setItem(cacheKey, JSON.stringify(Array.from(nextSet)));

      // Save to existing farm history system in Supabase
      await supabaseService.logFarmEvent(
        user.id,
        farm.id,
        'task_completed',
        `Completed task: ${taskTitle}`
      );
    } catch (err) {
      console.warn('Failed to mark task as done:', err);
    } finally {
      setIsMarkingDone(null);
    }
  };

  // Determine Today's Task
  // Priority: 1st uncompleted task of the week, or the primary action from central intelligence
  const todayTask = useMemo(() => {
    if (!hasCrop || intelligence.weeklyTasks.length === 0) return null;
    const uncompleted = intelligence.weeklyTasks.find((t) => !completedTaskIds.has(t.id));
    return uncompleted || intelligence.weeklyTasks[0];
  }, [hasCrop, intelligence.weeklyTasks, completedTaskIds]);

  // Dynamic "Why" generation grounded in real weather, soil, and crop
  const getTaskWhy = (task: typeof intelligence.weeklyTasks[0]) => {
    if (task.category === 'irrigation') {
      const rain = weatherData?.rainProbability ?? farm.weather?.rainProbability ?? 0;
      const moisture = farm.soil?.moisturePercentage;
      if (rain >= 50) {
        return `${rain}% rain expected in your area. Clearing drainage furrows prevents standing water from suffocating roots.`;
      }
      if (typeof moisture === 'number' && moisture > 0) {
        return `Current soil moisture is ${moisture}%. Checking root zone before running ${irrigationType} ensures water is applied only when needed.`;
      }
      return 'Checking root zone moisture ensures timely irrigation without waterlogging the roots.';
    }

    if (task.category === 'protection') {
      if (task.title.toLowerCase().includes('possible') || task.title.toLowerCase().includes('detected')) {
        return 'A potential crop issue was recorded in recent field scans. Early visual inspection confirms whether treatment is necessary.';
      }
      return 'Regular leaf scouting on random plants detects early caterpillar or sucking insect feeding before damage multiplies.';
    }

    if (task.category === 'fertilizer') {
      return 'Observing leaf canopy and root zone condition ensures nutrients are replenished before major growth shifts.';
    }

    return 'Tracking weekly field progress keeps your standing crop cycle on track for optimal harvest yield.';
  };

  // Priority badge styling: strictly 🟢 Routine, 🟡 Check, 🔴 Action needed
  const renderPriorityBadge = (task: typeof intelligence.weeklyTasks[0]) => {
    if (task.priority === 'high' || task.title.toLowerCase().includes('clear drainage') || task.title.toLowerCase().includes('detected')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-rose-50 text-rose-800 border border-rose-200">
          <span>🔴</span> Action needed
        </span>
      );
    }
    if (task.category === 'protection' || task.category === 'irrigation') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200">
          <span>🟡</span> Check
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
        <span>🟢</span> Routine
      </span>
    );
  };

  const renderCategoryIcon = (category: string) => {
    switch (category) {
      case 'irrigation':
        return <Droplets className="w-4 h-4 text-[#2563EB]" />;
      case 'protection':
        return <ShieldCheck className="w-4 h-4 text-[#D97706]" />;
      case 'fertilizer':
        return <Layers className="w-4 h-4 text-[#166534]" />;
      default:
        return <Sprout className="w-4 h-4 text-[#166534]" />;
    }
  };

  // Next Season Crop Rotation Options
  const rotationOptions = {
    rabi: [
      {
        crop: 'Chickpea / Bengal Gram (Chana)',
        duration: '100 - 110 days',
        waterReq: 'Low (2 irrigations)',
        benefit: 'Restores up to 40 kg/ha atmospheric nitrogen to soil for next Kharif season.',
        soilCompatibility: 'Excellent for loamy and clay loam soils.',
        season: 'Rabi (Winter)',
        isPrimary: true,
      },
      {
        crop: 'Wheat (High-Yield Grain)',
        duration: '115 - 125 days',
        waterReq: 'Medium-High (4-5 irrigations)',
        benefit: 'Stable grain yield and assured local MSP procurement.',
        soilCompatibility: 'Prefers clay and fertile alluvium.',
        season: 'Rabi (Winter)',
        isPrimary: false,
      },
      {
        crop: 'Mustard / Rapeseed',
        duration: '90 - 100 days',
        waterReq: 'Low (1-2 irrigations)',
        benefit: 'Natural bio-fumigation effect reducing soil-borne root wilt fungi.',
        soilCompatibility: 'Tolerates lighter sandy loam to heavy loam.',
        season: 'Rabi (Winter)',
        isPrimary: false,
      },
    ],
    zaid: [
      {
        crop: 'Green Gram (Moong)',
        duration: '60 - 65 days',
        waterReq: 'Low (Assured summer drip)',
        benefit: 'Short duration summer legume that enriches soil organic matter.',
        soilCompatibility: 'Well-drained loam or alluvial soils.',
        season: 'Zaid (Summer)',
        isPrimary: true,
      },
      {
        crop: 'Sesame (Til)',
        duration: '75 - 85 days',
        waterReq: 'Very Low',
        benefit: 'High heat tolerance during peak summer temperature spikes.',
        soilCompatibility: 'Light to medium sandy loam.',
        season: 'Zaid (Summer)',
        isPrimary: false,
      },
    ],
  };

  const currentRotationList = rotationOptions[selectedSeason];
  const primaryRotation = currentRotationList.find((r) => r.isPrimary) || currentRotationList[0];
  const secondaryRotations = currentRotationList.filter((r) => r !== primaryRotation);

  const totalTasks = intelligence.weeklyTasks.length;
  const completedCount = intelligence.weeklyTasks.filter((t) => completedTaskIds.has(t.id)).length;
  const progressPercent = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex font-sans antialiased text-[#1F2937]">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-12">
        {/* ========================================================================= */}
        {/* 1. HEADER                                                                 */}
        {/* ========================================================================= */}
        <header className="bg-white border-b border-[#E5E7EB] px-4 sm:px-8 py-4 sm:py-5 sticky top-0 z-20">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">📋</span>
                <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                  Farm Plan
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-[#6B7280] font-medium mt-1">
                Simple tasks for your farm this week.
              </p>

              {/* Selected Farm Context */}
              <div className="flex items-center gap-2 text-xs text-gray-600 font-medium mt-2 flex-wrap">
                <span className="font-bold text-[#166534]">
                  🌱 {cropName || 'Standing Crop'}
                </span>
                <span className="text-gray-300">•</span>
                <span className="text-gray-700 font-semibold">{cropStage || 'Growth Stage'}</span>
                <span className="text-gray-300">•</span>
                <span className="text-gray-600">{areaDisplay}</span>
                <span className="text-gray-300">•</span>
                <span className="text-gray-600">{irrigationType}</span>
                <span className="text-gray-300">•</span>
                <span className="text-gray-500 font-medium">{farm.name || 'Selected Farm'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link
                to="/history"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-earth-100 hover:bg-earth-200 text-gray-700 border border-earth-200 transition-colors"
              >
                <Clock className="w-3.5 h-3.5 text-gray-600" />
                <span>Farm History</span>
              </Link>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Standing Crop Empty State */}
          {!hasCrop ? (
            <Card className="p-6 bg-white border border-[#E5E7EB] shadow-soft">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0 text-xl">
                    🌱
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base text-gray-900">
                      No weekly plan yet
                    </h3>
                    <p className="text-xs text-[#6B7280] font-medium mt-0.5">
                      Add your crop stage and farm details to create a personalized plan.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    onClick={() => navigate('/farm')}
                    variant="primary"
                    size="sm"
                    className="bg-[#166534] hover:bg-[#14532d] text-white font-bold text-xs"
                  >
                    Update Farm Details
                  </Button>
                  <Button
                    onClick={() => navigate('/ai-advisor')}
                    variant="outline"
                    size="sm"
                    className="text-xs font-bold"
                  >
                    Ask KRISHVYA
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <>
              {/* ========================================================================= */}
              {/* 2. TODAY FIRST: TODAY'S TASK                                              */}
              {/* ========================================================================= */}
              <div className="p-6 sm:p-7 rounded-3xl bg-[#EAF4EC] border border-[#166534]/20 shadow-soft">
                <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
                  <span className="text-xs font-black text-[#166534] uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#166534]" />
                    🌟 TODAY'S TASK
                  </span>
                  {todayTask && renderPriorityBadge(todayTask)}
                </div>

                {todayTask ? (
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div>
                        <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                          <span>{renderCategoryIcon(todayTask.category)}</span>
                          <span>{todayTask.title}</span>
                        </h2>
                        <p className="text-xs sm:text-sm text-gray-800 font-semibold mt-1">
                          "{todayTask.description}"
                        </p>
                      </div>

                      <div className="shrink-0">
                        {completedTaskIds.has(todayTask.id) ? (
                          <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold bg-[#166534] text-white shadow-2xs">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>✓ Completed</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={isMarkingDone === todayTask.id}
                            onClick={() => handleMarkAsDone(todayTask.id, todayTask.title)}
                            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#166534] hover:bg-[#14532d] text-white shadow-xs transition-all cursor-pointer"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>{isMarkingDone === todayTask.id ? 'Saving...' : '✓ Mark as Done'}</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="p-3.5 bg-white/80 rounded-2xl border border-[#166534]/15 text-xs text-gray-700">
                      <strong className="text-gray-900 font-extrabold block mb-0.5">Why:</strong>
                      {getTaskWhy(todayTask)}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-white/80 rounded-2xl border border-[#166534]/15">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🟢</span>
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm">No urgent task today</h4>
                        <p className="text-xs text-gray-600 mt-0.5">
                          Continue routine crop observation.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ========================================================================= */}
              {/* 8. WEEKLY PROGRESS                                                        */}
              {/* ========================================================================= */}
              <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[#E5E7EB] shadow-soft">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">📊</span>
                    <h3 className="font-black text-gray-900 text-sm sm:text-base tracking-tight">
                      WEEKLY PROGRESS
                    </h3>
                  </div>
                  <span className="text-xs font-extrabold text-[#166534] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                    {completedCount} / {totalTasks} tasks completed ({progressPercent}%)
                  </span>
                </div>

                <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden p-0.5 border border-gray-200 mt-2">
                  <div
                    className="bg-[#166534] h-full rounded-full transition-all duration-700"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* ========================================================================= */}
              {/* 3. THIS WEEK (WEEKLY TASKS LIST)                                          */}
              {/* ========================================================================= */}
              <div className="p-6 sm:p-7 rounded-3xl bg-white border border-[#E5E7EB] shadow-soft space-y-4">
                <div className="flex items-center justify-between border-b border-earth-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#166534]" />
                    <div>
                      <h3 className="font-black text-gray-900 text-base tracking-tight">
                        What Should I Do This Week?
                      </h3>
                      <p className="text-[11px] text-[#6B7280] font-medium">
                        Prioritized farming checklist for {farm.name || 'your farm'}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-earth-100 text-gray-700 px-2.5 py-1 rounded-full border border-earth-200">
                    Weekly Checklist
                  </span>
                </div>

                <div className="space-y-3">
                  {intelligence.weeklyTasks.map((task) => {
                    const isDone = completedTaskIds.has(task.id);
                    const isPathogenTask = task.title.toLowerCase().includes('possible') || task.title.toLowerCase().includes('detected');

                    return (
                      <div
                        key={task.id}
                        className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                          isDone
                            ? 'bg-earth-50/50 border-earth-200/80 opacity-80'
                            : task.priority === 'high'
                            ? 'bg-rose-50/30 border-rose-200/80 shadow-2xs'
                            : 'bg-white border-[#E5E7EB] hover:border-earth-300'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="space-y-1.5 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-black text-gray-900 bg-earth-100 px-2.5 py-0.5 rounded-lg border border-earth-200">
                                {task.day.toUpperCase()}
                              </span>
                              <div className="flex items-center gap-1.5">
                                {renderCategoryIcon(task.category)}
                                <span className="font-extrabold text-sm sm:text-base text-gray-900">
                                  {task.title}
                                </span>
                              </div>
                              {renderPriorityBadge(task)}
                            </div>

                            <p className="text-xs sm:text-sm text-gray-700 font-medium leading-relaxed">
                              {task.description}
                            </p>

                            <p className="text-xs text-gray-500 font-medium">
                              <strong className="text-gray-700 font-bold">Why:</strong> {getTaskWhy(task)}
                            </p>

                            {/* Direct agronomic links if pathogen detected */}
                            {isPathogenTask && (
                              <div className="pt-1 flex items-center gap-2 flex-wrap">
                                <Button
                                  onClick={() => navigate('/disease')}
                                  variant="primary"
                                  size="sm"
                                  icon={<Camera className="w-3.5 h-3.5" />}
                                  className="bg-[#166534] hover:bg-[#14532d] text-white text-xs font-bold py-1 px-3"
                                >
                                  Check Plant
                                </Button>
                                <Button
                                  onClick={() => navigate('/ai-advisor')}
                                  variant="outline"
                                  size="sm"
                                  icon={<MessageSquare className="w-3.5 h-3.5" />}
                                  className="text-xs font-bold py-1 px-3"
                                >
                                  Ask KRISHVYA
                                </Button>
                              </div>
                            )}
                          </div>

                          <div className="shrink-0 sm:self-center">
                            {isDone ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>✓ Completed</span>
                              </span>
                            ) : (
                              <button
                                type="button"
                                disabled={isMarkingDone === task.id}
                                onClick={() => handleMarkAsDone(task.id, task.title)}
                                className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#166534] hover:bg-[#14532d] text-white shadow-2xs transition-all cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>{isMarkingDone === task.id ? 'Saving...' : 'Mark as Done'}</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ========================================================================= */}
              {/* 9. PLAN YOUR NEXT CROP (CROP ROTATION)                                    */}
              {/* ========================================================================= */}
              <div className="p-6 sm:p-7 rounded-3xl bg-white border border-[#E5E7EB] shadow-soft space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-earth-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🌾</span>
                      <h3 className="font-black text-gray-900 text-base sm:text-lg tracking-tight">
                        Plan Your Next Crop
                      </h3>
                    </div>
                    <p className="text-xs text-[#6B7280] font-medium mt-0.5">
                      Plan ahead to preserve soil microbiome and break pest cycles after {cropName || 'standing crop'}.
                    </p>
                  </div>

                  {/* Season Toggle */}
                  <div className="flex items-center gap-1 bg-earth-100 p-1 rounded-xl text-xs font-bold text-gray-700 w-fit">
                    <button
                      type="button"
                      onClick={() => setSelectedSeason('rabi')}
                      className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                        selectedSeason === 'rabi' ? 'bg-white text-gray-900 shadow-2xs font-extrabold' : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Rabi (Winter)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedSeason('zaid')}
                      className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                        selectedSeason === 'zaid' ? 'bg-white text-gray-900 shadow-2xs font-extrabold' : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Zaid (Summer)
                    </button>
                  </div>
                </div>

                {/* Primary Suggested Crop Card */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50/60 to-white border border-emerald-200/90 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs font-bold text-[#166534] bg-emerald-100/70 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      Primary Suggestion • {primaryRotation.season}
                    </span>
                    <span className="text-xs font-semibold text-gray-500 bg-white px-2.5 py-0.5 rounded-full border border-earth-200">
                      {primaryRotation.duration}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-lg font-black text-gray-900 flex items-center gap-2">
                      <span>🌱</span>
                      <span>{primaryRotation.crop}</span>
                    </h4>
                    <p className="text-xs text-[#6B7280] font-medium mt-1">
                      Water requirement: <strong>{primaryRotation.waterReq}</strong> • Soil suitability: <strong>{primaryRotation.soilCompatibility}</strong>
                    </p>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-emerald-100 text-xs text-gray-700 leading-relaxed">
                    <strong className="text-[#166534] block mb-0.5">Rotation Benefit:</strong>
                    {primaryRotation.benefit}
                  </div>

                  <div className="pt-1 flex items-center justify-between text-xs flex-wrap gap-2">
                    <Link
                      to="/ai-advisor"
                      className="text-[#166534] font-bold hover:underline inline-flex items-center gap-1"
                    >
                      Ask AI about growing {primaryRotation.crop.split(' ')[0]} <ArrowRight className="w-3 h-3" />
                    </Link>

                    {secondaryRotations.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowOtherRotationOptions((prev) => !prev)}
                        className="text-gray-600 hover:text-gray-900 font-bold inline-flex items-center gap-1 text-xs cursor-pointer"
                      >
                        <span>{showOtherRotationOptions ? 'Hide other options' : 'View Other Options'}</span>
                        {showOtherRotationOptions ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Secondary Compact Rotation Options */}
                {showOtherRotationOptions && secondaryRotations.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {secondaryRotations.map((alt) => (
                      <div
                        key={alt.crop}
                        className="p-4 rounded-xl bg-white border border-[#E5E7EB] hover:border-earth-300 transition-colors space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-gray-900">{alt.crop}</span>
                          <span className="text-[10px] text-gray-500 font-medium">{alt.duration}</span>
                        </div>
                        <p className="text-gray-600">
                          Water: <strong>{alt.waterReq}</strong>
                        </p>
                        <p className="text-gray-700 font-medium">
                          {alt.benefit}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ========================================================================= */}
              {/* 11. ASK KRISHVYA BANNER                                                   */}
              {/* ========================================================================= */}
              <div className="p-6 rounded-3xl bg-white border border-[#E5E7EB] shadow-soft flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center shrink-0 text-2xl">
                    🤖
                  </div>
                  <div>
                    <h4 className="text-base font-black text-gray-900 tracking-tight">
                      Not sure what to do?
                    </h4>
                    <p className="text-xs text-[#6B7280] font-medium mt-0.5 max-w-xl">
                      Ask KRISHVYA about your crop, current stage, soil status, or any pest doubts with automatic farm context.
                    </p>
                  </div>
                </div>

                <Button
                  onClick={() => navigate('/ai-advisor')}
                  variant="primary"
                  size="md"
                  icon={<MessageSquare className="w-4 h-4" />}
                  className="bg-[#166534] hover:bg-[#14532d] text-white font-bold text-xs shrink-0 shadow-xs"
                >
                  Ask KRISHVYA
                </Button>
              </div>
            </>
          )}
        </main>
      </div>

      <MobileBottomNav />
    </div>
  );
};
