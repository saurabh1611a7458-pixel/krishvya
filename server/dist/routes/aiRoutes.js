import { Router } from 'express';
import { prisma } from '../db.js';
import { optionalAuthMiddleware } from '../middleware/authMiddleware.js';
import { diagnoseCropDisease, chatFarmAdvisor, generateDailyFarmPlan } from '../services/geminiService.js';
export const aiRoutes = Router();
// Verified Agricultural Knowledge Dataset (ICAR, data.gov.in, FAOSTAT, SoilGrids)
const AGRI_KNOWLEDGE_BASE = [
    {
        crop: 'Soybean',
        category: 'irrigation',
        keywords: ['water', 'irrigate', 'watering', 'rain', 'rainy', 'wet'],
        snippet: 'ICAR-IISR Indore: If field received recent rain or soil moisture >60%, avoid watering. Soybean is sensitive to waterlogging during flowering and pod development. Ensure drainage channels are open.',
    },
    {
        crop: 'Soybean',
        category: 'nutrition',
        keywords: ['yellow', 'pale', 'chlorosis', 'leaves yellow'],
        snippet: 'ICAR-IISR Indore: Yellow leaves in soybean indicate either: 1) Nitrogen deficiency if lower leaves turn pale uniformly; 2) Iron Chlorosis if young upper leaves show green veins with yellow lamina in calcareous soil (spray FeSO4 0.5% + citric acid 0.1%); 3) Waterlogging; 4) Yellow Mosaic Virus transmitted by whiteflies.',
    },
    {
        crop: 'Cotton',
        category: 'irrigation',
        keywords: ['water', 'irrigate', 'watering', 'rain'],
        snippet: 'ICAR-CICR Nagpur: Critical irrigation stages in Cotton are squaring, flowering, and boll development. Excess water causes boll rot and shedding. Avoid irrigation if rain probability >50%.',
    },
    {
        crop: 'Cotton',
        category: 'disease',
        keywords: ['yellow', 'curl', 'curling', 'leaves', 'pest'],
        snippet: 'ICAR-CICR Nagpur: Leaf curl and yellowing in cotton is often Cotton Leaf Curl Virus (CLCuV) transmitted by whiteflies. Install yellow sticky traps (10/acre) and spray NSKE 5% or Flonicamid 50 WG @ 0.3g/L.',
    },
    {
        crop: 'Wheat',
        category: 'irrigation',
        keywords: ['water', 'irrigate', 'watering', 'rain'],
        snippet: 'ICAR-IIWBR Karnal: Crown Root Initiation (CRI) stage at 20-25 days after sowing is the most critical irrigation window for wheat. Delay causes up to 25% yield loss.',
    },
    {
        crop: 'General',
        category: 'weather',
        keywords: ['heavy rain', 'rain', 'waterlogging', 'standing water', 'drainage'],
        snippet: 'data.gov.in & ICAR Agronomy: Immediately drain standing water within 12-24 hours through perimeter trenches. Do NOT apply urea immediately to waterlogged soil. Break soil crust when surface dries to restore root aeration.',
    },
    {
        crop: 'General',
        category: 'crop_rotation',
        keywords: ['next', 'plant next', 'grow next', 'crop rotation', 'which crop'],
        snippet: 'FAOSTAT & ICAR Directorate of Cropping Systems: Follow cereals with legumes to restore nitrogen. After Kharif Soybean/Maize, plant Rabi Chickpea (Gram/Chana) or Mustard under limited water, or Wheat under assured irrigation.',
    },
    {
        crop: 'General',
        category: 'soil',
        keywords: ['soil', 'improve', 'carbon', 'fertility', 'fym', 'organic'],
        snippet: 'SoilGrids & ICAR Soil Health Card: Incorporate well-decomposed FYM or vermicompost @ 4-5 tonnes/acre. Practice green manuring with Dhaincha (Sesbania) every 2-3 years. Avoid residue burning to raise Soil Organic Carbon above 0.75%.',
    },
    {
        crop: 'General',
        category: 'growth',
        keywords: ['stunted', 'growing', 'properly', 'growth', 'slow', 'not growing'],
        snippet: 'ICAR Agronomy Guidelines: Check root zones for compaction, nematodes, or root rot. If roots are healthy, stunted growth typically stems from Zinc/Phosphorus deficiency or soil pH imbalance. Apply Chelated Zinc EDTA @ 1g/L + 12:61:00 @ 5g/L.',
    },
];
function getRelevantKnowledge(cropName = '', question = '') {
    const normalizedQ = question.toLowerCase();
    const normalizedCrop = cropName.toLowerCase();
    const matched = [];
    for (const item of AGRI_KNOWLEDGE_BASE) {
        const cropMatch = item.crop === 'General' || normalizedCrop.includes(item.crop.toLowerCase());
        const keywordMatch = item.keywords.some(k => normalizedQ.includes(k));
        if (cropMatch && keywordMatch) {
            matched.push(item.snippet);
            if (matched.length >= 3)
                break;
        }
    }
    return matched;
}
// POST /api/ai/diagnose - Multimodal Leaf Disease Detection
aiRoutes.post('/diagnose', optionalAuthMiddleware, async (req, res) => {
    try {
        const { imageBase64, mimeType = 'image/jpeg', cropName = 'Soybean', notes = '' } = req.body;
        if (!imageBase64 && !notes) {
            res.status(400).json({
                success: false,
                message: 'Please provide a leaf image or crop symptoms description for diagnosis.',
            });
            return;
        }
        const result = await diagnoseCropDisease(imageBase64 || '', mimeType, cropName, notes);
        res.json({
            success: true,
            message: 'Crop diagnosis completed successfully.',
            data: result,
        });
    }
    catch (error) {
        console.error('AI diagnose route error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process AI crop diagnosis.',
            error: error.message,
        });
    }
});
// GET & POST /api/ai/daily-plan - Personalized 7-Card Agricultural Daily Plan
const handleDailyPlan = async (req, res) => {
    try {
        const language = (req.query.language || req.body.language || 'english');
        let farmContext = req.body.farmContext;
        const farm = await prisma.farm.findFirst({
            include: { crop: true, soil: true, weather: true, satellite: true },
        });
        if (!farmContext && farm) {
            farmContext = {
                id: farm.id,
                location: { address: farm.address, district: farm.district, state: farm.state },
                crop: farm.crop,
                soil: farm.soil,
                weather: farm.weather,
                size: farm.size,
                irrigationType: farm.irrigationType,
            };
        }
        const result = await generateDailyFarmPlan(farmContext, language);
        res.json({ success: true, data: result });
    }
    catch (error) {
        console.error('AI daily-plan route error:', error);
        res.status(500).json({ success: false, message: 'Failed to generate farm plan', error: error.message });
    }
};
aiRoutes.get('/daily-plan', optionalAuthMiddleware, handleDailyPlan);
aiRoutes.post('/daily-plan', optionalAuthMiddleware, handleDailyPlan);
// POST /api/ai/advisor - Context-Grounded Conversational Agronomist
aiRoutes.post('/advisor', optionalAuthMiddleware, async (req, res) => {
    try {
        const { message, history = [], language = 'english' } = req.body;
        if (!message || !message.trim()) {
            res.status(400).json({ success: false, errorType: 'BAD_REQUEST', message: 'Message prompt is required.' });
            return;
        }
        // Retrieve farm context from request body or authenticated user
        let farmContext = req.body.farmContext;
        if (!farmContext && req.user?.id) {
            try {
                const userFarm = await prisma.farm.findFirst({
                    where: { ownerId: req.user.id },
                    include: { crop: true, soil: true, weather: true, satellite: true },
                });
                if (userFarm) {
                    farmContext = {
                        name: userFarm.name,
                        location: { address: userFarm.address, district: userFarm.district, state: userFarm.state },
                        crop: userFarm.crop,
                        soil: userFarm.soil,
                        weather: userFarm.weather,
                        size: userFarm.size,
                        irrigationType: userFarm.irrigationType,
                    };
                }
            }
            catch (dbErr) {
                console.error('[AI Advisor Error] Farm data could not be loaded from database:', dbErr);
                res.status(500).json({
                    success: false,
                    errorType: 'FARM_DATA_ERROR',
                    message: 'Farm data could not be loaded.',
                });
                return;
            }
        }
        const cropName = farmContext?.crop?.name || '';
        const knowledgeSnippets = getRelevantKnowledge(cropName, message);
        const pastCases = req.user?.id
            ? await prisma.problemCase.findMany({
                where: { farmerId: req.user.id },
                orderBy: { createdAt: 'desc' },
                take: 3,
            }).catch(() => [])
            : [];
        const result = await chatFarmAdvisor(message, history, farmContext, language, [], pastCases, knowledgeSnippets);
        // Handle explicit failure scenarios without generic catch-alls
        if (result.errorType === 'API_KEY_MISSING') {
            res.status(503).json({
                success: false,
                errorType: 'API_KEY_MISSING',
                message: 'AI service is not configured.',
                devDetails: result.rawError,
            });
            return;
        }
        if (result.errorType === 'GEMINI_ERROR') {
            res.status(500).json({
                success: false,
                errorType: 'GEMINI_ERROR',
                message: result.reply,
                devDetails: result.rawError,
            });
            return;
        }
        res.json({
            success: true,
            data: {
                reply: result.reply,
                aiEngine: result.aiEngine,
                confidence: result.confidence,
                requiresExpertReview: result.requiresExpertReview,
                knowledgeSources: ['ICAR', 'data.gov.in', 'FAOSTAT', 'SoilGrids'],
                timestamp: new Date().toISOString(),
            },
        });
    }
    catch (error) {
        console.error('⚠️ [AI Advisor Route Error] Stack:', error);
        res.status(500).json({
            success: false,
            errorType: 'SERVER_ERROR',
            message: error?.message || 'Internal server error in farm advisor.',
        });
    }
});
// POST /api/ai/feedback - Farmer rating
aiRoutes.post('/feedback', optionalAuthMiddleware, async (req, res) => {
    try {
        const { rating, feedbackNotes } = req.body;
        console.log(`👍/👎 [AI Feedback] Rating: ${rating}, notes: ${feedbackNotes || 'None'}`);
        res.json({ success: true, message: 'Feedback logged.' });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
export default aiRoutes;
