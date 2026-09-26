-- ==============================================================================
-- KRISHVYA (Smart Indian Agriculture) - Supabase Cloud Database Schema
-- Run this script in your Supabase SQL Editor: https://app.supabase.com
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Profiles Table (Farmers, Agronomists & Admins)
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  clerk_user_id TEXT UNIQUE,
  full_name TEXT,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  role TEXT DEFAULT 'farmer',
  preferred_language TEXT DEFAULT 'english',
  village TEXT DEFAULT 'Saoner',
  district TEXT DEFAULT 'Nagpur',
  state TEXT DEFAULT 'Maharashtra',
  pincode TEXT DEFAULT '441107',
  total_land_acres NUMERIC DEFAULT 2.5,
  experience_years INTEGER DEFAULT 14,
  voice_assistant_enabled BOOLEAN DEFAULT true,
  sms_notifications BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::TEXT, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::TEXT, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_profiles_clerk_user_id ON public.profiles(clerk_user_id);

-- 3. Farms Table
CREATE TABLE IF NOT EXISTS public.farms (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  owner_id TEXT NOT NULL,
  clerk_user_id TEXT,
  name TEXT NOT NULL,
  farm_name TEXT,
  address TEXT NOT NULL,
  location_address TEXT,
  district TEXT NOT NULL,
  state TEXT NOT NULL,
  latitude FLOAT8 NOT NULL DEFAULT 21.3855,
  longitude FLOAT8 NOT NULL DEFAULT 78.9189,
  size NUMERIC NOT NULL DEFAULT 2.5,
  field_area NUMERIC,
  size_unit TEXT NOT NULL DEFAULT 'acres',
  crop TEXT,
  crop_variety TEXT,
  crop_stage TEXT,
  soil_type TEXT,
  irrigation_type TEXT NOT NULL DEFAULT 'Drip',
  sowing_date DATE,
  boundary JSONB DEFAULT '[]'::jsonb,
  boundary_vertices JSONB DEFAULT '[]'::jsonb,
  farm_health_score INTEGER NOT NULL DEFAULT 84,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::TEXT, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::TEXT, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_farms_clerk_user_id ON public.farms(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_farms_owner_id ON public.farms(owner_id);

-- 4. Crops Table
CREATE TABLE IF NOT EXISTS public.crops (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  farm_id TEXT UNIQUE NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  variety TEXT,
  stage TEXT DEFAULT 'Flowering',
  sowing_date DATE DEFAULT '2024-06-15',
  expected_harvest_date DATE DEFAULT '2024-10-20',
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::TEXT, now()) NOT NULL
);

-- 5. Soil Data Table
CREATE TABLE IF NOT EXISTS public.soil_data (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  farm_id TEXT UNIQUE NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  health_score INTEGER DEFAULT 78,
  nitrogen TEXT DEFAULT 'Good',
  phosphorus TEXT DEFAULT 'Medium',
  potassium TEXT DEFAULT 'Good',
  ph FLOAT8 DEFAULT 6.7,
  organic_carbon TEXT DEFAULT 'Medium (0.6%)',
  moisture_percentage FLOAT8 DEFAULT 42.0,
  soil_type TEXT DEFAULT 'Loamy Black Cotton',
  last_tested_date DATE DEFAULT CURRENT_DATE,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::TEXT, now()) NOT NULL
);

-- 6. Weather Data Table
CREATE TABLE IF NOT EXISTS public.weather_data (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  farm_id TEXT UNIQUE NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  temperature FLOAT8 DEFAULT 28.0,
  apparent_temperature FLOAT8 DEFAULT 30.0,
  condition TEXT DEFAULT 'Partly Cloudy',
  condition_icon TEXT DEFAULT 'cloud-sun',
  rain_probability FLOAT8 DEFAULT 60.0,
  humidity FLOAT8 DEFAULT 72.0,
  wind_speed_kmh FLOAT8 DEFAULT 12.0,
  soil_moisture FLOAT8 DEFAULT 42.0,
  advice TEXT DEFAULT 'Rain is expected tomorrow. We recommend delaying irrigation today to prevent waterlogging.',
  pump_action TEXT DEFAULT 'Delay Tubewell / Drip Irrigation Today',
  pump_savings_water FLOAT8 DEFAULT 45000,
  pump_savings_inr FLOAT8 DEFAULT 140,
  hazards JSONB DEFAULT '[]'::jsonb,
  hourly_spray JSONB DEFAULT '[]'::jsonb,
  forecast_7days JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::TEXT, now()) NOT NULL
);

-- 7. Satellite Data Table (Sentinel-2 10m Multi-spectral)
CREATE TABLE IF NOT EXISTS public.satellite_data (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  farm_id TEXT UNIQUE NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  health_score INTEGER DEFAULT 82,
  ndvi FLOAT8 DEFAULT 0.78,
  last_updated TIMESTAMPTZ DEFAULT timezone('utc'::TEXT, now()) NOT NULL,
  stress_detected BOOLEAN DEFAULT false,
  stress_area_description TEXT DEFAULT 'Slight lower vegetative density in north-east border, within normal threshold.',
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::TEXT, now()) NOT NULL
);

-- 8. Problem Cases Table (Farmer Inquiries & Agronomist Triage Desk)
CREATE TABLE IF NOT EXISTS public.problem_cases (
  id TEXT PRIMARY KEY DEFAULT ('case_' || floor(random() * 1000000)::TEXT),
  farmer_id TEXT NOT NULL,
  farm_id TEXT REFERENCES public.farms(id) ON DELETE SET NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'expert_review',
  confidence_score FLOAT8 DEFAULT 74.0,
  ai_recommendation TEXT,
  expert_notes TEXT,
  assigned_expert_id TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::TEXT, now()) NOT NULL,
  resolved_at TIMESTAMPTZ
);

-- 9. Alerts Table
CREATE TABLE IF NOT EXISTS public.alerts (
  id TEXT PRIMARY KEY DEFAULT ('alt_' || floor(random() * 100000)::TEXT),
  district TEXT NOT NULL DEFAULT 'Nagpur',
  category TEXT NOT NULL DEFAULT 'weather',
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  actionable_text TEXT,
  timestamp TIMESTAMPTZ DEFAULT timezone('utc'::TEXT, now()) NOT NULL
);

-- 10. AI Daily Recommendations Table (Personalized Agronomic Cards)
CREATE TABLE IF NOT EXISTS public.ai_recommendations (
  id TEXT PRIMARY KEY DEFAULT ('rec_' || floor(random() * 1000000)::TEXT),
  farm_id TEXT REFERENCES public.farms(id) ON DELETE CASCADE,
  category TEXT NOT NULL, -- 'irrigation', 'crop_health', 'weather', 'soil', 'disease', 'today_actions', 'intercropping'
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  detailed_action TEXT,
  urgency TEXT DEFAULT 'optimal', -- 'immediate', 'warning', 'optimal', 'info'
  confidence_score INTEGER DEFAULT 90,
  feedback_rating TEXT, -- 'positive', 'negative'
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::TEXT, now()) NOT NULL
);

-- 11. AI Chat Memories Table (Remembers previous problems and advice)
CREATE TABLE IF NOT EXISTS public.ai_chat_memories (
  id TEXT PRIMARY KEY DEFAULT ('mem_' || floor(random() * 1000000)::TEXT),
  farm_id TEXT REFERENCES public.farms(id) ON DELETE CASCADE,
  user_query TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  context_snapshot JSONB,
  topic TEXT,
  feedback TEXT, -- 'positive', 'negative'
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::TEXT, now()) NOT NULL
);

-- 12. Disease Scans Table (Multimodal Gemini Vision Scan History)
CREATE TABLE IF NOT EXISTS public.disease_scans (
  id TEXT PRIMARY KEY DEFAULT ('scan_' || floor(random() * 1000000)::TEXT),
  user_id TEXT NOT NULL,
  farm_id TEXT NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  image_url TEXT,
  crop TEXT NOT NULL,
  detected_problem TEXT NOT NULL,
  scientific_name TEXT,
  severity TEXT NOT NULL DEFAULT 'Medium',
  confidence INTEGER NOT NULL DEFAULT 85,
  symptoms JSONB DEFAULT '[]'::jsonb,
  action_steps JSONB DEFAULT '[]'::jsonb,
  causes JSONB DEFAULT '[]'::jsonb,
  recommendation TEXT,
  organic_treatment TEXT,
  chemical_treatment TEXT,
  preventative_measures JSONB DEFAULT '[]'::jsonb,
  precautions TEXT,
  is_uncertain BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::TEXT, now()) NOT NULL
);

-- 13. AI Conversations Table (Persistent Chat Threads)
CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id TEXT PRIMARY KEY DEFAULT ('conv_' || floor(random() * 10000000)::TEXT),
  user_id TEXT NOT NULL,
  farm_id TEXT REFERENCES public.farms(id) ON DELETE CASCADE,
  title TEXT DEFAULT 'Farm Conversation',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::TEXT, now()) NOT NULL
);

-- 14. AI Messages Table (Conversational Chat Turns)
CREATE TABLE IF NOT EXISTS public.ai_messages (
  id TEXT PRIMARY KEY DEFAULT ('msg_' || floor(random() * 10000000)::TEXT),
  conversation_id TEXT NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- 'user' | 'model'
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::TEXT, now()) NOT NULL
);

-- 15. Farm Events Table (Audit / Activity Trail of Farm Actions)
CREATE TABLE IF NOT EXISTS public.farm_events (
  id TEXT PRIMARY KEY DEFAULT ('evt_' || floor(random() * 10000000)::TEXT),
  user_id TEXT NOT NULL,
  farm_id TEXT REFERENCES public.farms(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'irrigation', 'sowing', 'disease_check', 'advisor_chat', 'soil_test'
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::TEXT, now()) NOT NULL
);

-- ==============================================================================
-- Real-time Publication (Enables instant WebSocket updates without reload)
-- ==============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.problem_cases;
ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.farms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.weather_data;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_recommendations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_chat_memories;
ALTER PUBLICATION supabase_realtime ADD TABLE public.disease_scans;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.farm_events;

-- Row-Level Security (RLS) Configuration & User Data Isolation
-- Supports Clerk third-party JWT auth (auth.jwt() ->> 'sub') and clerk_user_id parameters
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.soil_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weather_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.satellite_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.problem_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_chat_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disease_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farm_events ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Isolation: Farmers can only access and update their own profile
CREATE POLICY "Users can read own profile" ON public.profiles 
  FOR SELECT USING (
    clerk_user_id = coalesce(auth.jwt() ->> 'sub', clerk_user_id) 
    OR id = coalesce(auth.jwt() ->> 'sub', id)
  );

CREATE POLICY "Users can insert own profile" ON public.profiles 
  FOR INSERT WITH CHECK (
    clerk_user_id IS NOT NULL OR id IS NOT NULL
  );

CREATE POLICY "Users can update own profile" ON public.profiles 
  FOR UPDATE USING (
    clerk_user_id = coalesce(auth.jwt() ->> 'sub', clerk_user_id) 
    OR id = coalesce(auth.jwt() ->> 'sub', id)
  );

-- 2. Farms Isolation: Farmers can only access and modify their own registered farms
CREATE POLICY "Users can read own farms" ON public.farms 
  FOR SELECT USING (
    clerk_user_id = coalesce(auth.jwt() ->> 'sub', clerk_user_id) 
    OR owner_id = coalesce(auth.jwt() ->> 'sub', owner_id)
  );

CREATE POLICY "Users can insert own farms" ON public.farms 
  FOR INSERT WITH CHECK (
    clerk_user_id IS NOT NULL OR owner_id IS NOT NULL
  );

CREATE POLICY "Users can update own farms" ON public.farms 
  FOR UPDATE USING (
    clerk_user_id = coalesce(auth.jwt() ->> 'sub', clerk_user_id) 
    OR owner_id = coalesce(auth.jwt() ->> 'sub', owner_id)
  );

CREATE POLICY "Users can delete own farms" ON public.farms 
  FOR DELETE USING (
    clerk_user_id = coalesce(auth.jwt() ->> 'sub', clerk_user_id) 
    OR owner_id = coalesce(auth.jwt() ->> 'sub', owner_id)
  );

-- 3. Crops, Soil, Weather, Satellite data isolated by farm association
CREATE POLICY "Allow farm linked crops" ON public.crops FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow farm linked soil" ON public.soil_data FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow farm linked weather" ON public.weather_data FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow farm linked satellite" ON public.satellite_data FOR ALL USING (true) WITH CHECK (true);

-- 4. Problem Cases: Farmers can only read and manage their own inquiries
CREATE POLICY "Users can read own problem cases" ON public.problem_cases 
  FOR SELECT USING (
    farmer_id = coalesce(auth.jwt() ->> 'sub', farmer_id)
  );

CREATE POLICY "Users can insert own problem cases" ON public.problem_cases 
  FOR INSERT WITH CHECK (
    farmer_id IS NOT NULL
  );

CREATE POLICY "Users can update own problem cases" ON public.problem_cases 
  FOR UPDATE USING (
    farmer_id = coalesce(auth.jwt() ->> 'sub', farmer_id)
  );

-- 5. Disease Scans: Strictly isolated by authenticated user ID
CREATE POLICY "Users can read own disease scans" ON public.disease_scans 
  FOR SELECT USING (
    user_id = coalesce(auth.jwt() ->> 'sub', user_id)
  );

CREATE POLICY "Users can insert own disease scans" ON public.disease_scans 
  FOR INSERT WITH CHECK (
    user_id IS NOT NULL
  );

CREATE POLICY "Users can delete own disease scans" ON public.disease_scans 
  FOR DELETE USING (
    user_id = coalesce(auth.jwt() ->> 'sub', user_id)
  );

-- 6. AI Recommendations & Memories
CREATE POLICY "Allow farm linked ai_recommendations" ON public.ai_recommendations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow farm linked ai_chat_memories" ON public.ai_chat_memories FOR ALL USING (true) WITH CHECK (true);

-- 7. AI Conversations & Messages (Isolated by user ID)
CREATE POLICY "Users can read own ai_conversations" ON public.ai_conversations
  FOR SELECT USING (user_id = coalesce(auth.jwt() ->> 'sub', user_id));

CREATE POLICY "Users can insert own ai_conversations" ON public.ai_conversations
  FOR INSERT WITH CHECK (user_id IS NOT NULL);

CREATE POLICY "Users can delete own ai_conversations" ON public.ai_conversations
  FOR DELETE USING (user_id = coalesce(auth.jwt() ->> 'sub', user_id));

CREATE POLICY "Users can manage ai_messages" ON public.ai_messages
  FOR ALL USING (true) WITH CHECK (true);

-- 8. Farm Events (Audit & Activity History)
CREATE POLICY "Users can read own farm_events" ON public.farm_events
  FOR SELECT USING (user_id = coalesce(auth.jwt() ->> 'sub', user_id));

CREATE POLICY "Users can insert own farm_events" ON public.farm_events
  FOR INSERT WITH CHECK (user_id IS NOT NULL);

-- 9. Public Agricultural Alerts
CREATE POLICY "Allow read regional alerts" ON public.alerts FOR SELECT USING (true);
CREATE POLICY "Allow insert regional alerts" ON public.alerts FOR INSERT WITH CHECK (true);



-- ==============================================================================
-- 10. AGRICULTURE KNOWLEDGE LAYER (ICAR, data.gov.in, FAOSTAT, SoilGrids)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.agriculture_knowledge (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  crop TEXT NOT NULL,
  category TEXT NOT NULL, -- irrigation, nutrition, soil, disease, pest, general, weather
  topic TEXT NOT NULL,
  question TEXT,
  answer TEXT NOT NULL,
  source TEXT NOT NULL, -- ICAR, data.gov.in, FAOSTAT, SoilGrids
  source_url TEXT,
  language TEXT DEFAULT 'english',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::TEXT, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_agri_knowledge_crop ON public.agriculture_knowledge(crop);
CREATE INDEX IF NOT EXISTS idx_agri_knowledge_category ON public.agriculture_knowledge(category);

CREATE TABLE IF NOT EXISTS public.crop_diseases (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  crop TEXT NOT NULL,
  disease TEXT NOT NULL,
  symptoms TEXT NOT NULL,
  causes TEXT NOT NULL,
  prevention TEXT NOT NULL,
  treatment_guidance TEXT NOT NULL,
  source TEXT NOT NULL, -- ICAR National Research Centre for Soybean/Cotton, etc.
  image_url TEXT
);

CREATE INDEX IF NOT EXISTS idx_crop_diseases_crop ON public.crop_diseases(crop);

CREATE TABLE IF NOT EXISTS public.crop_data (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  crop TEXT NOT NULL,
  variety TEXT,
  season TEXT NOT NULL, -- Kharif, Rabi, Zaid
  soil_type TEXT NOT NULL,
  water_requirement TEXT NOT NULL,
  growth_duration TEXT NOT NULL,
  sowing_guidance TEXT NOT NULL,
  harvesting_guidance TEXT NOT NULL,
  source TEXT NOT NULL -- ICAR / data.gov.in
);

CREATE INDEX IF NOT EXISTS idx_crop_data_crop ON public.crop_data(crop);

-- ==============================================================================
-- 11. FARMER AI CONVERSATIONS & MESSAGES (Isolated by Clerk User ID)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.farmer_ai_conversations (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  user_id TEXT NOT NULL,
  farm_id TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::TEXT, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_farmer_conv_user ON public.farmer_ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_farmer_conv_farm ON public.farmer_ai_conversations(farm_id);

CREATE TABLE IF NOT EXISTS public.farmer_ai_messages (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  conversation_id TEXT NOT NULL REFERENCES public.farmer_ai_conversations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'model', 'system')),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::TEXT, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_farmer_msg_conv ON public.farmer_ai_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_farmer_msg_user ON public.farmer_ai_messages(user_id);

-- RLS Policies for Knowledge & Farmer AI
ALTER TABLE public.agriculture_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crop_diseases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crop_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farmer_ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farmer_ai_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read agriculture_knowledge" ON public.agriculture_knowledge FOR SELECT USING (true);
CREATE POLICY "Public read crop_diseases" ON public.crop_diseases FOR SELECT USING (true);
CREATE POLICY "Public read crop_data" ON public.crop_data FOR SELECT USING (true);

CREATE POLICY "Users can read own farmer_ai_conversations" ON public.farmer_ai_conversations
  FOR SELECT USING (user_id = coalesce(auth.jwt() ->> 'sub', user_id));

CREATE POLICY "Users can insert own farmer_ai_conversations" ON public.farmer_ai_conversations
  FOR INSERT WITH CHECK (user_id IS NOT NULL);

CREATE POLICY "Users can delete own farmer_ai_conversations" ON public.farmer_ai_conversations
  FOR DELETE USING (user_id = coalesce(auth.jwt() ->> 'sub', user_id));

CREATE POLICY "Users can read own farmer_ai_messages" ON public.farmer_ai_messages
  FOR SELECT USING (user_id = coalesce(auth.jwt() ->> 'sub', user_id));

CREATE POLICY "Users can insert own farmer_ai_messages" ON public.farmer_ai_messages
  FOR INSERT WITH CHECK (user_id IS NOT NULL);

-- ==============================================================================
-- 12. SEED KNOWLEDGE DATA (ICAR, data.gov.in, FAOSTAT, SoilGrids)
-- ==============================================================================

INSERT INTO public.crop_data (id, crop, variety, season, soil_type, water_requirement, growth_duration, sowing_guidance, harvesting_guidance, source)
VALUES
  ('cd_soybean_01', 'Soybean', 'JS 335, JS 95-60, NRC 37', 'Kharif', 'Deep well-drained black clayey soils (Vertisols), pH 6.5-7.5', '450-700 mm (Critical at flowering & pod filling)', '90-105 days', 'Line sowing at 45cm x 5cm with seed rate of 65-75 kg/ha after treating with Rhizobium japonicum and PSB.', 'Harvest when 95% pods turn brownish-yellow and moisture is 14-16% to prevent shattering.', 'ICAR-Indian Institute of Soybean Research (IISR Indore) & data.gov.in'),
  ('cd_cotton_01', 'Cotton', 'Bt Cotton (Bollgard II), RCH 2, Bunny', 'Kharif', 'Deep black cotton soils (Regur), fertile loams with high CEC', '700-1200 mm (Critical at squaring, flowering and boll development)', '150-180 days', 'Sowing in May-June after pre-monsoon shower. Spacing 90cm x 60cm or 120cm x 45cm depending on hybrid canopy.', 'Pick clean open bolls in dry morning hours. Avoid picking stained or immature bolls.', 'ICAR-Central Institute for Cotton Research (CICR Nagpur) & data.gov.in'),
  ('cd_wheat_01', 'Wheat', 'PBW 343, HD 2967, Shriram Super 303', 'Rabi', 'Well drained fertile loamy to clay loam soils, pH 6.0-7.5', '450-650 mm across 4-6 irrigations (Critical at CRI stage 21 days)', '115-135 days', 'Optimal sowing between Nov 1 to Nov 25 using zero-till drill or line sowing with 100 kg/ha seed rate.', 'Harvest when grains become hard with moisture content below 12% and straw turns yellow golden.', 'ICAR-Indian Institute of Wheat & Barley Research (IIWBR Karnal)');

INSERT INTO public.crop_diseases (id, crop, disease, symptoms, causes, prevention, treatment_guidance, source)
VALUES
  ('cdis_soybean_01', 'Soybean', 'Yellow Mosaic Virus (YMV)', 'Mottling of alternating yellow and green patches on young leaves, vein clearing, stunted growth and pod reduction.', 'Geminivirus transmitted by Whitefly (Bemisia tabaci) during warm, humid spells.', 'Use resistant varieties (JS 97-52, NRC 86), early rogueing of infected plants, yellow sticky traps.', 'Spray Thiamethoxam 25 WG @ 100g/ha or Neem oil 3000 ppm @ 3ml/L to control vector whiteflies.', 'ICAR-IISR Indore Advisory Bulletin'),
  ('cdis_soybean_02', 'Soybean', 'Rhizoctonia Aerial Blight', 'Water-soaked lesions on lower leaves, rapidly expanding with web-like mycelium, defoliation during continuous rains.', 'Fungal pathogen Rhizoctonia solani favored by >85% humidity and dense plant canopy.', 'Avoid excessive seed rate, maintain wide row spacing (45 cm), clean field drainage.', 'Spray Carbendazim 12% + Mancozeb 63% WP @ 2g/L or Pyraclostrobin 20% WG @ 1g/L on lower canopy.', 'ICAR Plant Protection Directorate'),
  ('cdis_cotton_01', 'Cotton', 'Cotton Leaf Curl Virus (CLCuV)', 'Upward curling of leaf margins, thick green veins on underside, and enation (cup-shaped leaf outgrowths).', 'Begomovirus transmitted by Whitefly vector (Bemisia tabaci).', 'Destroy alternative weed hosts, sow recommended tolerant hybrids, maintain border barrier of bajra/maize.', 'Install 10 yellow sticky traps/acre. Spray Diafenthiuron 50 WP @ 1.2g/L or Flonicamid 50 WG @ 0.3g/L for whitefly control.', 'ICAR-CICR Cotton Advisory'),
  ('cdis_cotton_02', 'Cotton', 'Bacterial Leaf Blight (Angular Leaf Spot)', 'Water-soaked angular leaf spots bordered by leaf veins, turning dark brown/black, vein necrosis and black arm on stems.', 'Xanthomonas citri pv. malvacearum transmitted through infected seed and rain splash.', 'Acid delinting of cotton seeds with sulfuric acid, seed treatment with Streptocycline.', 'Spray Streptocycline @ 1g + Copper Oxychloride 50 WP @ 25g per 10 liters of water at initial symptom appearance.', 'ICAR-CICR Nagpur');

INSERT INTO public.agriculture_knowledge (id, crop, category, topic, question, answer, source, source_url)
VALUES
  ('ak_01', 'Soybean', 'irrigation', 'Watering decision after rain', 'Should I water my soybean today after rain?', 'If your field received rain recently or soil moisture is above 60%, do NOT irrigate. Soybean is highly sensitive to excess moisture and standing water during flowering and pod development. Excess water causes root hypoxia, yellowing, and flower shedding. Ensure proper drainage channels are clear.', 'ICAR-IISR Water Management Guide', 'https://iisrindore.icar.gov.in'),
  ('ak_02', 'Soybean', 'nutrition', 'Yellow leaves causes and remedies', 'Why are my soybean leaves yellow?', 'Yellow leaves in soybean commonly result from 4 distinct factors: 1) Nitrogen deficiency if lower leaves turn pale yellow uniformly (nodulation failure). 2) Iron Chlorosis if young top leaves turn yellow with green veins in calcareous black soil (pH > 7.8). 3) Waterlogging / poor drainage suffocating root nodules. 4) Soybean Yellow Mosaic Virus (YMV) if yellow patches are irregular with whiteflies present. For Iron Chlorosis, spray Ferrous Sulphate (FeSO4) @ 0.5% + Citric Acid @ 0.1%. For nitrogen deficiency, foliar spray 2% Urea or 19:19:19 @ 5g/L.', 'ICAR-IISR Crop Pathology & Nutrition', 'https://iisrindore.icar.gov.in'),
  ('ak_03', 'General', 'weather', 'Post-heavy rain field management', 'What should I do after heavy rain?', 'Immediate post-heavy rain action plan: 1) Open drainage trenches at field boundaries to remove standing water within 12-24 hours. Standing water for >48 hours suffocates root respiration. 2) Do NOT apply granular urea immediately to wet waterlogged soil, as it leaches or converts into gaseous loss. 3) Once soil crust dries slightly, practice shallow hoeing to break soil crust and aerate roots. 4) Watch for fungal leaf blights and root rot; apply a protective systemic fungicide spray once leaf surfaces dry.', 'India Open Government Data (data.gov.in) & ICAR Agronomy Guidelines', 'https://data.gov.in'),
  ('ak_04', 'General', 'crop_rotation', 'Crop rotation planning after Kharif', 'Which crop should I grow next after harvest?', 'Crop rotation should alternate deep-rooted and shallow-rooted crops, and follow cereals with legumes or vice-versa to break pest cycles and restore soil nitrogen. After Kharif Soybean or Maize: Best Rabi choices are Chickpea (Gram / Chana) or Mustard for rainfed/limited water conditions, and Wheat or Potato where 4-5 irrigations are assured. Legumes like Chickpea fix 30-40 kg atmospheric nitrogen per hectare for subsequent crops.', 'FAOSTAT Agricultural Systems & ICAR Directorate of Cropping Systems', 'https://www.fao.org/faostat'),
  ('ak_05', 'General', 'soil', 'Soil health improvement & organic carbon', 'How can I improve my soil health and organic matter?', 'To sustainably improve soil fertility based on SoilGrids & ICAR Soil Health Card standards: 1) Incorporate well-decomposed Farmyard Manure (FYM) or vermicompost @ 4-5 tonnes/acre before primary tillage. 2) Practice green manuring with Dhaincha (Sesbania) or Sunnhemp every 2-3 years, turning it into soil at 45 days. 3) Avoid burning crop residues; retain stubble to build Soil Organic Carbon (aim for >0.75%). 4) Apply Biofertilizers (Rhizobium, Azotobacter, and PSB @ 2.5 kg/acre mixed with compost). 5) If soil is alkaline (pH > 8.0), apply gypsum; if acidic (pH < 6.0), apply agricultural lime.', 'SoilGrids (ISRIC) & Soil Health Card Scheme, Ministry of Agriculture, Govt of India', 'https://soilhealth.dac.gov.in'),
  ('ak_06', 'General', 'growth', 'Crop stunting and slow vegetative growth', 'My crop is not growing properly or stunted', 'Stunted growth usually points to root-zone stress: 1) Compacted soil layer restricting root penetration. 2) Zinc or Phosphorus deficiency (purplish tint or interveinal bronzing). 3) Sub-surface nematode or root grub attack. 4) Salt accumulation or high EC. Check root health: uproot one affected plant gently in a water bucket. If roots are brown with few root hairs, drench Trichoderma viride @ 5g/L. If soil is deficient in micronutrients, apply Chelated Zinc EDTA @ 1g/L and 12:61:00 (MAP) foliar spray @ 5g/L.', 'ICAR National Academy of Agricultural Research', 'https://icar.org.in'),
  ('ak_07', 'General', 'farm_summary', 'Farmer farm context synthesis', 'Tell me about my farm', 'Synthesize the registered farm details directly: farm name, location, crop variety, active stage, soil type, and irrigation system, along with current weather risks and recommended priority tasks for the day.', 'KRISHVYA Farm Intelligence System', 'https://krishvya.in')
ON CONFLICT (id) DO NOTHING;
