import { Router, Response } from 'express';
import { prisma } from '../db.js';
import { AuthenticatedRequest, optionalAuthMiddleware } from '../middleware/authMiddleware.js';
import { diagnoseCropDisease, chatFarmAdvisor } from '../services/geminiService.js';

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

// POST /api/ai/advisor - Context-Grounded Conversational Agronomist
aiRoutes.post('/advisor', optionalAuthMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { message, history = [], language = 'english' } = req.body;

    if (!message) {
      res.status(400).json({ success: false, message: 'Message prompt is required.' });
      return;
    }

    // Retrieve live farm context from SQLite database for grounding
    let farmContext = req.body.farmContext;

    if (!farmContext) {
      const userId = req.user?.id;
      let farm = null;
      if (userId) {
        farm = await prisma.farm.findFirst({
          where: { ownerId: userId },
          include: { crop: true, soil: true, weather: true, satellite: true },
        });
      }
      if (!farm) {
        farm = await prisma.farm.findFirst({
          include: { crop: true, soil: true, weather: true, satellite: true },
        });
      }

      if (farm) {
        farmContext = {
          location: { address: farm.address, district: farm.district, state: farm.state },
          crop: farm.crop,
          soil: farm.soil,
          weather: farm.weather,
          irrigationType: farm.irrigationType,
        };
      }
    }

    const { reply, aiEngine } = await chatFarmAdvisor(message, history, farmContext, language);

    res.json({
      success: true,
      data: {
        reply,
        aiEngine,
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
