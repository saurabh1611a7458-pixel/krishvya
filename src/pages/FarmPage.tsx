import React, { useState, useEffect, useMemo } from 'react';
import { Sidebar } from '../components/common/Sidebar';
import { MobileBottomNav } from '../components/common/MobileBottomNav';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { useFarm } from '../context/FarmContext';
import { useLanguage } from '../context/LanguageContext';
import { RealSatelliteMap } from '../components/satellite/RealSatelliteMap';
import { LocationSearchInput } from '../components/common/LocationSearchInput';
import {
  calculatePolygonAreaAcres,
  calculateCentroid,
  generateDefaultBoundary,
} from '../utils/geoUtils';
import { calculateDynamicCropStage } from '../utils/cropStageUtils';
import { calculateFarmHealthScore } from '../utils/healthScoreUtils';
import { api } from '../services/api';
import { reverseGeocode, searchGlobalLocations } from '../services/geocodingService';
import { supabaseService } from '../services/supabaseService';
import {
  Trees,
  Edit,
  Check,
  X,
  RotateCcw,
  Plus,
  Navigation,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Sprout,
  Sparkles,
  User,
  Trash2,
  Activity,
  BarChart2,
  Clock,
} from 'lucide-react';

export const FarmPage: React.FC = () => {
  const {
    farm,
    farms,
    selectedFarmId,
    selectFarm,
    user,
    updateFarm,
    createFarm,
    deleteFarm,
    isLoading,
    isSyncingAuth,
    problemCases,
  } = useFarm();
  const { t } = useLanguage();

  // Selected farm coordinates
  const farmLat = typeof farm.location?.latitude === 'number' ? farm.location.latitude : 0;
  const farmLon = typeof farm.location?.longitude === 'number' ? farm.location.longitude : 0;
  const hasCoordinates = Boolean(farmLat !== 0 && farmLon !== 0);

  // Boundary state: check if actual boundary vertices exist
  const hasSavedBoundary = Boolean(
    farm.boundaryVertices && farm.boundaryVertices.length >= 3
  );

  const [workingBoundary, setWorkingBoundary] = useState<Array<[number, number]>>(() => {
    if (farm.boundaryVertices && farm.boundaryVertices.length >= 3) {
      return farm.boundaryVertices;
    }
    return [];
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [userGpsLocation, setUserGpsLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Edit Farm Details Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [modalLat, setModalLat] = useState<number>(farmLat);
  const [modalLon, setModalLon] = useState<number>(farmLon);
  const [modalBoundary, setModalBoundary] = useState<Array<[number, number]>>([]);
  const [isModalLocating, setIsModalLocating] = useState<boolean>(false);

  const [editFormData, setEditFormData] = useState({
    name: farm.name || '',
    address: farm.location?.address || farm.location_address || '',
    district: farm.location?.district || '',
    state: farm.location?.state || '',
    size: farm.size || farm.field_area || 0,
    cropName: farm.crop?.name || farm.crop_variety || '',
    cropVariety: farm.crop?.variety || farm.crop_variety || '',
    sowingDate: farm.crop?.sowingDate || farm.sowing_date || '',
    soilType: farm.soil?.soilType || farm.soil_type || '',
    irrigationType: farm.irrigationType || farm.irrigation_type || '',
  });

  // Open Edit Modal with fresh coordinates and boundary
  const handleOpenEditModal = () => {
    const lat = farm.location?.latitude || farm.latitude || 0;
    const lon = farm.location?.longitude || farm.longitude || 0;
    const farmArea = farm.field_area || farm.size || 0;
    setEditFormData({
      name: farm.name || farm.farm_name || '',
      address: farm.location?.address || farm.location_address || '',
      district: farm.location?.district || '',
      state: farm.location?.state || '',
      size: farmArea,
      cropName: farm.crop?.name || farm.crop_variety || '',
      cropVariety: farm.crop?.variety || farm.crop_variety || '',
      sowingDate: farm.crop?.sowingDate || farm.sowing_date || '',
      soilType: farm.soil?.soilType || farm.soil_type || '',
      irrigationType: farm.irrigationType || farm.irrigation_type || '',
    });
    setModalLat(lat);
    setModalLon(lon);
    setModalBoundary(
      workingBoundary.length >= 3
        ? workingBoundary
        : lat !== 0 && lon !== 0 && farmArea > 0
        ? generateDefaultBoundary(lat, lon, farmArea)
        : []
    );
    setIsEditModalOpen(true);
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 150);
  };

  // Dynamic Crop Stage inside Modal
  const modalCropStage = useMemo(() => {
    return calculateDynamicCropStage(
      editFormData.cropName,
      editFormData.cropVariety,
      editFormData.sowingDate
    );
  }, [editFormData.cropName, editFormData.cropVariety, editFormData.sowingDate]);

  // Handle Location Search in Modal Map
  const handleModalSelectLocation = (res: { lat: number; lon: number; displayName: string; district?: string; state?: string }) => {
    setModalLat(res.lat);
    setModalLon(res.lon);
    setEditFormData((prev) => ({
      ...prev,
      address: res.displayName,
      district: res.district || prev.district,
      state: res.state || prev.state,
    }));
    const curSize = Number(editFormData.size) || farm.size || 1;
    setModalBoundary(generateDefaultBoundary(res.lat, res.lon, curSize));
  };

  // Handle GPS Acquisition in Modal Map
  const handleModalAcquireGps = () => {
    if (!navigator.geolocation) return;
    setIsModalLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setModalLat(latitude);
        setModalLon(longitude);
        const curSize = Number(editFormData.size) || farm.size || 1;
        setModalBoundary(generateDefaultBoundary(latitude, longitude, curSize));
        try {
          const rev = await reverseGeocode(latitude, longitude);
          if (rev) {
            setEditFormData((prev) => ({
              ...prev,
              address: rev.displayName,
              district: rev.district || prev.district,
              state: rev.state || prev.state,
            }));
          }
        } catch (revErr) {
          console.warn('GPS reverse geocode error:', revErr);
        }
        setIsModalLocating(false);
      },
      () => {
        setIsModalLocating(false);
      },
      { enableHighAccuracy: true }
    );
  };

  // Add New Farm Modal State - No fabricated default values
  const [isAddFarmModalOpen, setIsAddFarmModalOpen] = useState(false);
  const [newFarmFormData, setNewFarmFormData] = useState({
    name: '',
    address: '',
    district: user.district || '',
    state: user.state || '',
    size: '' as string | number,
    cropName: '',
    cropVariety: '',
    sowingDate: '',
    soilType: '',
    irrigationType: '',
    lat: 0,
    lon: 0,
  });

  // Dynamic farm activities state & listener
  const [farmEvents, setFarmEvents] = useState<any[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadEvents = async () => {
      const ownerId = user.id;
      if (!ownerId || !farm.id) {
        setFarmEvents([]);
        return;
      }
      setLoadingActivities(true);
      try {
        const events = await supabaseService.getFarmEvents(ownerId, farm.id);
        if (isMounted) {
          setFarmEvents(events || []);
        }
      } catch (e) {
        if (isMounted) setFarmEvents([]);
      } finally {
        if (isMounted) setLoadingActivities(false);
      }
    };
    loadEvents();
    return () => {
      isMounted = false;
    };
  }, [user.id, farm.id]);

  const activeFarmCases = useMemo(() => {
    return (problemCases || []).filter((c) => c.farmId === farm.id && c.status !== 'resolved');
  }, [problemCases, farm.id]);

  const allActivities = useMemo(() => {
    const list: Array<{ id: string; title: string; description?: string; timestamp: string; type: string }> = [];

    // 1. Supabase Farm Events
    farmEvents.forEach((ev) => {
      list.push({
        id: ev.id || `ev_${Math.random()}`,
        title: ev.title || ev.event_type || 'Farm Event',
        description: ev.description || '',
        timestamp: ev.created_at || new Date().toISOString(),
        type: 'event',
      });
    });

    // 2. Problem cases reported for this parcel
    (problemCases || [])
      .filter((c) => c.farmId === farm.id)
      .forEach((c) => {
        list.push({
          id: c.id,
          title: c.title || `${c.category.replace(/_/g, ' ')}`,
          description: c.description || c.aiRecommendation || '',
          timestamp: c.createdAt,
          type: 'problem',
        });
      });

    // 3. Sowing event if registered
    if (farm.crop?.sowingDate || farm.sowing_date) {
      const sDate = farm.crop?.sowingDate || farm.sowing_date;
      list.push({
        id: `sowing_${farm.id}`,
        title: `${farm.crop?.name || farm.crop_variety || 'Crop'} Sowing Recorded`,
        description: `Sowing date registered: ${sDate}${farm.crop?.variety ? ` (Variety: ${farm.crop.variety})` : ''}`,
        timestamp: sDate || new Date().toISOString(),
        type: 'sowing',
      });
    }

    return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [farmEvents, problemCases, farm.id, farm.crop?.name, farm.crop?.variety, farm.crop?.sowingDate, farm.sowing_date, farm.crop_variety]);

  // Sync working boundary and modal coordinates whenever farm changes
  useEffect(() => {
    if (farm.boundaryVertices && farm.boundaryVertices.length >= 3) {
      setWorkingBoundary(farm.boundaryVertices);
    } else {
      setWorkingBoundary([]);
    }
    // Update edit form data when farm changes (only if modal not actively open)
    if (!isEditModalOpen) {
      setEditFormData({
        name: farm.name || farm.farm_name || '',
        address: farm.location?.address || farm.location_address || '',
        district: farm.location?.district || '',
        state: farm.location?.state || '',
        size: farm.size || farm.field_area || 0,
        cropName: farm.crop?.name || farm.crop_variety || '',
        cropVariety: farm.crop?.variety || farm.crop_variety || '',
        sowingDate: farm.crop?.sowingDate || farm.sowing_date || '',
        soilType: farm.soil?.soilType || farm.soil_type || '',
        irrigationType: farm.irrigationType || farm.irrigation_type || '',
      });
      setModalLat(farm.location?.latitude || farm.latitude || 0);
      setModalLon(farm.location?.longitude || farm.longitude || 0);
    }
  }, [farm, isEditModalOpen]);

  // Live acreage calculated dynamically from the polygon vertices when present
  const liveBoundaryAcreage = useMemo(() => {
    if (workingBoundary.length >= 3) {
      return calculatePolygonAreaAcres(workingBoundary);
    }
    return 0;
  }, [workingBoundary]);

  // Effective acreage to display: boundary acreage if available, otherwise saved farm size
  const displayAcreage = liveBoundaryAcreage > 0 ? liveBoundaryAcreage : farm.size;

  // Live centroid
  const liveCentroid = useMemo(() => {
    if (workingBoundary.length >= 3) {
      return calculateCentroid(workingBoundary);
    }
    return [farmLat, farmLon] as [number, number];
  }, [workingBoundary, farmLat, farmLon]);

  // Dynamic Crop Growth Stage
  const cropStageInfo = useMemo(() => {
    return calculateDynamicCropStage(
      farm.crop?.name,
      farm.crop?.variety,
      farm.crop?.sowingDate
    );
  }, [farm.crop?.name, farm.crop?.variety, farm.crop?.sowingDate]);

  // Dynamic Farm Health Index & Breakdown
  const healthBreakdown = useMemo(() => {
    return calculateFarmHealthScore(farm);
  }, [farm]);

  // Handle vertex updates as user drags corners on satellite map
  const handleBoundaryChange = (newBoundary: Array<[number, number]>) => {
    setWorkingBoundary(newBoundary);
  };

  // Add an extra corner vertex (interpolated midpoint)
  const handleAddCorner = () => {
    if (workingBoundary.length < 3) return;
    const p1 = workingBoundary[0];
    const p2 = workingBoundary[1];
    const midLat = parseFloat(((p1[0] + p2[0]) / 2 + 0.00015).toFixed(6));
    const midLon = parseFloat(((p1[1] + p2[1]) / 2 + 0.00015).toFixed(6));
    const updated = [p1, [midLat, midLon] as [number, number], ...workingBoundary.slice(1)];
    setWorkingBoundary(updated);
  };

  // Initialize boundary if none exists
  const handleStartAddBoundary = () => {
    if (!hasCoordinates) {
      handleOpenEditModal();
      return;
    }
    const defaultSize = farm.size > 0 ? farm.size : 1;
    const initial = generateDefaultBoundary(farmLat, farmLon, defaultSize);
    setWorkingBoundary(initial);
    setIsEditing(true);
  };

  // Reset to original saved boundary
  const handleResetBoundary = () => {
    if (farm.boundaryVertices && farm.boundaryVertices.length >= 3) {
      setWorkingBoundary(farm.boundaryVertices);
    } else {
      setWorkingBoundary([]);
    }
  };

  // Save boundary to FarmContext (syncs to Supabase & localStorage)
  const handleSaveBoundary = async () => {
    setIsSaving(true);
    try {
      const newCentroid = calculateCentroid(workingBoundary);
      const newSize = calculatePolygonAreaAcres(workingBoundary);

      await updateFarm({
        size: newSize > 0 ? newSize : farm.size,
        boundaryVertices: workingBoundary,
        location: {
          ...farm.location,
          latitude: newCentroid[0],
          longitude: newCentroid[1],
          boundaryVertices: workingBoundary,
        },
      });

      // Log boundary update event
      if (user.id && farm.id) {
        supabaseService.logFarmEvent(
          user.id,
          farm.id,
          'boundary_updated',
          `Mapped ${workingBoundary.length} boundary vertices (${newSize.toFixed(2)} acres)`
        ).catch(console.warn);
      }

      setSaveSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      console.warn('Failed to save boundary:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Save Farm Details from Edit Modal - Supabase first flow
  const handleSaveFarmDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const newSize = Number(editFormData.size) || farm.size || 0;
      let targetLat = modalLat;
      let targetLon = modalLon;
      let targetBoundary = modalBoundary;

      // Forward-geocode address if user typed address manually and coordinates weren't updated
      const enteredAddr = editFormData.address.trim();
      const prevAddr = farm.location?.address?.trim();
      if (
        enteredAddr &&
        (targetLat === 0 ||
          targetLon === 0 ||
          (enteredAddr !== prevAddr && targetLat === farmLat && targetLon === farmLon))
      ) {
        try {
          const geoRes = await searchGlobalLocations(enteredAddr);
          if (geoRes && geoRes.length > 0) {
            targetLat = geoRes[0].lat;
            targetLon = geoRes[0].lon;
            targetBoundary = generateDefaultBoundary(targetLat, targetLon, newSize > 0 ? newSize : 1);
          }
        } catch (geoErr) {
          console.warn('Geocoding fallback during save:', geoErr);
        }
      }

      // Check boundary alignment with target coordinates
      if (targetLat !== 0 && targetLon !== 0) {
        if (targetBoundary.length < 3 && newSize > 0) {
          targetBoundary = generateDefaultBoundary(targetLat, targetLon, newSize);
        } else if (targetBoundary.length >= 3) {
          const c = calculateCentroid(targetBoundary);
          const dist = Math.hypot(c[0] - targetLat, c[1] - targetLon);
          if (dist > 0.05 && newSize > 0) {
            targetBoundary = generateDefaultBoundary(targetLat, targetLon, newSize);
          }
        }
      }

      // Supabase UPDATE first, then refreshes FarmContext
      await updateFarm({
        name: editFormData.name.trim() || farm.name,
        size: newSize,
        irrigationType: (editFormData.irrigationType as any) || '',
        location: {
          ...farm.location,
          address: enteredAddr || farm.location.address,
          district: editFormData.district.trim() || farm.location.district,
          state: editFormData.state.trim() || farm.location.state,
          latitude: targetLat,
          longitude: targetLon,
          boundaryVertices: targetBoundary.length >= 3 ? targetBoundary : undefined,
        },
        boundaryVertices: targetBoundary.length >= 3 ? targetBoundary : undefined,
        crop: {
          ...farm.crop,
          name: editFormData.cropName.trim(),
          variety: editFormData.cropVariety.trim(),
          sowingDate: editFormData.sowingDate,
          stage: editFormData.sowingDate ? modalCropStage.stage : '',
        },
        soil: {
          ...farm.soil,
          soilType: editFormData.soilType.trim(),
        },
      });

      if (targetBoundary.length >= 3) {
        setWorkingBoundary(targetBoundary);
      }

      // Log update event
      if (user.id && farm.id) {
        supabaseService.logFarmEvent(
          user.id,
          farm.id,
          'farm_updated',
          `Updated properties for ${editFormData.name.trim() || farm.name}`
        ).catch(console.warn);
      }

      // Refresh live weather for updated coordinates
      if (targetLat !== 0 && targetLon !== 0) {
        api
          .getLiveWeather(targetLat, targetLon, farm.id)
          .then((wRes) => {
            if (wRes.success && wRes.data) {
              updateFarm({
                weather: {
                  ...farm.weather,
                  temperature: wRes.data.temperature,
                  condition: wRes.data.condition,
                  humidity: wRes.data.humidity,
                  rainProbability: wRes.data.rainProbability24h || farm.weather.rainProbability,
                  windSpeedKmh: wRes.data.windSpeedKmh,
                  advice: wRes.data.advice || farm.weather.advice,
                },
              });
            }
          })
          .catch((err) => console.warn('Weather sync delayed:', err));
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
      setIsEditModalOpen(false);
    } catch (err) {
      console.warn('Failed to save farm details:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Add New Farm - Supabase first flow
  const handleCreateNewFarm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      let lat = newFarmFormData.lat;
      let lon = newFarmFormData.lon;
      const addr = newFarmFormData.address.trim();
      if ((lat === 0 || lon === 0) && addr) {
        try {
          const geo = await searchGlobalLocations(addr);
          if (geo && geo.length > 0) {
            lat = geo[0].lat;
            lon = geo[0].lon;
          }
        } catch (e) {}
      }

      const farmSize = Number(newFarmFormData.size) || 0;
      const boundary = lat !== 0 && lon !== 0 && farmSize > 0 ? generateDefaultBoundary(lat, lon, farmSize) : undefined;

      const created = await createFarm({
        name: newFarmFormData.name.trim() || 'My Farm Parcel',
        size: farmSize,
        irrigationType: (newFarmFormData.irrigationType as any) || undefined,
        boundaryVertices: boundary,
        location: {
          address: addr || (newFarmFormData.district ? `${newFarmFormData.district}, ${newFarmFormData.state}` : ''),
          district: newFarmFormData.district.trim() || user.district || '',
          state: newFarmFormData.state.trim() || user.state || '',
          latitude: lat,
          longitude: lon,
          boundaryVertices: boundary,
        },
        crop: {
          id: `crop_${Date.now()}`,
          name: newFarmFormData.cropName.trim(),
          variety: newFarmFormData.cropVariety.trim(),
          stage: newFarmFormData.sowingDate ? 'Seedling' : '',
          sowingDate: newFarmFormData.sowingDate,
        },
        soil: {
          healthScore: 0,
          nitrogen: 'Medium',
          phosphorus: 'Medium',
          potassium: 'Medium',
          ph: 7.0,
          organicCarbon: '',
          moisturePercentage: 0,
          soilType: newFarmFormData.soilType.trim(),
        },
      });

      if (created && created.id) {
        selectFarm(created.id);
      }

      // Log creation event
      if (user.id && created?.id) {
        supabaseService.logFarmEvent(
          user.id,
          created.id,
          'farm_created',
          `Registered new parcel ${created.name}`
        ).catch(console.warn);
      }

      setIsAddFarmModalOpen(false);
      setNewFarmFormData({
        name: '',
        address: '',
        district: user.district || '',
        state: user.state || '',
        size: '',
        cropName: '',
        cropVariety: '',
        sowingDate: '',
        soilType: '',
        irrigationType: '',
        lat: 0,
        lon: 0,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      console.warn('Failed to create new farm:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Acquire farmer's real live GPS to center boundary
  const handleAcquireGps = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setUserGpsLocation({ lat: latitude, lon: longitude });

        let resolvedAddress = farm.location?.address || '';
        let resolvedDistrict = farm.location?.district || '';
        let resolvedState = farm.location?.state || '';
        try {
          const rev = await reverseGeocode(latitude, longitude);
          if (rev) {
            resolvedAddress = rev.displayName;
            resolvedDistrict = rev.district || resolvedDistrict;
            resolvedState = rev.state || resolvedState;
          }
        } catch (revErr) {
          console.warn('GPS reverse geocode error:', revErr);
        }

        // Update location coordinates and address in farm
        await updateFarm({
          location: {
            ...farm.location,
            latitude,
            longitude,
            address: resolvedAddress,
            district: resolvedDistrict,
            state: resolvedState,
          },
        });

        // Automatically refresh weather for GPS position
        try {
          const wRes = await api.getLiveWeather(latitude, longitude, farm.id);
          if (wRes.success && wRes.data) {
            await updateFarm({
              weather: {
                ...farm.weather,
                temperature: wRes.data.temperature,
                condition: wRes.data.condition,
                humidity: wRes.data.humidity,
                rainProbability: wRes.data.rainProbability24h || farm.weather.rainProbability,
                windSpeedKmh: wRes.data.windSpeedKmh,
                advice: wRes.data.advice || farm.weather.advice,
              },
            });
          }
        } catch (e) {
          console.warn('Weather sync delayed:', e);
        }


        if (isEditing) {
          const newBoundary = generateDefaultBoundary(latitude, longitude, displayAcreage);
          setWorkingBoundary(newBoundary);
        }
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
      },
      { enableHighAccuracy: true }
    );
  };

  // Handle Location Selected from Map Search Bar
  const handleSelectLocation = async (res: { lat: number; lon: number; displayName: string; district?: string; state?: string }) => {
    try {
      // 1. Update Farm coordinates & location in Supabase & context
      await updateFarm({
        location: {
          ...farm.location,
          latitude: res.lat,
          longitude: res.lon,
          address: res.displayName,
          district: res.district || farm.location.district,
          state: res.state || farm.location.state,
        },
      });

      // If editing boundary, center at new location
      if (isEditing || workingBoundary.length >= 3) {
        const updatedBoundary = generateDefaultBoundary(res.lat, res.lon, displayAcreage);
        setWorkingBoundary(updatedBoundary);
      }

      // 2. Fetch updated live weather for the new location
      const weatherRes = await api.getLiveWeather(res.lat, res.lon, farm.id);
      if (weatherRes.success && weatherRes.data) {
        await updateFarm({
          weather: {
            ...farm.weather,
            temperature: weatherRes.data.temperature,
            condition: weatherRes.data.condition,
            humidity: weatherRes.data.humidity,
            rainProbability: weatherRes.data.rainProbability24h || farm.weather.rainProbability,
            windSpeedKmh: weatherRes.data.windSpeedKmh,
            advice: weatherRes.data.advice || farm.weather.advice,
          },
        });
      }
    } catch (err) {
      console.warn('Failed to update location on search:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBFBF7] flex">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-10">
        {/* Header with dynamic user welcome and multi-user isolation switcher */}
        <header className="bg-white border-b border-earth-200/80 px-4 sm:px-8 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sticky top-0 z-20">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <Trees className="w-5 h-5 text-krishi-700" />
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                {t('myFarm')}
              </h1>

              {/* Dynamic User Welcome Badge - Zero Hardcoded Names */}
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-krishi-50 text-krishi-900 border border-krishi-200">
                <User className="w-3.5 h-3.5 text-krishi-600" />
                <span>{user.name ? `Welcome, ${user.name}` : (user.email ? `User: ${user.email}` : 'Authenticated')}</span>
              </span>

              {saveSuccess && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 animate-in fade-in">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Boundary Saved!
                </span>
              )}
            </div>

            <p className="text-xs text-gray-500 mt-1">
              Precision space satellite boundary & live telemetry for{' '}
              <strong className="text-gray-800 font-semibold">{farm.name || 'Your Farm'}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-start sm:justify-end">
            {farms.length > 0 ? (
              <>
                {/* GPS Location Button */}
                <button
                  onClick={handleAcquireGps}
                  disabled={isLocating}
                  type="button"
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
                    userGpsLocation
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                      : 'bg-earth-100 hover:bg-earth-200 text-gray-700'
                  }`}
                  title="Acquire live GPS coordinates"
                >
                  <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
                  <span>{isLocating ? 'Locating...' : userGpsLocation ? '📍 GPS Linked' : '📍 GPS Fix'}</span>
                </button>

                {/* Edit / Save Boundary Toggle */}
                {!isEditing ? (
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<Edit className="w-3.5 h-3.5" />}
                    onClick={() => {
                      if (workingBoundary.length < 3) {
                        handleStartAddBoundary();
                      } else {
                        setIsEditing(true);
                      }
                    }}
                    className="bg-krishi-700 hover:bg-krishi-800 text-white shadow-xs"
                  >
                    {workingBoundary.length >= 3 ? 'Edit Field Boundary' : 'Add Field Boundary'}
                  </Button>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<X className="w-3.5 h-3.5" />}
                      onClick={() => {
                        handleResetBoundary();
                        setIsEditing(false);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      icon={<Check className="w-3.5 h-3.5" />}
                      onClick={handleSaveBoundary}
                      disabled={isSaving}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs font-bold"
                    >
                      {isSaving ? 'Saving...' : 'Save Boundary'}
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <Button
                variant="primary"
                size="sm"
                icon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => setIsAddFarmModalOpen(true)}
                className="bg-krishi-700 hover:bg-krishi-800 text-white shadow-xs font-bold text-xs"
              >
                + Add Your Farm
              </Button>
            )}
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          {(isLoading || isSyncingAuth) ? (
            /* Loading State */
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-earth-200 text-center min-h-[400px] shadow-soft">
              <div className="w-12 h-12 border-4 border-krishi-700 border-t-transparent rounded-full animate-spin mb-4" />
              <h3 className="text-lg font-bold text-gray-900">Loading your farm...</h3>
              <p className="text-xs text-gray-500 mt-1">Retrieving farm parcels & live satellite telemetry</p>
            </div>
          ) : farms.length === 0 ? (
            /* Empty State: Prompt specifically requires: 'No farm added yet' with '+ Add Your Farm' button */
            <div className="p-8 sm:p-14 bg-white rounded-3xl border border-earth-200 shadow-soft flex flex-col items-center justify-center text-center max-w-xl mx-auto my-12">
              <div className="w-20 h-20 rounded-3xl bg-krishi-50 border border-krishi-200 flex items-center justify-center mb-5 text-krishi-700 shadow-inner">
                <Sprout className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-2">No farm added yet</h2>
              <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                You haven't registered any farm parcel yet. Register your farm to monitor satellite boundaries, NDVI vegetation health, dynamic crop stages, and local weather forecasts.
              </p>
              <Button
                variant="primary"
                size="lg"
                icon={<Plus className="w-5 h-5" />}
                onClick={() => setIsAddFarmModalOpen(true)}
                className="bg-krishi-700 hover:bg-krishi-800 text-white font-bold shadow-md px-6 py-3"
              >
                + Add Your Farm
              </Button>
            </div>
          ) : (
            <>
              {/* Multi-Farm Selector Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-earth-200 shadow-2xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500 pl-1">
                    Your Farms ({farms.length}):
                  </span>
                  {farms.map((f) => {
                    const isSelected = f.id === selectedFarmId;
                    const fArea =
                      f.boundaryVertices && f.boundaryVertices.length >= 3
                        ? calculatePolygonAreaAcres(f.boundaryVertices)
                        : f.size;
                    return (
                      <button
                        key={f.id}
                        onClick={() => selectFarm(f.id)}
                        type="button"
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-krishi-700 text-white shadow-xs ring-2 ring-krishi-600/30'
                            : 'bg-earth-100 hover:bg-earth-200 text-gray-700'
                        }`}
                      >
                        <Sprout className="w-3.5 h-3.5" />
                        <span>{f.name}</span>
                        <span className={isSelected ? 'text-krishi-200' : 'text-gray-400'}>
                          ({fArea} {f.sizeUnit || 'ac'})
                        </span>
                      </button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  icon={<Plus className="w-3.5 h-3.5" />}
                  onClick={() => setIsAddFarmModalOpen(true)}
                  className="text-xs"
                >
                  Add New Farm Parcel
                </Button>
              </div>

              {/* Main Grid: Fully responsive (Desktop: 7/5 columns, Tablet: 2-col, Mobile: vertical stack) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Satellite Field Boundary Map */}
            <div className="lg:col-span-7 space-y-4">
              <Card className="p-4 sm:p-5 relative">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                    <h3 className="font-bold text-gray-900 text-sm sm:text-base">
                      Real Satellite Field Boundary
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-krishi-800 bg-krishi-100 px-2.5 py-0.5 rounded-full">
                      {displayAcreage > 0 ? `${displayAcreage} ${farm.sizeUnit || 'acres'}` : 'Area not set'}
                    </span>
                    <span className="text-[11px] font-mono text-gray-500">
                      {workingBoundary.length >= 3
                        ? `${workingBoundary.length} Boundary Vertices`
                        : 'No boundary'}
                    </span>
                  </div>
                </div>

                {/* Notice when location is not set */}
                {!hasCoordinates && (
                  <div className="mb-3 p-3 bg-red-50 rounded-xl border border-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2 text-xs text-red-900">
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                      <span>
                        <strong>📍 Farm location not set.</strong> Please set your farm's GPS coordinates or address.
                      </span>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      icon={<MapPin className="w-3.5 h-3.5" />}
                      onClick={handleOpenEditModal}
                      className="bg-red-600 hover:bg-red-700 text-white text-xs whitespace-nowrap shadow-2xs self-start sm:self-auto"
                    >
                      Set Farm Location
                    </Button>
                  </div>
                )}

                {/* Empty State / Notice when boundary is not added yet */}
                {hasCoordinates && !hasSavedBoundary && !isEditing && (
                  <div className="mb-3 p-3 bg-amber-50 rounded-xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2 text-xs text-amber-900">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>
                        <strong>Farm boundary not added yet.</strong> Add corners to calculate precision satellite acreage.
                      </span>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      icon={<Plus className="w-3.5 h-3.5" />}
                      onClick={handleStartAddBoundary}
                      className="bg-amber-600 hover:bg-amber-700 text-white text-xs whitespace-nowrap shadow-2xs self-start sm:self-auto"
                    >
                      Add Farm Boundary
                    </Button>
                  </div>
                )}

                {/* Interactive Editing Toolbar (Visible when editing) */}
                {isEditing && (
                  <div className="mb-3 p-2.5 bg-amber-50 rounded-xl border border-amber-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 text-amber-900 font-medium">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                      <span>
                        <strong>Boundary Editor:</strong> Drag corner pins on map to adjust shape
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<Plus className="w-3 h-3" />}
                        onClick={handleAddCorner}
                        className="text-xs py-1"
                      >
                        Add Corner
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<RotateCcw className="w-3 h-3" />}
                        onClick={handleResetBoundary}
                        className="text-xs py-1"
                      >
                        Reset
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        icon={<Check className="w-3 h-3" />}
                        onClick={handleSaveBoundary}
                        disabled={isSaving}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs py-1 shadow-2xs"
                      >
                        {isSaving ? 'Saving...' : 'Save Boundary'}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Leaflet Satellite Map Container */}
                <div className="relative rounded-2xl overflow-hidden border border-earth-300 shadow-inner h-[380px] sm:h-[460px] lg:h-[500px] bg-gray-900">
                  <RealSatelliteMap
                    latitude={farmLat}
                    longitude={farmLon}
                    fieldBoundary={workingBoundary.length >= 3 ? workingBoundary : undefined}
                    layerMode="true_color"
                    cropName={farm.crop?.name || 'Crop Field'}
                    isEditingBoundary={isEditing}
                    onBoundaryChange={handleBoundaryChange}
                    userGpsLocation={userGpsLocation}
                    showSearch={true}
                    onSelectLocation={handleSelectLocation}
                    onMyLocationClick={handleAcquireGps}
                    isLocatingGps={isLocating}
                  />

                  {/* High-Res Orbit Pill */}
                  <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md rounded-lg px-2.5 py-1 text-white text-[11px] font-medium border border-white/10 z-[1000] pointer-events-none flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>Esri Maxar 0.5m Satellite</span>
                  </div>
                </div>

                {/* Boundary Coordinate Information Bar */}
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600 bg-earth-50 p-3 rounded-xl border border-earth-200/70">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-krishi-600 shrink-0" />
                    <span>
                      Field Centroid:{' '}
                      <strong>
                        {hasCoordinates && liveCentroid[0] !== 0
                          ? `${liveCentroid[0].toFixed(5)}°N, ${liveCentroid[1].toFixed(5)}°E`
                          : 'Location not set'}
                      </strong>
                    </span>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-2">
                    <span>
                      Area: <strong>{displayAcreage > 0 ? `${displayAcreage} ${farm.sizeUnit || 'acres'}` : 'Not set'}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Boundary:{' '}
                      <strong>
                        {workingBoundary.length >= 3
                          ? `${workingBoundary.length} GPS vertices`
                          : 'Not added'}
                      </strong>
                    </span>
                  </div>
                </div>
              </Card>

              {/* Dynamic Farm Statistics Card */}
              <Card className="p-6">
                <div className="flex items-center justify-between pb-3 border-b border-earth-100 mb-4">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-krishi-600" />
                    <span>Farm Statistics & Telemetry</span>
                  </h3>
                  <span className="text-[11px] font-semibold text-gray-500 bg-earth-100 px-2 py-0.5 rounded-full">
                    Live Farm Metrics
                  </span>
                </div>

                {displayAcreage > 0 || cropStageInfo.status === 'valid' || workingBoundary.length >= 3 || activeFarmCases.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 bg-earth-50/70 rounded-xl border border-earth-200/70">
                      <span className="text-[10px] text-gray-500 font-bold uppercase block">Field Area</span>
                      <strong className="text-base font-black text-gray-900 block mt-0.5">
                        {displayAcreage > 0 ? `${displayAcreage} ${farm.sizeUnit || 'ac'}` : '—'}
                      </strong>
                      <span className="text-[10px] text-gray-400">
                        {workingBoundary.length >= 3 ? 'Polygon mapped' : (displayAcreage > 0 ? 'Saved area' : 'Not specified')}
                      </span>
                    </div>

                    <div className="p-3 bg-earth-50/70 rounded-xl border border-earth-200/70">
                      <span className="text-[10px] text-gray-500 font-bold uppercase block">Crop Cycle</span>
                      <strong className="text-base font-black text-krishi-800 block mt-0.5">
                        {cropStageInfo.status === 'valid' ? `${cropStageInfo.daysSinceSowing} DAS` : '—'}
                      </strong>
                      <span className="text-[10px] text-gray-400">
                        {cropStageInfo.status === 'valid' ? `${cropStageInfo.progressPercent}% progress` : 'Sowing date needed'}
                      </span>
                    </div>

                    <div className="p-3 bg-earth-50/70 rounded-xl border border-earth-200/70">
                      <span className="text-[10px] text-gray-500 font-bold uppercase block">GPS Boundary</span>
                      <strong className="text-base font-black text-gray-900 block mt-0.5">
                        {workingBoundary.length >= 3 ? `${workingBoundary.length} pts` : '—'}
                      </strong>
                      <span className="text-[10px] text-gray-400">
                        {workingBoundary.length >= 3 ? 'Active polygon' : 'Unmapped polygon'}
                      </span>
                    </div>

                    <div className="p-3 bg-earth-50/70 rounded-xl border border-earth-200/70">
                      <span className="text-[10px] text-gray-500 font-bold uppercase block">Field Issues</span>
                      <strong className="text-base font-black text-gray-900 block mt-0.5">
                        {activeFarmCases.length}
                      </strong>
                      <span className="text-[10px] text-gray-400">
                        {activeFarmCases.length === 0 ? 'Optimal field state' : 'Active issues'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 px-4 bg-earth-50/50 rounded-xl border border-dashed border-earth-200">
                    <BarChart2 className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-gray-700">No farm statistics available yet</p>
                    <p className="text-[11px] text-gray-500 mt-0.5 max-w-sm mx-auto">
                      Map field boundaries or register crop sowing details to compute dynamic parcel telemetry.
                    </p>
                  </div>
                )}
              </Card>
            </div>

            {/* Right Column: Farm Details, Dynamic Health Score, & Farm Activities */}
            <div className="lg:col-span-5 space-y-4">
              {/* Farm Details Card */}
              <Card className="p-6">
                <div className="flex items-center justify-between pb-4 border-b border-earth-100 mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{farm.name || farm.farm_name || 'Unnamed Farm'}</h2>
                    <p className="text-xs text-gray-500">
                      Registered to <strong className="text-gray-700 font-semibold">{user.name || user.email || 'Profile not set'}</strong>
                      {user.name && user.email && <span className="text-gray-400"> ({user.email})</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<Edit className="w-3.5 h-3.5" />}
                      onClick={handleOpenEditModal}
                      className="text-xs font-semibold"
                    >
                      Edit Details
                    </Button>
                    {farms.length >= 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete ${farm.name || 'this farm parcel'}?`)) {
                            deleteFarm(farm.id);
                          }
                        }}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete farm parcel"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  {/* Location */}
                  <div className="p-3 rounded-xl bg-earth-50/70 border border-earth-200/70">
                    <span className="text-[11px] text-gray-500 block uppercase font-bold">Location</span>
                    <strong className="text-gray-900 text-xs sm:text-sm block truncate" title={farm.location?.address || farm.location_address}>
                      {farm.location?.address || farm.location_address || <span className="text-gray-400 font-normal">📍 Location address not set</span>}
                    </strong>
                  </div>

                  {/* Field Area */}
                  <div className="p-3 rounded-xl bg-earth-50/70 border border-earth-200/70">
                    <span className="text-[11px] text-gray-500 block uppercase font-bold">Field Area</span>
                    <strong className="text-gray-900 text-xs sm:text-sm">
                      {displayAcreage > 0 ? `${displayAcreage} ${farm.sizeUnit || 'acres'}` : <span className="text-gray-400 font-normal">Area not specified</span>}
                    </strong>
                  </div>

                  {/* Crop & Variety */}
                  <div className="p-3 rounded-xl bg-earth-50/70 border border-earth-200/70">
                    <span className="text-[11px] text-gray-500 block uppercase font-bold">Planted Crop</span>
                    <strong className="text-krishi-800 text-xs sm:text-sm">
                      {farm.crop?.name || farm.crop_variety ? (
                        <>
                          {farm.crop?.name || farm.crop_variety}{' '}
                          {farm.crop?.variety ? (
                            <span className="text-gray-500 font-normal">({farm.crop.variety})</span>
                          ) : null}
                        </>
                      ) : (
                        <span className="text-gray-400 font-normal">No crop registered</span>
                      )}
                    </strong>
                  </div>

                  {/* Dynamic Crop Stage */}
                  <div className="p-3 rounded-xl bg-earth-50/70 border border-earth-200/70">
                    <span className="text-[11px] text-gray-500 block uppercase font-bold">
                      Dynamic Crop Stage
                    </span>
                    <div className="mt-0.5">
                      <strong className="text-gray-900 text-xs sm:text-sm block">
                        {cropStageInfo.status === 'valid' ? (
                          cropStageInfo.stage
                        ) : (
                          <span className="text-gray-400 font-normal">Stage tracking unavailable (sowing date required)</span>
                        )}
                      </strong>
                      {cropStageInfo.status === 'valid' && (
                        <div className="mt-1.5 space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-gray-500 font-medium">
                            <span>{cropStageInfo.daysSinceSowing} DAS</span>
                            <span>{cropStageInfo.progressPercent}%</span>
                          </div>
                          <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-krishi-600 h-full rounded-full transition-all duration-500"
                              style={{ width: `${cropStageInfo.progressPercent}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Irrigation */}
                  <div className="p-3 rounded-xl bg-earth-50/70 border border-earth-200/70">
                    <span className="text-[11px] text-gray-500 block uppercase font-bold">Irrigation System</span>
                    <strong className="text-gray-900 text-xs sm:text-sm">
                      {farm.irrigationType || farm.irrigation_type ? (
                        `${farm.irrigationType || farm.irrigation_type} System`
                      ) : (
                        <span className="text-gray-400 font-normal">Irrigation method not set</span>
                      )}
                    </strong>
                  </div>

                  {/* Soil Type */}
                  <div className="p-3 rounded-xl bg-earth-50/70 border border-earth-200/70">
                    <span className="text-[11px] text-gray-500 block uppercase font-bold">Soil Type</span>
                    <strong className="text-gray-900 text-xs sm:text-sm">
                      {farm.soil?.soilType || farm.soil_type || <span className="text-gray-400 font-normal">Soil test not conducted / type not set</span>}
                    </strong>
                  </div>

                  {/* Sowing Date */}
                  <div className="p-3 rounded-xl bg-earth-50/70 border border-earth-200/70">
                    <span className="text-[11px] text-gray-500 block uppercase font-bold">Sowing Date</span>
                    <strong className="text-gray-900 text-xs sm:text-sm">
                      {farm.crop?.sowingDate || farm.sowing_date || <span className="text-gray-400 font-normal">Sowing date not set</span>}
                    </strong>
                    {cropStageInfo.status === 'valid' && (
                      <span className="text-[11px] text-krishi-800 bg-krishi-50 px-2 py-0.5 rounded-md border border-krishi-200 font-medium block mt-1">
                        {cropStageInfo.description}
                      </span>
                    )}
                  </div>

                  {/* Coordinates & Boundary Status */}
                  <div className="p-3 rounded-xl bg-earth-50/70 border border-earth-200/70">
                    <span className="text-[11px] text-gray-500 block uppercase font-bold">Coordinates & Boundary</span>
                    <strong className="text-gray-900 text-xs sm:text-sm block">
                      {hasCoordinates ? `${farmLat.toFixed(5)}°N, ${farmLon.toFixed(5)}°E` : <span className="text-gray-400 font-normal">Coordinates not configured</span>}
                    </strong>
                    <span className="text-[11px] text-gray-500 block mt-0.5">
                      {workingBoundary.length >= 3 ? `${workingBoundary.length} GPS Polygon Vertices` : <span className="text-gray-400">Boundary not mapped</span>}
                    </span>
                  </div>
                </div>
              </Card>

              {/* Dynamic Farm Health Index Card - No Hardcoded Numbers */}
              <Card className="p-6 bg-gradient-to-br from-white to-krishi-50/30">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-krishi-600" />
                    <span>Farm Health Index</span>
                  </h3>
                  {healthBreakdown.overallScore !== null ? (
                    <span className="text-2xl font-black text-krishi-700">
                      {healthBreakdown.overallScore}/100
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full border border-gray-200">
                      Data unavailable
                    </span>
                  )}
                </div>

                <div className="space-y-3.5 text-xs">
                  {/* Soil Nutrient Balance */}
                  <div>
                    <div className="flex justify-between font-semibold mb-1">
                      <span className="text-gray-700">Soil Nutrient Balance</span>
                      <span className={healthBreakdown.soilNutrientScore.isAvailable ? 'text-krishi-800 font-bold' : 'text-gray-400'}>
                        {healthBreakdown.soilNutrientScore.statusText}
                      </span>
                    </div>
                    {healthBreakdown.soilNutrientScore.score !== null ? (
                      <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-krishi-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${healthBreakdown.soilNutrientScore.score}%` }}
                        ></div>
                      </div>
                    ) : (
                      <div className="w-full bg-gray-100 h-2 rounded-full border border-dashed border-gray-300"></div>
                    )}
                  </div>

                  {/* Water / Moisture Status */}
                  <div>
                    <div className="flex justify-between font-semibold mb-1">
                      <span className="text-gray-700">Water / Moisture Status</span>
                      <span className={healthBreakdown.waterMoistureScore.isAvailable ? 'text-sky-800 font-bold' : 'text-gray-400'}>
                        {healthBreakdown.waterMoistureScore.statusText}
                      </span>
                    </div>
                    {healthBreakdown.waterMoistureScore.score !== null ? (
                      <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-sky-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${healthBreakdown.waterMoistureScore.score}%` }}
                        ></div>
                      </div>
                    ) : (
                      <div className="w-full bg-gray-100 h-2 rounded-full border border-dashed border-gray-300"></div>
                    )}
                  </div>

                  {/* Crop Canopy & NDVI */}
                  <div>
                    <div className="flex justify-between font-semibold mb-1">
                      <span className="text-gray-700">Crop Canopy & NDVI</span>
                      <span className={healthBreakdown.cropCanopyScore.isAvailable ? 'text-emerald-800 font-bold' : 'text-gray-400'}>
                        {healthBreakdown.cropCanopyScore.statusText}
                      </span>
                    </div>
                    {healthBreakdown.cropCanopyScore.score !== null ? (
                      <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${healthBreakdown.cropCanopyScore.score}%` }}
                        ></div>
                      </div>
                    ) : (
                      <div className="w-full bg-gray-100 h-2 rounded-full border border-dashed border-gray-300"></div>
                    )}
                  </div>

                  {/* Weather Resilience */}
                  <div>
                    <div className="flex justify-between font-semibold mb-1">
                      <span className="text-gray-700">Weather Resilience</span>
                      <span className={healthBreakdown.weatherResilienceScore.isAvailable ? 'text-amber-800 font-bold' : 'text-gray-400'}>
                        {healthBreakdown.weatherResilienceScore.statusText}
                      </span>
                    </div>
                    {healthBreakdown.weatherResilienceScore.score !== null ? (
                      <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-amber-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${healthBreakdown.weatherResilienceScore.score}%` }}
                        ></div>
                      </div>
                    ) : (
                      <div className="w-full bg-gray-100 h-2 rounded-full border border-dashed border-gray-300"></div>
                    )}
                  </div>
                </div>
              </Card>

              {/* Dynamic Farm Activities Card */}
              <Card className="p-6">
                <div className="flex items-center justify-between pb-3 border-b border-earth-100 mb-4">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-krishi-600" />
                    <span>Farm Activities & Timeline</span>
                  </h3>
                  <span className="text-[11px] font-semibold text-gray-500 bg-earth-100 px-2 py-0.5 rounded-full">
                    {allActivities.length} {allActivities.length === 1 ? 'record' : 'records'}
                  </span>
                </div>

                {loadingActivities ? (
                  <div className="text-center py-6 text-xs text-gray-500 font-medium">
                    Loading farm timeline...
                  </div>
                ) : allActivities.length > 0 ? (
                  <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                    {allActivities.map((act) => (
                      <div
                        key={act.id}
                        className="p-3 bg-earth-50/70 rounded-xl border border-earth-200/70 flex items-start gap-3"
                      >
                        <div className="p-1.5 bg-krishi-100 text-krishi-700 rounded-lg shrink-0 mt-0.5">
                          {act.type === 'problem' ? (
                            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                          ) : act.type === 'sowing' ? (
                            <Sprout className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Clock className="w-3.5 h-3.5 text-krishi-600" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="text-xs font-bold text-gray-900 truncate">{act.title}</h4>
                            <span className="text-[10px] text-gray-400 shrink-0">
                              {act.timestamp ? new Date(act.timestamp).toLocaleDateString() : ''}
                            </span>
                          </div>
                          {act.description && (
                            <p className="text-[11px] text-gray-600 mt-0.5 line-clamp-2">
                              {act.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 px-4 bg-earth-50/50 rounded-xl border border-dashed border-earth-200">
                    <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-gray-700">No activities recorded yet</p>
                    <p className="text-[11px] text-gray-500 mt-0.5 max-w-xs mx-auto">
                      Boundary updates, farm edits, and agronomic events will appear here in chronological order.
                    </p>
                  </div>
                )}
              </Card>
            </div>
          </div>
            </>
          )}
        </main>
      </div>

      {/* Edit Farm Details Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Farm Information"
        maxWidth="max-w-5xl"
      >
        <form onSubmit={handleSaveFarmDetails} className="flex flex-col">
          {/* Responsive Layout: Desktop 2-column (Left Form, Right Map), Mobile stacked vertically */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pb-4">
            {/* LEFT COLUMN (Desktop) / TOP (Mobile): Form Inputs */}
            <div className="lg:col-span-7 space-y-4 w-full">
              {/* 1. Farm Name */}
              <div>
                <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                  Farm Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-earth-300 rounded-xl text-sm focus:ring-2 focus:ring-krishi-600 focus:outline-none bg-white relative z-0"
                  placeholder="e.g. Riverbank Plot"
                />
              </div>

              {/* 2. Location & 3. Field Area */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                    Location Address (Search or GPS)
                  </label>
                  <LocationSearchInput
                    value={editFormData.address}
                    currentLat={modalLat}
                    currentLon={modalLon}
                    onChange={(address) => setEditFormData({ ...editFormData, address })}
                    onSelectLocation={handleModalSelectLocation}
                    placeholder="Search village, city, district..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                    Field Area ({farm.sizeUnit || 'acres'})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    required
                    value={editFormData.size}
                    onChange={(e) => setEditFormData({ ...editFormData, size: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-earth-300 rounded-xl text-sm focus:ring-2 focus:ring-krishi-600 focus:outline-none bg-white font-semibold relative z-0"
                    placeholder="2.5"
                  />
                </div>
              </div>

              {/* 4. Crop Name & Variety */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                    Crop Name
                  </label>
                  <input
                    type="text"
                    value={editFormData.cropName}
                    onChange={(e) => setEditFormData({ ...editFormData, cropName: e.target.value })}
                    className="w-full px-3 py-2 border border-earth-300 rounded-xl text-sm focus:ring-2 focus:ring-krishi-600 focus:outline-none bg-white relative z-0"
                    placeholder="e.g. Cotton, Rice, Wheat, Soybean"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                    Crop Variety
                  </label>
                  <input
                    type="text"
                    value={editFormData.cropVariety}
                    onChange={(e) => setEditFormData({ ...editFormData, cropVariety: e.target.value })}
                    className="w-full px-3 py-2 border border-earth-300 rounded-xl text-sm focus:ring-2 focus:ring-krishi-600 focus:outline-none bg-white relative z-0"
                    placeholder="e.g. PBW-550, JS-335, Rasi-659"
                  />
                </div>
              </div>

              {/* 5. Dynamic Crop Stage Preview */}
              <div className="p-3 bg-earth-50 rounded-xl border border-earth-200">
                <span className="text-[11px] text-gray-500 uppercase font-bold block mb-1">
                  Dynamic Crop Growth Stage Preview
                </span>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-krishi-100 text-krishi-800 border border-krishi-300">
                      {modalCropStage.stage}
                    </span>
                    {modalCropStage.status === 'valid' && (
                      <span className="text-xs text-gray-600 font-medium">
                        ({modalCropStage.daysSinceSowing} DAS • {modalCropStage.progressPercent}%)
                      </span>
                    )}
                  </div>
                </div>
                {modalCropStage.status === 'valid' && (
                  <p className="text-[11px] text-gray-500 mt-1.5 leading-snug">
                    {modalCropStage.description}
                  </p>
                )}
              </div>

              {/* 6. Soil Type & 7. Irrigation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                    Soil Type
                  </label>
                  <select
                    value={editFormData.soilType}
                    onChange={(e) => setEditFormData({ ...editFormData, soilType: e.target.value })}
                    className="w-full px-3 py-2 border border-earth-300 rounded-xl text-sm focus:ring-2 focus:ring-krishi-600 focus:outline-none bg-white relative z-0"
                  >
                    <option value="">Select Soil Type</option>
                    <option value="Loamy Black Cotton">Loamy Black Cotton (काली मिट्टी)</option>
                    <option value="Alluvial Clay Loam">Alluvial Clay Loam (जलोढ़ दोमट)</option>
                    <option value="Red Sandy Loam">Red Sandy Loam (लाल रेतीली मिट्टी)</option>
                    <option value="Clayey">Clayey (चिमनी मिट्टी)</option>
                    <option value="Sandy Loam">Sandy Loam (बलुई दोमट)</option>
                    <option value="Laterite Soil">Laterite Soil (लैटेराइट)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                    Irrigation Method
                  </label>
                  <select
                    value={editFormData.irrigationType}
                    onChange={(e) => setEditFormData({ ...editFormData, irrigationType: e.target.value as any })}
                    className="w-full px-3 py-2 border border-earth-300 rounded-xl text-sm focus:ring-2 focus:ring-krishi-600 focus:outline-none bg-white relative z-0"
                  >
                    <option value="">Select Irrigation Method</option>
                    <option value="Drip">Drip Irrigation (ड्रिप)</option>
                    <option value="Sprinkler">Sprinkler (फव्वारा)</option>
                    <option value="Flood">Flood / Furrow (खुला पानी)</option>
                    <option value="Rainfed">Rainfed / Dryland (वर्षा आधारित)</option>
                  </select>
                </div>
              </div>

              {/* 8. Sowing Date */}
              <div>
                <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                  Sowing Date (Tracks Crop Stage in Real Time)
                </label>
                <input
                  type="date"
                  value={editFormData.sowingDate}
                  onChange={(e) => setEditFormData({ ...editFormData, sowingDate: e.target.value })}
                  className="w-full px-3 py-2 border border-earth-300 rounded-xl text-sm focus:ring-2 focus:ring-krishi-600 focus:outline-none bg-white font-medium relative z-0"
                />
              </div>
            </div>

            {/* RIGHT COLUMN (Desktop) / 9. Map (Mobile): Satellite Map View */}
            <div className="lg:col-span-5 space-y-3 w-full">
              <div className="bg-earth-50 p-3.5 rounded-2xl border border-earth-200 space-y-2.5">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-800 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-krishi-600" />
                    Field Satellite Location
                  </span>
                  <span className="text-[11px] font-mono text-gray-500 bg-white px-2 py-0.5 rounded-md border border-earth-200">
                    {modalLat !== 0 && modalLon !== 0
                      ? `${modalLat.toFixed(4)}°N, ${modalLon.toFixed(4)}°E`
                      : 'Location not set'}
                  </span>

                </div>

                {/* Map Container with ISOLATE to ensure Leaflet never bleeds z-index */}
                <div className="relative rounded-xl overflow-hidden border-2 border-earth-300 shadow-inner h-64 sm:h-72 lg:h-[350px] bg-gray-900 isolate">
                  <RealSatelliteMap
                    latitude={modalLat}
                    longitude={modalLon}
                    fieldBoundary={modalBoundary.length >= 3 ? modalBoundary : undefined}
                    layerMode="true_color"
                    cropName={editFormData.cropName || 'Crop Field'}
                    showSearch={true}
                    onSelectLocation={handleModalSelectLocation}
                    onMyLocationClick={handleModalAcquireGps}
                    isLocatingGps={isModalLocating}
                  />

                  {/* Satellite pill */}
                  <div className="absolute top-2.5 right-2.5 bg-black/70 backdrop-blur-xs rounded-md px-2 py-0.5 text-white text-[10px] font-medium border border-white/10 z-[1000] pointer-events-none">
                    Esri 0.5m
                  </div>
                </div>

                <p className="text-[11px] text-gray-500 leading-tight">
                  💡 <strong>Tip:</strong> Search any place or village above to automatically update farm coordinates and address.
                </p>
              </div>
            </div>
          </div>

          {/* 10. Sticky / Accessible Footer: Cancel & Save Changes */}
          <div className="sticky bottom-0 -mx-4 -mb-4 sm:-mx-6 sm:-mb-6 px-4 py-3 sm:px-6 sm:py-4 bg-white/95 backdrop-blur-md border-t border-earth-200 flex items-center justify-end gap-3 shrink-0 z-20">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSaving}
              className="bg-krishi-700 hover:bg-krishi-800 text-white font-bold px-6 shadow-xs"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add New Farm Modal */}
      <Modal
        isOpen={isAddFarmModalOpen}
        onClose={() => setIsAddFarmModalOpen(false)}
        title="Register New Farm Parcel"
      >
        <form onSubmit={handleCreateNewFarm} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
              Farm Name
            </label>
            <input
              type="text"
              required
              value={newFarmFormData.name}
              onChange={(e) => setNewFarmFormData({ ...newFarmFormData, name: e.target.value })}
              className="w-full px-3 py-2 border border-earth-300 rounded-xl text-sm focus:ring-2 focus:ring-krishi-600 focus:outline-none"
              placeholder="e.g. North Sector 4"
            />
          </div>

          {/* Location Address */}
          <div>
            <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
              Farm Location (Search or GPS)
            </label>
            <LocationSearchInput
              value={newFarmFormData.address}
              currentLat={newFarmFormData.lat}
              currentLon={newFarmFormData.lon}
              onChange={(address) => setNewFarmFormData({ ...newFarmFormData, address })}
              onSelectLocation={(res) => {
                setNewFarmFormData((prev) => ({
                  ...prev,
                  address: res.displayName,
                  district: res.district || prev.district,
                  state: res.state || prev.state,
                  lat: res.lat,
                  lon: res.lon,
                }));
              }}
              placeholder="Search village, city, district..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                Field Area (Acres)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.1"
                required
                value={newFarmFormData.size || ''}
                onChange={(e) => setNewFarmFormData({ ...newFarmFormData, size: parseFloat(e.target.value) || '' })}
                className="w-full px-3 py-2 border border-earth-300 rounded-xl text-sm focus:ring-2 focus:ring-krishi-600 focus:outline-none"
                placeholder="e.g. 2.0"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                Crop Name (Optional)
              </label>
              <input
                type="text"
                value={newFarmFormData.cropName}
                onChange={(e) => setNewFarmFormData({ ...newFarmFormData, cropName: e.target.value })}
                className="w-full px-3 py-2 border border-earth-300 rounded-xl text-sm focus:ring-2 focus:ring-krishi-600 focus:outline-none"
                placeholder="e.g. Mustard, Chickpea, Cotton"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                Crop Variety (Optional)
              </label>
              <input
                type="text"
                value={newFarmFormData.cropVariety}
                onChange={(e) => setNewFarmFormData({ ...newFarmFormData, cropVariety: e.target.value })}
                className="w-full px-3 py-2 border border-earth-300 rounded-xl text-sm focus:ring-2 focus:ring-krishi-600 focus:outline-none"
                placeholder="e.g. Pusa Bold, JS-335"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                Sowing Date (Optional)
              </label>
              <input
                type="date"
                value={newFarmFormData.sowingDate}
                onChange={(e) => setNewFarmFormData({ ...newFarmFormData, sowingDate: e.target.value })}
                className="w-full px-3 py-2 border border-earth-300 rounded-xl text-sm focus:ring-2 focus:ring-krishi-600 focus:outline-none font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                Soil Type (Optional)
              </label>
              <select
                value={newFarmFormData.soilType}
                onChange={(e) => setNewFarmFormData({ ...newFarmFormData, soilType: e.target.value })}
                className="w-full px-3 py-2 border border-earth-300 rounded-xl text-sm focus:ring-2 focus:ring-krishi-600 focus:outline-none bg-white"
              >
                <option value="">Select Soil Type</option>
                <option value="Loamy Black Cotton">Loamy Black Cotton (काली मिट्टी)</option>
                <option value="Alluvial Clay Loam">Alluvial Clay Loam (जलोढ़ दोमट)</option>
                <option value="Red Sandy Loam">Red Sandy Loam (लाल रेतीली मिट्टी)</option>
                <option value="Clayey">Clayey (चिमनी मिट्टी)</option>
                <option value="Sandy Loam">Sandy Loam (बलुई दोमट)</option>
                <option value="Laterite Soil">Laterite Soil (लैटेराइट)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                Irrigation Method (Optional)
              </label>
              <select
                value={newFarmFormData.irrigationType}
                onChange={(e) => setNewFarmFormData({ ...newFarmFormData, irrigationType: e.target.value })}
                className="w-full px-3 py-2 border border-earth-300 rounded-xl text-sm focus:ring-2 focus:ring-krishi-600 focus:outline-none bg-white"
              >
                <option value="">Select Irrigation Method</option>
                <option value="Drip">Drip Irrigation (ड्रिप)</option>
                <option value="Sprinkler">Sprinkler (फव्वारा)</option>
                <option value="Flood">Flood / Furrow (खुला पानी)</option>
                <option value="Rainfed">Rainfed / Dryland (वर्षा आधारित)</option>
              </select>
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-earth-200">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddFarmModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSaving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              {isSaving ? 'Creating...' : 'Register Farm'}
            </Button>
          </div>
        </form>
      </Modal>

      <MobileBottomNav />
    </div>
  );
};
