import { Router } from 'express';
import { prisma } from '../db.js';
import { optionalAuthMiddleware } from '../middleware/authMiddleware.js';
export const farmRoutes = Router();
function formatFarmResponse(farm, owner) {
    return {
        id: farm.id,
        name: farm.name,
        owner: {
            id: owner?.id || farm.ownerId,
            name: owner?.name || 'Farmer',
            phone: owner?.phone || '',
            email: owner?.email || '',
            role: (owner?.role || 'FARMER').toLowerCase(),
            preferredLanguage: (owner?.preferredLanguage || 'ENGLISH').toLowerCase(),
            location: `${farm.district}, ${farm.state}`,
        },
        location: {
            address: farm.address,
            district: farm.district,
            state: farm.state,
            latitude: farm.latitude,
            longitude: farm.longitude,
        },
        size: farm.size,
        sizeUnit: farm.sizeUnit,
        farmHealthScore: farm.farmHealthScore,
        irrigationType: farm.irrigationType,
        crop: farm.crop
            ? {
                name: farm.crop.name,
                variety: farm.crop.variety || '',
                stage: farm.crop.stage,
                sowingDate: farm.crop.sowingDate ? new Date(farm.crop.sowingDate).toLocaleDateString('en-GB') : '',
            }
            : {
                name: 'Soybean',
                variety: 'JS-335 Gold',
                stage: 'Flowering',
                sowingDate: '15 June 2024',
            },
        soil: farm.soil
            ? {
                healthScore: farm.soil.healthScore,
                nitrogen: farm.soil.nitrogen,
                phosphorus: farm.soil.phosphorus,
                potassium: farm.soil.potassium,
                ph: farm.soil.ph,
                organicCarbon: farm.soil.organicCarbon,
                moisturePercentage: farm.soil.moisturePercentage,
                soilType: farm.soil.soilType,
            }
            : {
                healthScore: 78,
                nitrogen: 'Good',
                phosphorus: 'Medium',
                potassium: 'Good',
                ph: 6.7,
                organicCarbon: 'Medium (0.6%)',
                moisturePercentage: 42,
                soilType: 'Loamy Black Cotton',
            },
        weather: farm.weather
            ? {
                temperature: farm.weather.temperature,
                condition: farm.weather.condition,
                rainProbability: farm.weather.rainProbability,
                humidity: farm.weather.humidity,
                windSpeedKmh: farm.weather.windSpeedKmh,
                advice: farm.weather.advice,
            }
            : {
                temperature: 28,
                condition: 'Partly Cloudy',
                rainProbability: 60,
                humidity: 72,
                windSpeedKmh: 12,
                advice: 'Optimal weather for field observation.',
            },
        satellite: farm.satellite
            ? {
                healthScore: farm.satellite.healthScore,
                ndvi: farm.satellite.ndvi,
                lastUpdated: 'Recently updated',
                stressDetected: farm.satellite.stressDetected,
            }
            : {
                healthScore: 82,
                ndvi: 0.78,
                lastUpdated: 'Yesterday at 4:30 PM',
                stressDetected: false,
            },
    };
}
// GET /api/farm
farmRoutes.get('/', optionalAuthMiddleware, async (req, res) => {
    try {
        const userId = req.user?.id;
        let farm = null;
        if (userId) {
            farm = await prisma.farm.findFirst({
                where: { ownerId: userId },
                include: {
                    owner: true,
                    crop: true,
                    soil: true,
                    weather: true,
                    satellite: true,
                },
            });
        }
        if (!farm) {
            farm = await prisma.farm.findFirst({
                include: {
                    owner: true,
                    crop: true,
                    soil: true,
                    weather: true,
                    satellite: true,
                },
            });
        }
        if (!farm) {
            res.status(404).json({ success: false, message: 'No farm record found.' });
            return;
        }
        const response = formatFarmResponse(farm, farm.owner);
        res.json({
            success: true,
            data: response,
        });
    }
    catch (error) {
        console.error('Fetch farm error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch farm data', error: error.message });
    }
});
// PUT /api/farm
farmRoutes.put('/', optionalAuthMiddleware, async (req, res) => {
    try {
        const userId = req.user?.id;
        const updates = req.body;
        let targetFarm = null;
        if (userId) {
            targetFarm = await prisma.farm.findFirst({ where: { ownerId: userId } });
        }
        if (!targetFarm) {
            targetFarm = await prisma.farm.findFirst();
        }
        if (!targetFarm) {
            res.status(404).json({ success: false, message: 'Farm not found to update.' });
            return;
        }
        // Update basic farm properties
        const updatedFarm = await prisma.farm.update({
            where: { id: targetFarm.id },
            data: {
                name: updates.name || undefined,
                size: updates.size !== undefined ? Number(updates.size) : undefined,
                sizeUnit: updates.sizeUnit || undefined,
                irrigationType: updates.irrigationType || undefined,
                farmHealthScore: updates.farmHealthScore !== undefined ? Number(updates.farmHealthScore) : undefined,
                ...(updates.crop
                    ? {
                        crop: {
                            upsert: {
                                create: {
                                    name: updates.crop.name || 'Soybean',
                                    variety: updates.crop.variety || '',
                                    stage: updates.crop.stage || 'FLOWERING',
                                    sowingDate: new Date(),
                                },
                                update: {
                                    name: updates.crop.name,
                                    variety: updates.crop.variety,
                                    stage: updates.crop.stage,
                                },
                            },
                        },
                    }
                    : {}),
                ...(updates.soil
                    ? {
                        soil: {
                            upsert: {
                                create: {
                                    healthScore: updates.soil.healthScore || 78,
                                    nitrogen: updates.soil.nitrogen || 'Good',
                                    phosphorus: updates.soil.phosphorus || 'Medium',
                                    potassium: updates.soil.potassium || 'Good',
                                    ph: updates.soil.ph || 6.7,
                                    soilType: updates.soil.soilType || 'Loamy Black Cotton',
                                },
                                update: {
                                    healthScore: updates.soil.healthScore,
                                    nitrogen: updates.soil.nitrogen,
                                    phosphorus: updates.soil.phosphorus,
                                    potassium: updates.soil.potassium,
                                    ph: updates.soil.ph,
                                    soilType: updates.soil.soilType,
                                },
                            },
                        },
                    }
                    : {}),
            },
            include: {
                owner: true,
                crop: true,
                soil: true,
                weather: true,
                satellite: true,
            },
        });
        res.json({
            success: true,
            message: 'Farm data updated successfully in live database.',
            data: formatFarmResponse(updatedFarm, updatedFarm.owner),
        });
    }
    catch (error) {
        console.error('Update farm error:', error);
        res.status(500).json({ success: false, message: 'Failed to update farm data', error: error.message });
    }
});
