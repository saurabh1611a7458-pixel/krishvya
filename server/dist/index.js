import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Explicitly load server/.env before any routes or services initialize
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'server/.env') });
dotenv.config();
console.log('🔑 GEMINI_API_KEY loaded:', Boolean(process.env.GEMINI_API_KEY));
import { seedInitialData } from './db.js';
import { authRoutes } from './routes/authRoutes.js';
import { farmRoutes } from './routes/farmRoutes.js';
import { problemRoutes } from './routes/problemRoutes.js';
import { expertRoutes } from './routes/expertRoutes.js';
import { alertRoutes } from './routes/alertRoutes.js';
import { adminRoutes } from './routes/adminRoutes.js';
import { aiRoutes } from './routes/aiRoutes.js';
import { weatherRoutes, satelliteRoutes } from './routes/weatherRoutes.js';
import { tankRoutes } from './routes/tankRoutes.js';
import { geocodingRoutes } from './routes/geocodingRoutes.js';
const app = express();
const PORT = process.env.PORT || 5001;
// Middleware - allow up to 15MB for high-res leaf photographs
const allowedOrigins = [
    'https://krishvya-74cb1.web.app',
    'https://krishvya-74cb1.firebaseapp.com',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
];
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.web.app') || origin.endsWith('.firebaseapp.com')) {
            callback(null, true);
        }
        else {
            callback(null, true);
        }
    },
    credentials: true,
}));
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
// Request logger
app.use((req, _res, next) => {
    console.log(`[KRISHVYA API] ${req.method} ${req.path}`);
    next();
});
// Health check endpoint
app.get('/api/health', (_req, res) => {
    res.json({
        status: 'healthy',
        platform: 'KRISHVYA Smart Agriculture API',
        tagline: 'Your Farm. Your Data. Your AI.',
        database: 'SQLite (Prisma 6)',
        aiService: 'Google Gemini 2.5 Flash / ICAR Engine',
        weatherService: 'Open-Meteo & Sentinel-2 Copernicus',
        tankDosingService: 'Knapsack Pump & Chemical Compatibility Engine',
        timestamp: new Date().toISOString(),
    });
});
// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/farm', farmRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/expert', expertRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/satellite', satelliteRoutes);
app.use('/api/tank', tankRoutes);
app.use('/api/geocoding', geocodingRoutes);
// Error handling middleware
app.use((err, _req, res, _next) => {
    console.error('[KRISHVYA API ERROR]', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
});
// Start Server & Initialize Seed
app.listen(PORT, async () => {
    console.log(`🌱 KRISHVYA API Server running on port ${PORT}`);
    console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
    await seedInitialData();
});
