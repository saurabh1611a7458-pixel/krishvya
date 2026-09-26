import { Router } from 'express';
import { prisma } from '../db.js';
import { optionalAuthMiddleware } from '../middleware/authMiddleware.js';
export const farmRoutes = Router();
function formatFarmResponse(farm, owner) {
    return {
        id: farm.id,
        name: farm.name,
        ownerId: farm.ownerId,
        owner: owner
            ? {
                id: owner.id || farm.ownerId,
                name: owner.name || 'Farmer',
                phone: owner.phone || '',
                email: owner.email || '',
                role: (owner.role || 'FARMER').toLowerCase(),
                preferredLanguage: (owner.preferredLanguage || 'ENGLISH').toLowerCase(),
                location: `${farm.district || ''}, ${farm.state || ''}`.trim(),
            }
            : undefined,
        location: {
            address: farm.address || '',
            district: farm.district || '',
            state: farm.state || '',
            latitude: farm.latitude || 0,
            longitude: farm.longitude || 0,
        },
        size: farm.size || 0,
        sizeUnit: farm.sizeUnit || 'acres',
        farmHealthScore: farm.farmHealthScore || 80,
        irrigationType: farm.irrigationType || 'Drip',
        crop: farm.crop
            ? {
                id: farm.crop.id,
                name: farm.crop.name,
                variety: farm.crop.variety || '',
                stage: farm.crop.stage || 'Flowering',
                sowingDate: farm.crop.sowingDate ? new Date(farm.crop.sowingDate).toLocaleDateString('en-GB') : '',
            }
            : null,
        soil: farm.soil
            ? {
                healthScore: farm.soil.healthScore || 0,
                nitrogen: farm.soil.nitrogen || 'Good',
                phosphorus: farm.soil.phosphorus || 'Medium',
                potassium: farm.soil.potassium || 'Good',
                ph: farm.soil.ph || 6.8,
                organicCarbon: farm.soil.organicCarbon || '',
                moisturePercentage: farm.soil.moisturePercentage || 0,
                soilType: farm.soil.soilType || 'Loamy',
            }
            : null,
        weather: farm.weather
            ? {
                temperature: farm.weather.temperature,
                condition: farm.weather.condition,
                rainProbability: farm.weather.rainProbability,
                humidity: farm.weather.humidity,
                windSpeedKmh: farm.weather.windSpeedKmh,
                advice: farm.weather.advice,
            }
            : null,
        satellite: farm.satellite
            ? {
                healthScore: farm.satellite.healthScore,
                ndvi: farm.satellite.ndvi,
                lastUpdated: 'Recently updated',
                stressDetected: farm.satellite.stressDetected,
            }
            : null,
    };
}
// GET /api/farm/all - Fetch all farms for authenticated user
farmRoutes.get('/all', optionalAuthMiddleware, async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.json({ success: true, data: [] });
            return;
        }
        const farms = await prisma.farm.findMany({
            where: { ownerId: userId },
            include: {
                owner: true,
                crop: true,
                soil: true,
                weather: true,
                satellite: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json({
            success: true,
            data: farms.map((f) => formatFarmResponse(f, f.owner)),
        });
    }
    catch (error) {
        console.error('Fetch all farms error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch farms', error: error.message });
    }
});
// GET /api/farm - Fetch single farm for authenticated user
farmRoutes.get('/', optionalAuthMiddleware, async (req, res) => {
    try {
        const userId = req.user?.id;
        const farmId = typeof req.query.id === 'string' ? req.query.id : undefined;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Authentication required to access farm.' });
            return;
        }
        let farm = null;
        if (farmId) {
            farm = await prisma.farm.findFirst({
                where: { id: farmId, ownerId: userId },
                include: {
                    owner: true,
                    crop: true,
                    soil: true,
                    weather: true,
                    satellite: true,
                },
            });
        }
        else {
            farm = await prisma.farm.findFirst({
                where: { ownerId: userId },
                include: {
                    owner: true,
                    crop: true,
                    soil: true,
                    weather: true,
                    satellite: true,
                },
                orderBy: { createdAt: 'desc' },
            });
        }
        if (!farm) {
            res.status(404).json({ success: false, message: 'No farm record found for this user.' });
            return;
        }
        res.json({
            success: true,
            data: formatFarmResponse(farm, farm.owner),
        });
    }
    catch (error) {
        console.error('Fetch farm error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch farm data', error: error.message });
    }
});
// POST /api/farm - Create a new farm parcel for authenticated user
farmRoutes.post('/', optionalAuthMiddleware, async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Authentication required to create a farm.' });
            return;
        }
        const payload = req.body;
        const farmId = payload.id || `farm_${Date.now()}`;
        // Ensure owner user exists in database or create lightweight placeholder
        const existingUser = await prisma.user.findUnique({ where: { id: userId } });
        if (!existingUser) {
            await prisma.user.create({
                data: {
                    id: userId,
                    name: req.user?.name || 'Farmer',
                    phone: req.user?.phone || `usr_${Date.now()}`,
                    role: 'FARMER',
                },
            }).catch((e) => console.warn('User upsert note:', e.message));
        }
        const createdFarm = await prisma.farm.create({
            data: {
                id: farmId,
                name: payload.name || 'New Farm Parcel',
                ownerId: userId,
                address: payload.location?.address || payload.address || 'Location not set',
                district: payload.location?.district || payload.district || '',
                state: payload.location?.state || payload.state || '',
                latitude: typeof payload.location?.latitude === 'number' ? payload.location.latitude : (typeof payload.latitude === 'number' ? payload.latitude : 0),
                longitude: typeof payload.location?.longitude === 'number' ? payload.location.longitude : (typeof payload.longitude === 'number' ? payload.longitude : 0),
                size: Number(payload.size) || 1,
                sizeUnit: payload.sizeUnit || 'acres',
                farmHealthScore: Number(payload.farmHealthScore) || 82,
                irrigationType: payload.irrigationType || 'Drip',
                ...(payload.crop?.name
                    ? {
                        crop: {
                            create: {
                                name: payload.crop.name,
                                variety: payload.crop.variety || '',
                                stage: payload.crop.stage || 'Flowering',
                                sowingDate: payload.crop.sowingDate ? new Date(payload.crop.sowingDate) : new Date(),
                            },
                        },
                    }
                    : {}),
                ...(payload.soil?.soilType
                    ? {
                        soil: {
                            create: {
                                healthScore: Number(payload.soil.healthScore) || 78,
                                soilType: payload.soil.soilType,
                                ph: Number(payload.soil.ph) || 6.8,
                                nitrogen: payload.soil.nitrogen || 'Good',
                                phosphorus: payload.soil.phosphorus || 'Medium',
                                potassium: payload.soil.potassium || 'Good',
                                moisturePercentage: Number(payload.soil.moisturePercentage) || 40,
                                organicCarbon: payload.soil.organicCarbon || 'Medium',
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
        res.status(201).json({
            success: true,
            message: 'Farm parcel created successfully.',
            data: formatFarmResponse(createdFarm, createdFarm.owner),
        });
    }
    catch (error) {
        console.error('Create farm error:', error);
        res.status(500).json({ success: false, message: 'Failed to create farm parcel', error: error.message });
    }
});
// PUT /api/farm - Update farm belonging to authenticated user
farmRoutes.put('/', optionalAuthMiddleware, async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Authentication required to update farm.' });
            return;
        }
        const updates = req.body;
        const farmId = updates.id || (typeof req.query.id === 'string' ? req.query.id : undefined);
        let targetFarm = null;
        if (farmId) {
            targetFarm = await prisma.farm.findFirst({ where: { id: farmId, ownerId: userId } });
        }
        else {
            targetFarm = await prisma.farm.findFirst({ where: { ownerId: userId } });
        }
        if (!targetFarm) {
            res.status(404).json({ success: false, message: 'Farm not found or does not belong to you.' });
            return;
        }
        // Update basic farm properties
        const updatedFarm = await prisma.farm.update({
            where: { id: targetFarm.id },
            data: {
                name: updates.name || undefined,
                address: updates.location?.address || updates.address || undefined,
                district: updates.location?.district || updates.district || undefined,
                state: updates.location?.state || updates.state || undefined,
                latitude: typeof updates.location?.latitude === 'number'
                    ? updates.location.latitude
                    : (typeof updates.latitude === 'number' ? updates.latitude : undefined),
                longitude: typeof updates.location?.longitude === 'number'
                    ? updates.location.longitude
                    : (typeof updates.longitude === 'number' ? updates.longitude : undefined),
                size: updates.size !== undefined ? Number(updates.size) : undefined,
                sizeUnit: updates.sizeUnit || undefined,
                irrigationType: updates.irrigationType || undefined,
                farmHealthScore: updates.farmHealthScore !== undefined ? Number(updates.farmHealthScore) : undefined,
                ...(updates.crop?.name
                    ? {
                        crop: {
                            upsert: {
                                create: {
                                    name: updates.crop.name,
                                    variety: updates.crop.variety || '',
                                    stage: updates.crop.stage || 'FLOWERING',
                                    sowingDate: updates.crop.sowingDate ? new Date(updates.crop.sowingDate) : new Date(),
                                },
                                update: {
                                    name: updates.crop.name,
                                    variety: updates.crop.variety,
                                    stage: updates.crop.stage,
                                    ...(updates.crop.sowingDate ? { sowingDate: new Date(updates.crop.sowingDate) } : {}),
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
                                    soilType: updates.soil.soilType || 'Loamy',
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
// DELETE /api/farm/:id - Delete farm belonging to authenticated user
farmRoutes.delete('/:id', optionalAuthMiddleware, async (req, res) => {
    try {
        const userId = req.user?.id;
        const farmId = req.params.id;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Authentication required to delete farm.' });
            return;
        }
        const farm = await prisma.farm.findFirst({
            where: { id: farmId, ownerId: userId },
        });
        if (!farm) {
            res.status(404).json({ success: false, message: 'Farm not found or does not belong to you.' });
            return;
        }
        await prisma.farm.delete({ where: { id: farmId } });
        res.json({ success: true, message: 'Farm parcel deleted successfully.' });
    }
    catch (error) {
        console.error('Delete farm error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete farm parcel', error: error.message });
    }
});
