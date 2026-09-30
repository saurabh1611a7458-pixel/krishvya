import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Sidebar } from '../components/common/Sidebar';
import { MobileBottomNav } from '../components/common/MobileBottomNav';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { useFarm } from '../context/FarmContext';
import { RealSatelliteMap } from '../components/satellite/RealSatelliteMap';
import { LocationSearchInput } from '../components/common/LocationSearchInput';
import {
  calculatePolygonAreaAcres,
  calculateCentroid,
  generateDefaultBoundary,
} from '../utils/geoUtils';
import { calculateDynamicCropStage } from '../utils/cropStageUtils';
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
  Trash2,
  Activity,
  Clock,
  Bot,
  ArrowRight,
  ChevronDown,
  CloudSun,
  Droplets,
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
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

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
    <div className="min-h-screen bg-[#F8F8F4] flex">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-10">
        {/* Simple & Clean Header */}
        <header className="bg-white border-b border-[#E5E7EB] px-4 sm:px-8 py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sticky top-0 z-20">
          <div>
            <div className="flex items-center gap-2">
              <Trees className="w-5 h-5 text-[#166534]" />
              <h1 className="text-lg sm:text-xl font-bold text-[#1F2937] tracking-tight">
                My Farm
              </h1>
              {saveSuccess && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EAF4EC] text-[#166534] border border-[#D1E7D6] animate-in fade-in">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#166534]" />
                  Saved!
                </span>
              )}
            </div>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Parcel location, boundary and crop profile
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {farms.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                icon={<Plus className="w-3.5 h-3.5 text-[#166534]" />}
                onClick={() => setIsAddFarmModalOpen(true)}
                className="text-xs font-semibold border-[#E5E7EB] hover:bg-[#EAF4EC] text-[#1F2937]"
              >
                + Add Farm
              </Button>
            )}
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          {(isLoading || isSyncingAuth) ? (
            /* Loading State */
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-[#E5E7EB] text-center min-h-[400px] shadow-xs">
              <div className="w-10 h-10 border-4 border-[#166534] border-t-transparent rounded-full animate-spin mb-4" />
              <h3 className="text-base font-bold text-[#1F2937]">Loading your farm...</h3>
              <p className="text-xs text-[#6B7280] mt-1">Retrieving farm profile and map</p>
            </div>
          ) : farms.length === 0 ? (
            /* Empty State */
            <div className="p-8 sm:p-14 bg-white rounded-3xl border border-[#E5E7EB] shadow-xs flex flex-col items-center justify-center text-center max-w-xl mx-auto my-12">
              <div className="w-16 h-16 rounded-3xl bg-[#EAF4EC] border border-[#D1E7D6] flex items-center justify-center mb-5 text-[#166534]">
                <Sprout className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-[#1F2937] tracking-tight mb-2">No farm added yet</h2>
              <p className="text-xs text-[#6B7280] mb-6 leading-relaxed max-w-sm">
                Register your farm parcel to view field boundaries, track crop stages, and get personalized farm advice.
              </p>
              <Button
                variant="primary"
                size="lg"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => setIsAddFarmModalOpen(true)}
                className="bg-[#166534] hover:bg-[#14532D] text-white font-bold shadow-xs px-6 py-2.5 text-xs"
              >
                + Add Your Farm
              </Button>
            </div>
          ) : (
            <>
              {/* Multi-Farm Selector Bar (shown when user has > 1 farm) */}
              {farms.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                  <span className="text-xs font-bold text-[#6B7280] shrink-0">Your Farms:</span>
                  {farms.map((f) => {
                    const isSelected = f.id === selectedFarmId;
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => selectFarm(f.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                          isSelected
                            ? 'bg-[#166534] text-white shadow-xs'
                            : 'bg-white hover:bg-[#EAF4EC] text-[#4B5563] border border-[#E5E7EB]'
                        }`}
                      >
                        <Sprout className="w-3.5 h-3.5" />
                        <span>{f.name}</span>
                        {f.size ? (
                          <span className={isSelected ? 'text-emerald-100' : 'text-[#6B7280]'}>
                            ({f.size} {f.sizeUnit || 'ac'})
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Main 2-Column Responsive Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* ================================================================= */}
                {/* LEFT COLUMN: 🌱 Farm Map (GIS & Boundary)                         */}
                {/* ================================================================= */}
                <div className="lg:col-span-7 space-y-4">
                  <Card className="p-4 sm:p-5 relative bg-white border-[#E5E7EB] shadow-xs">
                    {/* Map Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#166534]"></span>
                        <h3 className="font-bold text-[#1F2937] text-sm sm:text-base">
                          🌱 Farm Map
                        </h3>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[#166534] bg-[#EAF4EC] border border-[#D1E7D6] px-2.5 py-0.5 rounded-full">
                          {displayAcreage > 0 ? `${displayAcreage} ${farm.sizeUnit || 'acres'}` : 'Area not set'}
                        </span>

                        {/* Farmer-Friendly Location Button */}
                        <button
                          onClick={handleAcquireGps}
                          disabled={isLocating}
                          type="button"
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold transition-all shadow-2xs cursor-pointer ${
                            userGpsLocation
                              ? 'bg-[#EAF4EC] text-[#166534] border border-[#D1E7D6]'
                              : 'bg-white hover:bg-[#EAF4EC] text-[#1F2937] border border-[#E5E7EB]'
                          }`}
                          title="Use your phone or computer GPS location"
                        >
                          <Navigation className={`w-3.5 h-3.5 text-[#166534] ${isLocating ? 'animate-spin' : ''}`} />
                          <span>{isLocating ? 'Locating...' : 'Use My Location'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Notice when farm location is not set */}
                    {!hasCoordinates && (
                      <div className="mb-3 p-3 bg-red-50 rounded-xl border border-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2 text-xs text-red-900">
                          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                          <span>
                            <strong>Farm location not set.</strong> Please search address or use your location.
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

                    {/* SINGLE Primary Add Field Boundary Button & Notice when boundary is missing */}
                    {hasCoordinates && !hasSavedBoundary && !isEditing && (
                      <div className="mb-3 p-3.5 bg-[#F8F8F4] rounded-xl border border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="text-xs text-[#1F2937]">
                          <strong className="block font-bold text-[#1F2937]">Field boundary not added yet.</strong>
                          <span className="text-[#6B7280]">
                            Add your field boundary to calculate more accurate field measurements.
                          </span>
                        </div>
                        <Button
                          variant="primary"
                          size="sm"
                          icon={<Plus className="w-3.5 h-3.5" />}
                          onClick={handleStartAddBoundary}
                          className="bg-[#166534] hover:bg-[#14532D] text-white text-xs font-bold shrink-0 shadow-2xs"
                        >
                          + Add Field Boundary
                        </Button>
                      </div>
                    )}

                    {/* Boundary Mapped Info Row with Edit Boundary button */}
                    {hasSavedBoundary && !isEditing && (
                      <div className="mb-3 p-2.5 bg-[#F8F8F4] rounded-xl border border-[#E5E7EB] flex items-center justify-between gap-2 text-xs">
                        <span className="text-[#6B7280]">
                          Boundary mapped: <strong className="text-[#1F2937]">{displayAcreage} acres</strong> ({workingBoundary.length} GPS points)
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          icon={<Edit className="w-3.5 h-3.5 text-[#166534]" />}
                          onClick={() => setIsEditing(true)}
                          className="text-xs font-semibold hover:bg-[#EAF4EC] border-[#E5E7EB] text-[#1F2937] py-1"
                        >
                          Edit Boundary
                        </Button>
                      </div>
                    )}

                    {/* Interactive Boundary Editing Toolbar */}
                    {isEditing && (
                      <div className="mb-3 p-2.5 bg-[#EAF4EC] rounded-xl border border-[#D1E7D6] flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className="font-semibold text-[#166534]">
                          Boundary Editor: Drag corner pins on map to adjust shape
                        </span>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            icon={<Plus className="w-3 h-3" />}
                            onClick={handleAddCorner}
                            className="text-xs py-1"
                          >
                            + Add Corner
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
                            variant="outline"
                            size="sm"
                            icon={<X className="w-3 h-3" />}
                            onClick={() => {
                              handleResetBoundary();
                              setIsEditing(false);
                            }}
                            className="text-xs py-1"
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            icon={<Check className="w-3.5 h-3.5" />}
                            onClick={handleSaveBoundary}
                            disabled={isSaving}
                            className="bg-[#166534] hover:bg-[#14532D] text-white text-xs py-1 shadow-2xs font-bold"
                          >
                            {isSaving ? 'Saving...' : 'Save Boundary'}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Satellite Map (Comfortable, slightly less dominant vertical height) */}
                    <div className="relative rounded-2xl overflow-hidden border border-[#E5E7EB] shadow-inner h-[320px] sm:h-[380px] lg:h-[420px] bg-gray-900">
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
                    </div>

                    {/* Map Footer: Farm Location and Collapsible Technical Details */}
                    <div className="mt-3.5 space-y-2">
                      <div className="flex items-center justify-between text-xs text-[#6B7280] bg-[#F8F8F4] px-3.5 py-2.5 rounded-xl border border-[#E5E7EB]">
                        <div className="flex items-center gap-1.5 truncate">
                          <MapPin className="w-3.5 h-3.5 text-[#166534] shrink-0" />
                          <span className="truncate">
                            Farm Location:{' '}
                            <strong className="text-[#1F2937]">
                              {farm.location?.address || farm.location?.district || farm.location?.state || 'Location not set'}
                            </strong>
                          </span>
                        </div>
                        <span className="font-semibold text-[#166534] shrink-0">
                          {displayAcreage > 0 ? `${displayAcreage} ${farm.sizeUnit || 'acres'}` : ''}
                        </span>
                      </div>

                      {/* Collapsible Technical Details */}
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                          className="flex items-center justify-between w-full px-1 text-xs font-semibold text-[#6B7280] hover:text-[#1F2937] transition-colors cursor-pointer"
                        >
                          <span>Technical Details</span>
                          <ChevronDown
                            className={`w-3.5 h-3.5 transition-transform duration-200 ${
                              showTechnicalDetails ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                        {showTechnicalDetails && (
                          <div className="mt-2 p-3 bg-white rounded-xl border border-[#E5E7EB] text-xs text-[#6B7280] space-y-1.5 animate-in fade-in">
                            <div>
                              Coordinates:{' '}
                              <strong className="text-[#1F2937] font-mono">
                                {hasCoordinates && liveCentroid[0] !== 0
                                  ? `${liveCentroid[0].toFixed(5)}°N, ${liveCentroid[1].toFixed(5)}°E`
                                  : 'Not configured'}
                              </strong>
                            </div>
                            <div>
                              Boundary Vertices:{' '}
                              <strong className="text-[#1F2937]">
                                {workingBoundary.length >= 3
                                  ? `${workingBoundary.length} GPS points mapped`
                                  : 'Unmapped'}
                              </strong>
                            </div>
                            <div>
                              Calculated Area:{' '}
                              <strong className="text-[#1F2937]">
                                {displayAcreage > 0 ? `${displayAcreage} acres` : 'Not set'}
                              </strong>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                </div>

                {/* ================================================================= */}
                {/* RIGHT COLUMN: Farm Profile, Today Status & Ask KRISHVYA            */}
                {/* ================================================================= */}
                <div className="lg:col-span-5 space-y-4">
                  {/* 1. Farm Details Card (No email, no user clutter) */}
                  <Card className="p-5 bg-white border-[#E5E7EB] shadow-xs">
                    <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB] mb-3.5">
                      <div>
                        <h2 className="text-lg font-bold text-[#1F2937]">
                          {farm.name || 'Your Farm Parcel'}
                        </h2>
                        <p className="text-xs text-[#6B7280]">
                          Farm profile & crop specifications
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          icon={<Edit className="w-3.5 h-3.5 text-[#166534]" />}
                          onClick={handleOpenEditModal}
                          className="text-xs font-semibold border-[#E5E7EB] hover:bg-[#EAF4EC] text-[#1F2937]"
                        >
                          Edit Details
                        </Button>
                        {farms.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete ${farm.name || 'this farm parcel'}?`)) {
                                deleteFarm(farm.id);
                              }
                            }}
                            className="p-1.5 text-[#DC2626] hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete farm parcel"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* 7 Clean Information Tiles */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                      {/* Location */}
                      <div className="p-3 rounded-xl bg-[#F8F8F4] border border-[#E5E7EB]">
                        <span className="text-[10px] text-[#6B7280] block uppercase font-bold">Location</span>
                        <strong className="text-[#1F2937] text-xs block truncate mt-0.5" title={farm.location?.address}>
                          {farm.location?.district || farm.location?.state || farm.location?.address || 'Not set'}
                        </strong>
                      </div>

                      {/* Area */}
                      <div className="p-3 rounded-xl bg-[#F8F8F4] border border-[#E5E7EB]">
                        <span className="text-[10px] text-[#6B7280] block uppercase font-bold">Area</span>
                        <strong className="text-[#1F2937] text-xs block mt-0.5">
                          {displayAcreage > 0
                            ? `${displayAcreage} ${farm.sizeUnit || 'acres'}`
                            : farm.size
                            ? `${farm.size} ${farm.sizeUnit || 'acres'}`
                            : 'Not set yet'}
                        </strong>
                      </div>

                      {/* Crop & Variety */}
                      <div className="p-3 rounded-xl bg-[#F8F8F4] border border-[#E5E7EB]">
                        <span className="text-[10px] text-[#6B7280] block uppercase font-bold">Crop</span>
                        <strong className="text-[#166534] text-xs block mt-0.5">
                          {farm.crop?.name || farm.crop_variety ? (
                            <>
                              {farm.crop?.name || farm.crop_variety}
                              {farm.crop?.variety ? ` (${farm.crop.variety})` : ''}
                            </>
                          ) : (
                            <span className="text-[#6B7280] font-normal">Not registered yet</span>
                          )}
                        </strong>
                      </div>

                      {/* Crop Stage (Farmer-friendly: Not set yet / Add sowing date to estimate crop stage) */}
                      <div className="p-3 rounded-xl bg-[#F8F8F4] border border-[#E5E7EB]">
                        <span className="text-[10px] text-[#6B7280] block uppercase font-bold">Crop Stage</span>
                        <div className="mt-0.5">
                          {farm.crop?.stage ? (
                            <strong className="text-[#1F2937] text-xs block">{farm.crop.stage}</strong>
                          ) : cropStageInfo.status === 'valid' ? (
                            <div>
                              <strong className="text-[#1F2937] text-xs block">{cropStageInfo.stage}</strong>
                              <div className="w-full bg-[#E5E7EB] h-1.5 rounded-full overflow-hidden mt-1.5">
                                <div
                                  className="bg-[#166534] h-full rounded-full"
                                  style={{ width: `${cropStageInfo.progressPercent}%` }}
                                />
                              </div>
                            </div>
                          ) : (
                            <div>
                              <strong className="text-[#6B7280] text-xs block font-normal">Not set yet</strong>
                              <span className="text-[10px] text-[#6B7280] block mt-0.5">
                                Add sowing date to estimate crop stage.
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Irrigation */}
                      <div className="p-3 rounded-xl bg-[#F8F8F4] border border-[#E5E7EB]">
                        <span className="text-[10px] text-[#6B7280] block uppercase font-bold">Irrigation</span>
                        <strong className="text-[#1F2937] text-xs block mt-0.5">
                          {farm.irrigationType || farm.irrigation_type ? (
                            `${farm.irrigationType || farm.irrigation_type} System`
                          ) : (
                            <span className="text-[#6B7280] font-normal">Not set yet</span>
                          )}
                        </strong>
                      </div>

                      {/* Soil */}
                      <div className="p-3 rounded-xl bg-[#F8F8F4] border border-[#E5E7EB]">
                        <span className="text-[10px] text-[#6B7280] block uppercase font-bold">Soil</span>
                        <strong className="text-[#1F2937] text-xs block mt-0.5">
                          {farm.soil?.soilType || farm.soil_type || (
                            <span className="text-[#6B7280] font-normal">Not tested yet</span>
                          )}
                        </strong>
                      </div>

                      {/* Sowing Date (spans 2 columns) */}
                      <div className="p-3 rounded-xl bg-[#F8F8F4] border border-[#E5E7EB] sm:col-span-2">
                        <span className="text-[10px] text-[#6B7280] block uppercase font-bold">Sowing Date</span>
                        <strong className="text-[#1F2937] text-xs block mt-0.5">
                          {farm.crop?.sowingDate || farm.sowing_date || (
                            <span className="text-[#6B7280] font-normal">Not set yet</span>
                          )}
                        </strong>
                      </div>
                    </div>
                  </Card>

                  {/* 2. Simple Farm Status: TODAY ON YOUR FARM (Real Data Only) */}
                  <Card className="p-5 bg-white border-[#E5E7EB] shadow-xs">
                    <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB] mb-3">
                      <h3 className="font-bold text-[#1F2937] text-xs uppercase tracking-wider">
                        TODAY ON YOUR FARM
                      </h3>
                      <span className="text-[10px] font-semibold text-[#166534] bg-[#EAF4EC] border border-[#D1E7D6] px-2 py-0.5 rounded-full">
                        Real Farm Data
                      </span>
                    </div>

                    <div className="space-y-2.5 text-xs">
                      {/* Weather Pillar */}
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F8F8F4] border border-[#E5E7EB]">
                        <div className="flex items-center gap-2">
                          <CloudSun className="w-4 h-4 text-[#2563EB]" />
                          <span className="font-semibold text-[#1F2937]">Weather</span>
                        </div>
                        <div>
                          {farm.weather?.temperature !== undefined ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-[#166534]">
                              <span>🟢 Normal</span>
                              <span className="text-[#6B7280] font-normal text-[11px]">
                                ({farm.weather.temperature}°C • {farm.weather.condition || 'Clear'})
                              </span>
                            </span>
                          ) : (
                            <span className="text-[#6B7280]">⚪ Data unavailable</span>
                          )}
                        </div>
                      </div>

                      {/* Crop Pillar */}
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F8F8F4] border border-[#E5E7EB]">
                        <div className="flex items-center gap-2">
                          <Sprout className="w-4 h-4 text-[#166534]" />
                          <span className="font-semibold text-[#1F2937]">Crop</span>
                        </div>
                        <div>
                          {farm.crop?.name ? (
                            activeFarmCases.length > 0 ? (
                              <span className="text-[#D97706] font-semibold">🟡 Check Needed</span>
                            ) : (
                              <span className="text-[#166534] font-semibold">🟢 Good ({farm.crop.name})</span>
                            )
                          ) : (
                            <span className="text-[#6B7280]">⚪ Data unavailable</span>
                          )}
                        </div>
                      </div>

                      {/* Soil Pillar */}
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F8F8F4] border border-[#E5E7EB]">
                        <div className="flex items-center gap-2">
                          <Droplets className="w-4 h-4 text-[#2563EB]" />
                          <span className="font-semibold text-[#1F2937]">Soil</span>
                        </div>
                        <div>
                          {farm.soil?.moisturePercentage ? (
                            <span className="text-[#166534] font-semibold">
                              🟢 Good ({farm.soil.moisturePercentage}% Moisture)
                            </span>
                          ) : farm.soil?.soilType ? (
                            <span className="text-[#166534] font-semibold">
                              🟢 Good ({farm.soil.soilType})
                            </span>
                          ) : (
                            <span className="text-[#6B7280]">⚪ Data unavailable</span>
                          )}
                        </div>
                      </div>

                      {/* Attention Pillar */}
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F8F8F4] border border-[#E5E7EB]">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-[#D97706]" />
                          <span className="font-semibold text-[#1F2937]">Attention</span>
                        </div>
                        <div>
                          {activeFarmCases.length > 0 ? (
                            <span className="text-[#D97706] font-semibold">
                              🟡 {activeFarmCases.length} {activeFarmCases.length === 1 ? 'action' : 'actions'}
                            </span>
                          ) : (
                            <span className="text-[#166534] font-semibold">🟢 All clear</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* 3. Primary Action: 🤖 Ask KRISHVYA */}
                  <div className="p-4 rounded-2xl bg-[#EAF4EC] border border-[#D1E7D6] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                    <div className="space-y-0.5">
                      <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#166534]">
                        <Bot className="w-4 h-4 text-[#166534]" />
                        <span>Ask KRISHVYA</span>
                      </div>
                      <p className="text-xs text-[#1F2937] font-medium">
                        Ask questions about your {farm.crop?.name || 'crop'}, soil, or weather
                      </p>
                    </div>
                    <Link
                      to="/ai-advisor"
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#166534] hover:bg-[#14532D] text-white text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer"
                    >
                      <span>What should I do today?</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  {/* 4. Compact Farm Activities Log */}
                  <Card className="p-5 bg-white border-[#E5E7EB] shadow-xs">
                    <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB] mb-3">
                      <h3 className="font-bold text-[#1F2937] text-xs uppercase tracking-wider flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-[#166534]" />
                        <span>Recent Activities</span>
                      </h3>
                      <span className="text-[10px] font-semibold text-[#6B7280]">
                        {allActivities.length} {allActivities.length === 1 ? 'record' : 'records'}
                      </span>
                    </div>

                    {loadingActivities ? (
                      <div className="text-center py-4 text-xs text-[#6B7280]">
                        Loading timeline...
                      </div>
                    ) : allActivities.length > 0 ? (
                      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                        {allActivities.map((act) => (
                          <div
                            key={act.id}
                            className="p-2.5 bg-[#F8F8F4] rounded-xl border border-[#E5E7EB] flex items-start gap-2.5 text-xs"
                          >
                            <div className="p-1 bg-[#EAF4EC] text-[#166534] rounded-lg shrink-0 mt-0.5">
                              {act.type === 'problem' ? (
                                <AlertCircle className="w-3 h-3 text-[#D97706]" />
                              ) : act.type === 'sowing' ? (
                                <Sprout className="w-3 h-3 text-[#166534]" />
                              ) : (
                                <Clock className="w-3 h-3 text-[#166534]" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-1">
                                <h4 className="text-xs font-bold text-[#1F2937] truncate">{act.title}</h4>
                                <span className="text-[10px] text-[#6B7280] shrink-0">
                                  {act.timestamp ? new Date(act.timestamp).toLocaleDateString() : ''}
                                </span>
                              </div>
                              {act.description && (
                                <p className="text-[11px] text-[#6B7280] mt-0.5 line-clamp-1">
                                  {act.description}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 px-3 bg-[#F8F8F4] rounded-xl border border-dashed border-[#E5E7EB]">
                        <Clock className="w-6 h-6 text-[#6B7280] mx-auto mb-1 opacity-60" />
                        <p className="text-xs font-semibold text-[#1F2937]">No activities recorded yet</p>
                        <p className="text-[10px] text-[#6B7280] mt-0.5">
                          Field events and boundary updates will appear here.
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
