import { Router } from 'express';
import { fetchLiveWeather, fetchLiveSatelliteData } from '../services/weatherSatelliteService.js';
import { prisma } from '../db.js';
export const weatherRoutes = Router();
export const satelliteRoutes = Router();
async function resolveCoordinates(latParam, lonParam, farmId) {
    let lat = latParam ? parseFloat(latParam) : NaN;
    let lon = lonParam ? parseFloat(lonParam) : NaN;
    if (isNaN(lat) || isNaN(lon)) {
        if (farmId) {
            const farm = await prisma.farm.findUnique({ where: { id: farmId } });
            if (farm && typeof farm.latitude === 'number' && typeof farm.longitude === 'number') {
                return { lat: farm.latitude, lon: farm.longitude };
            }
        }
        const firstFarm = await prisma.farm.findFirst();
        if (firstFarm && typeof firstFarm.latitude === 'number' && typeof firstFarm.longitude === 'number') {
            return { lat: firstFarm.latitude, lon: firstFarm.longitude };
        }
        return { lat: 18.5204, lon: 73.8567 };
    }
    return { lat, lon };
}
// GET /api/weather/live
weatherRoutes.get('/live', async (req, res) => {
    try {
        const farmId = req.query.farmId;
        const { lat, lon } = await resolveCoordinates(req.query.lat, req.query.lon, farmId);
        const weather = await fetchLiveWeather(lat, lon, farmId);
        res.json({
            success: true,
            data: weather,
        });
    }
    catch (error) {
        console.error('Fetch live weather error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve live weather data',
            error: error.message,
        });
    }
});
// GET /api/satellite/live
satelliteRoutes.get('/live', async (req, res) => {
    try {
        const farmId = req.query.farmId;
        const { lat, lon } = await resolveCoordinates(req.query.lat, req.query.lon, farmId);
        const satellite = await fetchLiveSatelliteData(lat, lon, farmId);
        res.json({
            success: true,
            data: satellite,
        });
    }
    catch (error) {
        console.error('Fetch live satellite error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve live satellite data',
            error: error.message,
        });
    }
});
