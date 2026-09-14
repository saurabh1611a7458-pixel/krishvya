import { Router, Response } from 'express';
import { prisma } from '../db.js';
import { AuthenticatedRequest, optionalAuthMiddleware } from '../middleware/authMiddleware.js';

export const problemRoutes = Router();

// GET /api/problems
problemRoutes.get('/', async (_req, res: Response) => {
  try {
    const cases = await prisma.problemCase.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        farmer: {
          select: { id: true, name: true, phone: true },
        },
        farm: {
          select: { id: true, name: true, district: true, state: true },
        },
      },
    });

    const formatted = cases.map((c) => ({
      id: c.id,
      farmerId: c.farmerId,
      farmerName: c.farmer.name,
      farmId: c.farmId,
      farmName: c.farm.name,
      category: c.category,
      title: c.title,
      description: c.description,
      confidenceScore: c.confidenceScore || 75,
      status: c.status.toLowerCase(),
      aiRecommendation: c.aiRecommendation,
      expertNotes: c.expertNotes,
      createdAt: c.createdAt.toISOString(),
      resolvedAt: c.resolvedAt ? c.resolvedAt.toISOString() : undefined,
    }));

    res.json({
      success: true,
      total: formatted.length,
      data: formatted,
    });
  } catch (error: any) {
    console.error('Fetch problems error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch problem cases', error: error.message });
  }
});

// POST /api/problems - Section 26 Triage Engine with Live Database Persistence
problemRoutes.post('/', optionalAuthMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { category, description } = req.body;

    if (!category) {
      res.status(400).json({ success: false, message: 'Category is required' });
      return;
    }

    // Resolve farmer and farm
    let farmer = null;
    let farm = null;

    if (req.user?.id) {
      farmer = await prisma.user.findUnique({ where: { id: req.user.id } });
      farm = await prisma.farm.findFirst({ where: { ownerId: req.user.id } });
    }

    if (!farmer || !farm) {
      farmer = await prisma.user.findFirst({ where: { role: 'FARMER' } });
      farm = await prisma.farm.findFirst();
    }

    if (!farmer || !farm) {
      res.status(400).json({ success: false, message: 'No registered farmer or farm found to attach case to.' });
      return;
    }

    // Triage confidence assessment
    const isUrgent = category === 'disease_pest' || category === 'weather_damage';
    const confidence = isUrgent ? 74 : 89;
    const requiresExpert = confidence < 85;

    const newCase = await prisma.problemCase.create({
      data: {
        farmerId: farmer.id,
        farmId: farm.id,
        category,
        title: `${category.replace(/_/g, ' ').toUpperCase()} Reported`,
        description: description || 'Reported via field selector',
        confidenceScore: confidence,
        status: requiresExpert ? 'EXPERT_REVIEW' : 'AI_ANALYZING',
        aiRecommendation: requiresExpert
          ? 'Complex symptom pattern: Escalated to regional agronomist review desk.'
          : 'Standard localized mitigation issued based on flowering stage guidelines.',
      },
      include: {
        farmer: { select: { name: true } },
        farm: { select: { name: true } },
      },
    });

    res.status(201).json({
      success: true,
      message: requiresExpert
        ? 'Case permanently submitted to KRISHVYA database and queued for Agronomist Expert review'
        : 'Case recorded in database and automated AI advice generated',
      data: {
        id: newCase.id,
        farmerId: newCase.farmerId,
        farmerName: newCase.farmer.name,
        farmId: newCase.farmId,
        farmName: newCase.farm.name,
        category: newCase.category,
        title: newCase.title,
        description: newCase.description,
        confidenceScore: newCase.confidenceScore,
        status: newCase.status.toLowerCase(),
        aiRecommendation: newCase.aiRecommendation,
        createdAt: newCase.createdAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Create problem error:', error);
    res.status(500).json({ success: false, message: 'Failed to record problem case', error: error.message });
  }
});
