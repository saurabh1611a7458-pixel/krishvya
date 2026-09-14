import { Router, Request, Response } from 'express';
import { fetchLiveWeather, fetchLiveSatelliteData } from '../services/weatherSatelliteService.js';

export const weatherRoutes = Router();
export const satelliteRoutes = Router();

// GET /api/weather/live
weatherRoutes.get('/live', async (req: Request, res: Response) => {
  try {
    const lat = req.query.lat ? parseFloat(req.query.lat as string) : 21.3855;
    const lon = req.query.lon ? parseFloat(req.query.lon as string) : 78.9189;
    const farmId = req.query.farmId as string | undefined;

    const weather = await fetchLiveWeather(lat, lon, farmId);

    res.json({
      success: true,
      data: weather,
    });
  } catch (error: any) {
    console.error('Fetch live weather error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve live weather data',
      error: error.message,
    });
  }
});

// GET /api/satellite/live
satelliteRoutes.get('/live', async (req: Request, res: Response) => {
  try {
    const lat = req.query.lat ? parseFloat(req.query.lat as string) : 21.3855;
    const lon = req.query.lon ? parseFloat(req.query.lon as string) : 78.9189;
    const farmId = req.query.farmId as string | undefined;

    const satellite = await fetchLiveSatelliteData(lat, lon, farmId);

    res.json({
      success: true,
      data: satellite,
    });
  } catch (error: any) {
    console.error('Fetch live satellite error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve live satellite data',
      error: error.message,
    });
  }
});
