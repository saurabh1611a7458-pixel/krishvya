import { Farm, FarmerProfile, ProblemCategory } from '../types';

export const ASSETS = {
  // Realistic agricultural imagery
  farmerHero: '/images/authentic_indian_farmer.jpg', // authentic Indian farmer in lush green field
  fieldBanner: '/images/indian_lush_farm_field.jpg', // lush green farm field landscape at sunrise
  seedlingSprout: 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&w=800&q=80', // seedling in fertile soil
  cropLeaf: 'https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?auto=format&fit=crop&w=600&q=80', // close-up crop leaf
  fieldDrone: 'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?auto=format&fit=crop&w=1000&q=80', // agricultural landscape
  sunriseHarvest: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=1000&q=80', // golden harvest field
};

export const MOCK_FARMER: FarmerProfile = {
  id: 'usr_ramesh_01',
  name: 'Ramesh Singh',
  phone: '+91 98765 43210',
  email: 'ramesh.singh@krishvya.in',
  role: 'farmer',
  preferredLanguage: 'english',
  district: 'Nagpur',
  state: 'Maharashtra, India',
  village: 'Saoner',
  totalLandAcres: 2.5,
  experienceYears: 18,
  voiceAssistantEnabled: true,
  smsNotifications: true,
  createdAt: '2024-06-15T08:00:00Z',
};

export const MOCK_FARM: Farm = {
  id: 'farm_01',
  name: 'Ramesh Shwet Farm',
  ownerId: 'usr_ramesh_01',
  location: {
    address: 'Saoner, Nagpur District',
    state: 'Maharashtra, India',
    district: 'Nagpur',
    latitude: 21.3855,
    longitude: 78.9189,
  },
  size: 2.5,
  sizeUnit: 'acres',
  farmHealthScore: 84,
  irrigationType: 'Drip',
  crop: {
    id: 'crop_soybean_01',
    name: 'Soybean',
    variety: 'JS-335 Gold',
    stage: 'Flowering',
    sowingDate: '15 June 2024',
    expectedHarvestDate: '10 October 2024',
    imageUrl: 'https://images.unsplash.com/photo-1592417817098-8f3d69102a56?auto=format&fit=crop&w=600&q=80',
  },
  soil: {
    healthScore: 78,
    nitrogen: 'Good',
    phosphorus: 'Medium',
    potassium: 'Good',
    ph: 6.7,
    organicCarbon: 'Medium (0.6%)',
    moisturePercentage: 42,
    soilType: 'Loamy Black Cotton',
    lastTestedDate: '12 May 2024',
  },
  weather: {
    temperature: 28,
    condition: 'Partly Cloudy',
    conditionIcon: 'cloud-sun',
    rainProbability: 60,
    humidity: 72,
    windSpeedKmh: 12,
    forecast7Days: [
      { day: 'Mon', temp: 28, icon: 'cloud-rain', rainProb: 65 },
      { day: 'Tue', temp: 29, icon: 'cloud-sun', rainProb: 30 },
      { day: 'Wed', temp: 29, icon: 'sun', rainProb: 15 },
      { day: 'Thu', temp: 30, icon: 'sun', rainProb: 10 },
      { day: 'Fri', temp: 29, icon: 'cloud-sun', rainProb: 20 },
      { day: 'Sat', temp: 28, icon: 'cloud-rain', rainProb: 50 },
      { day: 'Sun', temp: 29, icon: 'sun', rainProb: 25 },
    ],
    advice: 'Rain is expected tomorrow. We recommend delaying irrigation today to prevent waterlogging.',
  },
  satellite: {
    healthScore: 82,
    ndvi: 0.78,
    lastUpdated: 'Yesterday at 4:30 PM',
    stressDetected: false,
    stressAreaDescription: 'Slight lower vegetative density in north-east border, within normal threshold.',
  },
};

export interface ProblemOption {
  id: ProblemCategory;
  title: string;
  icon: string;
  description: string;
  badge?: string;
}

export const PROBLEM_CATEGORIES: ProblemOption[] = [
  {
    id: 'crop_problem',
    title: 'Crop Problem',
    icon: '🌱',
    description: 'Leaves turning yellow, stunted growth, or wilting crops.',
  },
  {
    id: 'disease_pest',
    title: 'Disease / Pest',
    icon: '🐛',
    description: 'Visible insects, caterpillar attacks, leaf spots or fungus.',
    badge: 'Urgent',
  },
  {
    id: 'weed_extra_plant',
    title: 'Weed / Extra Plant',
    icon: '🌿',
    description: 'Unwanted grass or wild plants competing with your crop.',
  },
  {
    id: 'unknown_plant',
    title: 'Unknown Plant',
    icon: '❓',
    description: 'Mysterious plant growing in your field that you cannot identify.',
  },
  {
    id: 'water_problem',
    title: 'Water Problem',
    icon: '💧',
    description: 'Over-irrigation, waterlogging, or severe dryness and drought stress.',
  },
  {
    id: 'soil_problem',
    title: 'Soil Problem',
    icon: '🌍',
    description: 'Hard crust, white salt patches, or poor drainage.',
  },
  {
    id: 'weather_damage',
    title: 'Weather Damage',
    icon: '🌦️',
    description: 'Damage from unseasonal heavy rain, hailstorm, or extreme heat.',
  },
  {
    id: 'crop_selection',
    title: 'Crop Selection',
    icon: '🌾',
    description: 'Need advice on which crop or variety to plant next season.',
  },
  {
    id: 'low_productivity',
    title: 'Low Productivity',
    icon: '📉',
    description: 'Yield is lower than expected or plants produce fewer pods/fruits.',
  },
  {
    id: 'low_profit',
    title: 'Low Profit',
    icon: '💰',
    description: 'High input costs, market price advice, or post-harvest planning.',
  },
  {
    id: 'other',
    title: 'Other Problem',
    icon: '❓',
    description: 'Any other issue on your farm that is not listed above.',
  },
];

export interface AlertItem {
  id: string;
  category: 'weather' | 'crop' | 'soil' | 'system';
  title: string;
  description: string;
  timestamp: string;
  severity: 'high' | 'medium' | 'info';
  actionableText?: string;
}

export const MOCK_ALERTS: AlertItem[] = [
  {
    id: 'alt_01',
    category: 'weather',
    title: 'Heavy Rain Expected',
    description: 'Rainfall 40mm expected tomorrow. Consider postponing fertilizer and pesticide spraying.',
    timestamp: '2 hours ago',
    severity: 'high',
    actionableText: 'Delay Irrigation',
  },
  {
    id: 'alt_02',
    category: 'crop',
    title: 'Crop Stress Detected',
    description: 'NDVI vegetative anomaly observed in the northern border of your 2.5 acre field.',
    timestamp: '5 hours ago',
    severity: 'medium',
    actionableText: 'View Satellite Map',
  },
  {
    id: 'alt_03',
    category: 'soil',
    title: 'Soil Moisture Low in Sector B',
    description: 'Moisture dropped to 34% in upper soil tier. Prepare light drip irrigation if rain delays.',
    timestamp: '1 day ago',
    severity: 'medium',
    actionableText: 'Check Soil Status',
  },
  {
    id: 'alt_04',
    category: 'crop',
    title: 'High Disease Risk: Leaf Blight',
    description: 'Current humidity (72%) and warm temperature elevate risk of fungal leaf spots in soybean.',
    timestamp: '2 days ago',
    severity: 'high',
    actionableText: 'Scan Leaves Now',
  },
];

export const MOCK_DISEASE_RESULT = {
  cropName: 'Soybean (JS-335)',
  possibleDisease: 'Early Leaf Blight',
  confidenceScore: 91,
  sampleImageUrl: 'https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?auto=format&fit=crop&w=600&q=80',
  symptoms: [
    'Concentric brown rings with yellow halo on lower mature foliage',
    'Premature leaf drop in dense canopy patches',
    'Stunted pod filling near affected stems',
  ],
  recommendedActions: [
    'Remove and safely dispose of heavily infected bottom leaves',
    'Avoid overhead sprinkler irrigation to reduce moisture on foliage',
    'Apply organic bio-fungicide (Trichoderma viride) or copper oxychloride (2g/L) during morning hours',
  ],
  expertAvailable: true,
  expertName: 'Dr. Anita Deshmukh (Senior Agronomist, Nagpur)',
};
