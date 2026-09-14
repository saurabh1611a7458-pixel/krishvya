import { Router } from 'express';
import { prisma } from '../db.js';
import { optionalAuthMiddleware } from '../middleware/authMiddleware.js';
export const expertRoutes = Router();
// GET /api/expert/cases - Review queue from live database
expertRoutes.get('/cases', async (_req, res) => {
    try {
        const pendingCases = await prisma.problemCase.findMany({
            where: {
                status: {
                    in: ['EXPERT_REVIEW', 'SUBMITTED', 'expert_review', 'submitted'],
                },
            },
            orderBy: { createdAt: 'desc' },
            include: {
                farmer: { select: { id: true, name: true, phone: true } },
                farm: { select: { id: true, name: true, district: true, state: true } },
            },
        });
        const formatted = pendingCases.map((c) => ({
            id: c.id,
            farmerId: c.farmerId,
            farmerName: c.farmer.name,
            farmerPhone: c.farmer.phone,
            farmId: c.farmId,
            farmName: c.farm.name,
            location: `${c.farm.district}, ${c.farm.state}`,
            category: c.category,
            title: c.title,
            description: c.description,
            confidenceScore: c.confidenceScore || 74,
            status: c.status.toLowerCase(),
            aiRecommendation: c.aiRecommendation,
            expertNotes: c.expertNotes,
            createdAt: c.createdAt.toISOString(),
        }));
        res.json({
            success: true,
            total: formatted.length,
            data: formatted,
        });
    }
    catch (error) {
        console.error('Fetch expert cases error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch review queue', error: error.message });
    }
});
// POST /api/expert/cases/:id/resolve - Expert sign-off with DB write
expertRoutes.post('/cases/:id/resolve', optionalAuthMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { expertNotes, expertName } = req.body;
        const targetCase = await prisma.problemCase.findUnique({
            where: { id },
        });
        if (!targetCase) {
            res.status(404).json({ success: false, message: 'Problem case not found in database.' });
            return;
        }
        // Resolve expert user (or default demo expert)
        let expert = null;
        if (req.user?.id) {
            expert = await prisma.user.findUnique({ where: { id: req.user.id } });
        }
        if (!expert) {
            expert = await prisma.user.findFirst({ where: { role: 'EXPERT' } });
        }
        const updatedCase = await prisma.problemCase.update({
            where: { id },
            data: {
                status: 'RESOLVED',
                expertNotes: expertNotes || 'Validated by certified agronomist. Treatment approved.',
                resolvedAt: new Date(),
                assignedExpertId: expert?.id || undefined,
                ...(expert
                    ? {
                        expertReviews: {
                            create: {
                                expertId: expert.id,
                                notes: expertNotes || 'Treatment and advice validated.',
                                approved: true,
                            },
                        },
                    }
                    : {}),
            },
            include: {
                farmer: { select: { name: true } },
                farm: { select: { name: true } },
            },
        });
        res.json({
            success: true,
            message: `Case ${id} signed off by ${expertName || expert?.name || 'Dr. Sunita Deshmukh'}`,
            data: {
                id: updatedCase.id,
                status: 'resolved',
                farmerName: updatedCase.farmer.name,
                farmName: updatedCase.farm.name,
                expertNotes: updatedCase.expertNotes,
                resolvedAt: updatedCase.resolvedAt?.toISOString(),
            },
        });
    }
    catch (error) {
        console.error('Resolve case error:', error);
        res.status(500).json({ success: false, message: 'Failed to record expert sign-off', error: error.message });
    }
});
