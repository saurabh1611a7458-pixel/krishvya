import { Router } from 'express';

export const alertRoutes = Router();

const alertsDatabase = [
  {
    id: 'alt_01',
    category: 'weather',
    title: 'Heavy Rain Expected',
    description: 'Rainfall 40mm expected tomorrow. Consider postponing fertilizer and pesticide spraying.',
    timestamp: '2 hours ago',
    severity: 'high',
    actionableText: 'Delay Irrigation',
  },
  {
    id: 'alt_02',
    category: 'crop',
    title: 'Crop Stress Detected',
    description: 'NDVI vegetative anomaly observed in the northern border of your 2.5 acre field.',
    timestamp: '5 hours ago',
    severity: 'medium',
    actionableText: 'View Satellite Map',
  },
  {
    id: 'alt_03',
    category: 'soil',
    title: 'Soil Moisture Low in Sector B',
    description: 'Moisture dropped to 34% in upper soil tier. Prepare light drip irrigation if rain delays.',
    timestamp: '1 day ago',
    severity: 'medium',
    actionableText: 'Check Soil Status',
  },
  {
    id: 'alt_04',
    category: 'crop',
    title: 'High Disease Risk: Leaf Blight',
    description: 'Current humidity (72%) and warm temperature elevate risk of fungal leaf spots in soybean.',
    timestamp: '2 days ago',
    severity: 'high',
    actionableText: 'Scan Leaves Now',
  },
];

// GET /api/alerts
alertRoutes.get('/', (_req, res) => {
  res.json({
    success: true,
    total: alertsDatabase.length,
    data: alertsDatabase,
  });
});
