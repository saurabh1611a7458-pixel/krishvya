import { Router } from 'express';

export const adminRoutes = Router();

const broadcastLog: {
  id: string;
  district: string;
  message: string;
  sentAt: string;
  recipientsCount: number;
}[] = [];

// GET /api/admin/metrics
adminRoutes.get('/metrics', (_req, res) => {
  res.json({
    success: true,
    data: {
      onboardedFarmers: 1240,
      verifiedAgronomists: 48,
      activeTriageCases: 24,
      sensorUptime: '99.8%',
      districts: [
        { name: 'Nagpur (Saoner)', avgHealth: 84, status: 'Optimal' },
        { name: 'Wardha', avgHealth: 71, status: 'Moisture Stress' },
        { name: 'Amravati', avgHealth: 68, status: 'Anthracnose Outbreak' },
        { name: 'Yavatmal', avgHealth: 79, status: 'Good' },
      ],
    },
  });
});

// POST /api/admin/broadcast - Emergency cell broadcast
adminRoutes.post('/broadcast', (req, res) => {
  const { district, message } = req.body;

  if (!message) {
    res.status(400).json({ success: false, message: 'Message is required' });
    return;
  }

  const broadcastRecord = {
    id: `bc_${Date.now()}`,
    district: district || 'All Districts',
    message,
    sentAt: new Date().toISOString(),
    recipientsCount: 1240,
  };

  broadcastLog.unshift(broadcastRecord);

  console.log(`[KRISHVYA EMERGENCY BROADCAST] To ${broadcastRecord.district}: "${message}"`);

  res.status(201).json({
    success: true,
    message: `Dispatched to 1,240 farmers in ${broadcastRecord.district}`,
    data: broadcastRecord,
  });
});
