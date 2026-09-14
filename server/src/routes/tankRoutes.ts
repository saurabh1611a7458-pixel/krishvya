import { Router, Request, Response } from 'express';
import {
  AGROCHEMICALS,
  calculateSprayTankDose,
  evaluateChemicalCompatibility,
} from '../services/tankCalculatorService.js';

export const tankRoutes = Router();

// GET /api/tank/chemicals
tankRoutes.get('/chemicals', (_req: Request, res: Response) => {
  res.json({
    success: true,
    total: AGROCHEMICALS.length,
    data: AGROCHEMICALS,
  });
});

// POST /api/tank/calculate
tankRoutes.post('/calculate', (req: Request, res: Response) => {
  try {
    const {
      chemicalId = 'mancozeb',
      secondaryChemicalId = '',
      tankCapacityLiters = 15,
      farmAcres = 2.5,
    } = req.body;

    const result = calculateSprayTankDose(
      chemicalId,
      secondaryChemicalId,
      Number(tankCapacityLiters) || 15,
      Number(farmAcres) || 2.5
    );

    res.json({
      success: true,
      message: 'Spray tank dosage and chemical compatibility calculated successfully.',
      data: result,
    });
  } catch (error: any) {
    console.error('Tank calculation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate spray tank dosage.',
      error: error.message,
    });
  }
});

// POST /api/tank/compatibility
tankRoutes.post('/compatibility', (req: Request, res: Response) => {
  try {
    const { chemicalAId, chemicalBId } = req.body;

    if (!chemicalAId) {
      res.status(400).json({ success: false, message: 'chemicalAId is required' });
      return;
    }

    const report = evaluateChemicalCompatibility(chemicalAId, chemicalBId);

    res.json({
      success: true,
      data: report,
    });
  } catch (error: any) {
    console.error('Compatibility check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to evaluate chemical compatibility.',
      error: error.message,
    });
  }
});
