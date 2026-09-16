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

export const DEFAULT_FARMER: FarmerProfile = {
  id: 'usr_farmer_01',
  name: 'Saurabh Singh',
  phone: '+91 98765 43210',
  email: 'saurabh.singh@krishvya.in',
  role: 'farmer',
  preferredLanguage: 'english',
  district: 'Pune',
  state: 'Maharashtra, India',
  village: 'Haveli',
  totalLandAcres: 8.3,
  experienceYears: 12,
  voiceAssistantEnabled: true,
  smsNotifications: true,
  createdAt: '2024-06-15T08:00:00Z',
};

export const MOCK_FARMER = DEFAULT_FARMER;

export const FARM_A_PUNE: Farm = {
  id: 'farm_pune_01',
  name: 'Farm A (Pune Parcel)',
  ownerId: 'usr_farmer_01',
  location: {
    address: 'Haveli, Pune, Maharashtra',
    state: 'Maharashtra, India',
    district: 'Pune',
    latitude: 18.5204,
    longitude: 73.8567,
    boundaryVertices: [
      [18.5190, 73.8550],
      [18.5220, 73.8552],
      [18.5218, 73.8585],
      [18.5188, 73.8582],
    ],
  },
  size: 3.5,
  sizeUnit: 'acres',
  farmHealthScore: 88,
  irrigationType: 'Drip',
  boundaryVertices: [
    [18.5190, 73.8550],
    [18.5220, 73.8552],
    [18.5218, 73.8585],
    [18.5188, 73.8582],
  ],
  crop: {
    id: 'crop_sugarcane_01',
    name: 'Sugarcane',
    variety: 'Co-86032',
    stage: 'Grand Growth',
    sowingDate: '2024-03-10',
    expectedHarvestDate: '2025-02-15',
    imageUrl: 'https://images.unsplash.com/photo-1592417817098-8f3d69102a56?auto=format&fit=crop&w=600&q=80',
  },
  soil: {
    healthScore: 85,
    nitrogen: 'Good',
    phosphorus: 'High',
    potassium: 'Good',
    ph: 7.1,
    organicCarbon: 'Medium (0.7%)',
    moisturePercentage: 45,
    soilType: 'Medium Black Loam',
    lastTestedDate: '2024-05-18',
  },
  weather: {
    temperature: 27,
    condition: 'Partly Cloudy',
    conditionIcon: 'cloud-sun',
    rainProbability: 25,
    humidity: 65,
    windSpeedKmh: 11,
    forecast7Days: [
      { day: 'Mon', temp: 27, icon: 'cloud-sun', rainProb: 20 },
      { day: 'Tue', temp: 28, icon: 'sun', rainProb: 15 },
      { day: 'Wed', temp: 29, icon: 'sun', rainProb: 10 },
      { day: 'Thu', temp: 28, icon: 'cloud-sun', rainProb: 25 },
      { day: 'Fri', temp: 27, icon: 'cloud-rain', rainProb: 45 },
      { day: 'Sat', temp: 26, icon: 'cloud-rain', rainProb: 55 },
      { day: 'Sun', temp: 28, icon: 'cloud-sun', rainProb: 20 },
    ],
    advice: 'Optimal weather in Pune for canopy maintenance and drip fertigation.',
  },
  satellite: {
    healthScore: 89,
    ndvi: 0.83,
    lastUpdated: 'Today at 8:30 AM',
    stressDetected: false,
    stressAreaDescription: 'Healthy uniform vegetative index across Pune field.',
  },
};

export const FARM_B_NAGPUR: Farm = {
  id: 'farm_nagpur_02',
  name: 'Farm B (Nagpur Parcel)',
  ownerId: 'usr_farmer_01',
  location: {
    address: 'Nagpur Rural, Maharashtra',
    state: 'Maharashtra, India',
    district: 'Nagpur',
    latitude: 21.1458,
    longitude: 79.0882,
    boundaryVertices: [
      [21.1440, 79.0865],
      [21.1475, 79.0868],
      [21.1472, 79.0900],
      [21.1438, 79.0898],
    ],
  },
  size: 4.8,
  sizeUnit: 'acres',
  farmHealthScore: 82,
  irrigationType: 'Sprinkler',
  boundaryVertices: [
    [21.1440, 79.0865],
    [21.1475, 79.0868],
    [21.1472, 79.0900],
    [21.1438, 79.0898],
  ],
  crop: {
    id: 'crop_orange_02',
    name: 'Orange',
    variety: 'Nagpur Mandarin',
    stage: 'Fruit Development',
    sowingDate: '2023-08-15',
    expectedHarvestDate: '2024-11-20',
    imageUrl: 'https://images.unsplash.com/photo-1592417817098-8f3d69102a56?auto=format&fit=crop&w=600&q=80',
  },
  soil: {
    healthScore: 80,
    nitrogen: 'Medium',
    phosphorus: 'Medium',
    potassium: 'High',
    ph: 7.4,
    organicCarbon: 'Good (0.75%)',
    moisturePercentage: 38,
    soilType: 'Deep Black Cotton',
    lastTestedDate: '2024-04-10',
  },
  weather: {
    temperature: 31,
    condition: 'Sunny',
    conditionIcon: 'sun',
    rainProbability: 10,
    humidity: 50,
    windSpeedKmh: 14,
    forecast7Days: [
      { day: 'Mon', temp: 31, icon: 'sun', rainProb: 10 },
      { day: 'Tue', temp: 32, icon: 'sun', rainProb: 5 },
      { day: 'Wed', temp: 32, icon: 'sun', rainProb: 10 },
      { day: 'Thu', temp: 31, icon: 'cloud-sun', rainProb: 20 },
      { day: 'Fri', temp: 30, icon: 'cloud-sun', rainProb: 30 },
      { day: 'Sat', temp: 29, icon: 'cloud-rain', rainProb: 40 },
      { day: 'Sun', temp: 31, icon: 'sun', rainProb: 15 },
    ],
    advice: 'Clear skies in Nagpur. Run sprinkler irrigation during morning hours.',
  },
  satellite: {
    healthScore: 84,
    ndvi: 0.79,
    lastUpdated: 'Yesterday at 5:00 PM',
    stressDetected: false,
    stressAreaDescription: 'Standard canopy density for Nagpur mandarin orchard.',
  },
};

export const MOCK_FARM: Farm = FARM_A_PUNE;


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
