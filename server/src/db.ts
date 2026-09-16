import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

export const prisma = new PrismaClient();

export async function seedInitialData() {
  try {
    const userCount = await prisma.user.count();
    if (userCount > 0) {
      console.log('🌾 Database already initialized with records.');
      return;
    }

    console.log('🌱 Seeding initial KRISHVYA database with demo farmer, farm, and expert records...');

    const defaultPasswordHash = await bcrypt.hash('krishvya123', 10);

    // 1. Create Farmer User
    const farmer = await prisma.user.create({
      data: {
        name: 'Saurabh Singh',
        phone: '+91 98765 43210',
        email: 'saurabh.singh@krishvya.in',
        passwordHash: defaultPasswordHash,
        role: 'FARMER',
        preferredLanguage: 'ENGLISH',
        farmerProfile: {
          create: {
            village: 'Haveli',
            district: 'Pune',
            state: 'Maharashtra',
            pincode: '411001',
            totalLandAcres: 8.3,
            experienceYears: 12,
            voiceAssistantEnabled: true,
            smsNotifications: true,
          },
        },
      },
    });

    // 2. Create Expert User
    const expert = await prisma.user.create({
      data: {
        name: 'Dr. Sunita Deshmukh',
        phone: '+91 98111 22334',
        email: 'expert.deshmukh@krishvya.in',
        passwordHash: defaultPasswordHash,
        role: 'EXPERT',
        preferredLanguage: 'ENGLISH',
      },
    });

    // 3. Create Farm
    const farm = await prisma.farm.create({
      data: {
        name: 'Farm A (Pune Parcel)',
        ownerId: farmer.id,
        address: 'Haveli, Pune, Maharashtra',
        district: 'Pune',
        state: 'Maharashtra',
        latitude: 18.5204,
        longitude: 73.8567,
        size: 3.5,
        sizeUnit: 'acres',
        farmHealthScore: 88,
        irrigationType: 'Drip',
        crop: {
          create: {
            name: 'Sugarcane',
            variety: 'Co-86032',
            stage: 'GRAND_GROWTH',
            sowingDate: new Date('2024-03-10'),
            expectedHarvestDate: new Date('2025-02-15'),
          },
        },

        soil: {
          create: {
            healthScore: 78,
            nitrogen: 'Good',
            phosphorus: 'Medium',
            potassium: 'Good',
            ph: 6.7,
            organicCarbon: 'Medium (0.6%)',
            moisturePercentage: 42.0,
            soilType: 'Loamy Black Cotton',
          },
        },
        weather: {
          create: {
            temperature: 28.0,
            condition: 'Partly Cloudy',
            rainProbability: 60.0,
            humidity: 72.0,
            windSpeedKmh: 12.0,
            advice: 'Rain is expected tomorrow. We recommend delaying irrigation today.',
          },
        },
        satellite: {
          create: {
            healthScore: 82,
            ndvi: 0.78,
            stressDetected: false,
          },
        },
      },
    });

    // 4. Create Initial Problem Case
    await prisma.problemCase.create({
      data: {
        farmerId: farmer.id,
        farmId: farm.id,
        category: 'disease_pest',
        title: 'DISEASE / PEST Reported',
        description: 'Brown spots and yellow halos observed on lower soybean leaves.',
        status: 'EXPERT_REVIEW',
        confidenceScore: 74.0,
        aiRecommendation: 'Early Leaf Blight detected. Case escalated to Dr. Sunita Deshmukh for validation.',
        assignedExpertId: expert.id,
      },
    });

    // 5. Create Initial Regional Alerts
    await prisma.alert.createMany({
      data: [
        {
          district: 'Nagpur',
          category: 'Weather',
          title: 'Heavy Rainfall Warning',
          description: 'Thunderstorms and heavy downpour expected within 24 hours. Postpone chemical spray.',
          severity: 'HIGH',
          actionableText: 'Drain excess water from furrows immediately.',
        },
        {
          district: 'Nagpur',
          category: 'Pest Advisory',
          title: 'Fall Armyworm Infestation Alert',
          description: 'Surrounding talukas reporting 18% spike in corn/soybean larvae.',
          severity: 'MEDIUM',
          actionableText: 'Install pheromone traps (5 per acre).',
        },
      ],
    });

    console.log('✅ KRISHVYA initial seed completed successfully.');
  } catch (error) {
    console.error('⚠️ Database seeding failed:', error);
  }
}
