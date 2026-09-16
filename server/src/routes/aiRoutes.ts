import { Router, Response } from 'express';
import { prisma } from '../db.js';
import { AuthenticatedRequest, optionalAuthMiddleware } from '../middleware/authMiddleware.js';
import { diagnoseCropDisease, chatFarmAdvisor, generateDailyFarmPlan } from '../services/geminiService.js';

export const aiRoutes = Router();

// POST /api/ai/diagnose - Multimodal Leaf Disease Detection
aiRoutes.post('/diagnose', optionalAuthMiddleware, async (req: AuthenticatedRequest, res: Response) => {
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
  } catch (error: any) {
    console.error('AI diagnose route error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process AI crop diagnosis.',
      error: error.message,
    });
  }
});

// GET & POST /api/ai/daily-plan - Personalized 7-Card Agricultural Daily Plan
const handleDailyPlan = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const language = (req.query.language || req.body.language || 'english') as string;
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

    const pastCases = await prisma.problemCase.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const result = await generateDailyFarmPlan(farmContext, pastCases, language);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('AI daily plan route error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate personalized daily farm plan.',
      error: error.message,
    });
  }
};

aiRoutes.get('/daily-plan', optionalAuthMiddleware, handleDailyPlan);
aiRoutes.post('/daily-plan', optionalAuthMiddleware, handleDailyPlan);

// POST /api/ai/advisor - Context-Grounded Conversational Agronomist
aiRoutes.post('/advisor', optionalAuthMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { message, history = [], language = 'english' } = req.body;

    if (!message) {
      res.status(400).json({ success: false, message: 'Message prompt is required.' });
      return;
    }

    // Retrieve live farm context from database for grounding
    let farmContext = req.body.farmContext;

    const farm = await prisma.farm.findFirst({
      include: { crop: true, soil: true, weather: true, satellite: true },
    });

    if (!farmContext && farm) {
      farmContext = {
        location: { address: farm.address, district: farm.district, state: farm.state },
        crop: farm.crop,
        soil: farm.soil,
        weather: farm.weather,
        size: farm.size,
        irrigationType: farm.irrigationType,
      };
    }

    const pastCases = await prisma.problemCase.findMany({
      orderBy: { createdAt: 'desc' },
      take: 3,
    });

    const { reply, aiEngine, confidence, requiresExpertReview } = await chatFarmAdvisor(
      message,
      history,
      farmContext,
      language,
      [],
      pastCases
    );

    res.json({
      success: true,
      data: {
        reply,
        aiEngine,
        confidence,
        requiresExpertReview,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('AI advisor route error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate farm advisory.',
      error: error.message,
    });
  }
});

// POST /api/ai/feedback - Farmer rating (thumbs up / thumbs down)
aiRoutes.post('/feedback', optionalAuthMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { rating, feedbackNotes } = req.body;
    console.log(`👍/👎 [AI Feedback] Received rating: ${rating}, notes: ${feedbackNotes || 'None'}`);

    res.json({
      success: true,
      message: 'Feedback successfully recorded.',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/ai/memory - Retrieve farm problem history & past advice
aiRoutes.get('/memory', optionalAuthMiddleware, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const cases = await prisma.problemCase.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    res.json({
      success: true,
      data: cases,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/ai/escalate - 1-Tap escalation to human agronomist
aiRoutes.post('/escalate', optionalAuthMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, description, category = 'crop', aiRecommendation, confidenceScore = 70 } = req.body;

    const farm = await prisma.farm.findFirst();
    const newCase = await prisma.problemCase.create({
      data: {
        farmerId: req.user?.id || 'farmer_guest',
        farmId: farm?.id || 'farm_default',
        category,
        title: title || 'Low-Confidence AI Case Escalation',
        description: description || 'Farmer requested agronomist review following AI advisory.',
        status: 'expert_review',
        confidenceScore: Number(confidenceScore),
        aiRecommendation,
      },
    });

    res.json({
      success: true,
      message: 'Case escalated to agricultural expert desk.',
      data: newCase,
    });
  } catch (error: any) {
    console.error('Escalate error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
