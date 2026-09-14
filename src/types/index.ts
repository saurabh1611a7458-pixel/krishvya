// KRISHVYA Data Architecture Types

export type UserRole = 'farmer' | 'expert' | 'admin';

export type LanguageCode = 'bhojpuri' | 'english' | 'hindi' | 'kannada' | 'marathi' | 'tamil' | 'telugu';

export interface User {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: UserRole;
  preferredLanguage: LanguageCode;
  avatarUrl?: string;
  createdAt: string;
}

export interface FarmerProfile extends User {
  village?: string;
  district: string;
  state: string;
  pincode?: string;
  totalLandAcres: number;
  experienceYears?: number;
  voiceAssistantEnabled: boolean;
  smsNotifications: boolean;
}

export type CropStage = 'Seedling' | 'Vegetative' | 'Flowering' | 'Fruiting' | 'Harvest';

export interface Crop {
  id: string;
  name: string;
  variety?: string;
  stage: CropStage;
  sowingDate: string;
  expectedHarvestDate?: string;
  imageUrl?: string;
}

export interface SoilData {
  healthScore: number; // 0-100
  nitrogen: 'Low' | 'Medium' | 'Good' | 'High';
  phosphorus: 'Low' | 'Medium' | 'Good' | 'High';
  potassium: 'Low' | 'Medium' | 'Good' | 'High';
  ph: number;
  organicCarbon: string;
  moisturePercentage: number;
  soilType: string;
  lastTestedDate?: string;
}

export interface WeatherData {
  temperature: number;
  condition: string;
  conditionIcon: string;
  rainProbability: number;
  humidity: number;
  windSpeedKmh: number;
  forecast7Days: {
    day: string;
    temp: number;
    icon: string;
    rainProb: number;
  }[];
  advice: string;
}

export interface SatelliteData {
  healthScore: number; // 0-100
  ndvi: number;
  lastUpdated: string;
  stressDetected: boolean;
  stressAreaDescription?: string;
}

export interface FarmLocation {
  address: string;
  state: string;
  district?: string;
  latitude: number;
  longitude: number;
}

export interface Farm {
  id: string;
  name: string;
  ownerId: string;
  location: FarmLocation;
  size: number;
  sizeUnit: 'acres' | 'hectares';
  crop: Crop;
  soil: SoilData;
  weather: WeatherData;
  satellite: SatelliteData;
  farmHealthScore: number; // 0-100
  irrigationType: 'Drip' | 'Flood' | 'Sprinkler' | 'Rainfed';
}

// Problem Resolution System Types
export type ProblemCategory =
  | 'crop_problem'
  | 'disease_pest'
  | 'weed_extra_plant'
  | 'unknown_plant'
  | 'water_problem'
  | 'soil_problem'
  | 'weather_damage'
  | 'crop_selection'
  | 'low_productivity'
  | 'low_profit'
  | 'other';

export interface ProblemCase {
  id: string;
  farmerId: string;
  farmId: string;
  category: ProblemCategory;
  title: string;
  description: string;
  voiceNoteUrl?: string;
  photoUrls?: string[];
  status: 'submitted' | 'ai_analyzing' | 'expert_review' | 'resolved';
  confidenceScore?: number;
  aiRecommendation?: string;
  assignedExpertId?: string;
  expertNotes?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface Recommendation {
  id: string;
  title: string;
  type: 'irrigation' | 'fertilizer' | 'pest' | 'soil' | 'general';
  summary: string;
  actionRequired: string;
  reason: string;
  isUrgent: boolean;
  date: string;
}

export interface DiseaseReport {
  id: string;
  cropName: string;
  suspectedDisease: string;
  confidencePercentage: number;
  symptoms: string[];
  recommendedActions: string[];
  reviewedByExpert: boolean;
}

export interface PlantScan {
  id: string;
  imageUrl: string;
  identification: string;
  isWeed: boolean;
  confidence: number;
  advice: string;
}

export interface ExpertReview {
  id: string;
  expertName: string;
  qualification: string;
  notes: string;
  approved: boolean;
  timestamp: string;
}

export interface FollowUp {
  caseId: string;
  scheduledDate: string;
  status: 'pending' | 'completed';
  farmerFeedback?: string;
}

export interface FarmHistory {
  date: string;
  event: string;
  details: string;
  impact: 'positive' | 'neutral' | 'negative';
}
