-- ==============================================================================
-- KRISHVYA (Smart Indian Agriculture) - Supabase Cloud Database Schema
-- Run this script in your Supabase SQL Editor: https://app.supabase.com
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Profiles Table (Farmers, Agronomists & Admins)
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
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

-- 3. Farms Table
CREATE TABLE IF NOT EXISTS public.farms (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  owner_id TEXT NOT NULL,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  district TEXT NOT NULL,
  state TEXT NOT NULL,
  latitude FLOAT8 NOT NULL DEFAULT 21.3855,
  longitude FLOAT8 NOT NULL DEFAULT 78.9189,
  size NUMERIC NOT NULL DEFAULT 2.5,
  size_unit TEXT NOT NULL DEFAULT 'acres',
  farm_health_score INTEGER NOT NULL DEFAULT 84,
  irrigation_type TEXT NOT NULL DEFAULT 'Drip',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::TEXT, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::TEXT, now()) NOT NULL
);

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

-- ==============================================================================
-- Row-Level Security (RLS) Configuration
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

CREATE POLICY "Allow anon all ai_recommendations" ON public.ai_recommendations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all ai_chat_memories" ON public.ai_chat_memories FOR ALL USING (true) WITH CHECK (true);

-- Allow public read/write access for anon key in KRISHVYA
CREATE POLICY "Allow anon read all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow anon insert profiles" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update profiles" ON public.profiles FOR UPDATE USING (true);

CREATE POLICY "Allow anon read all farms" ON public.farms FOR SELECT USING (true);
CREATE POLICY "Allow anon insert farms" ON public.farms FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update farms" ON public.farms FOR UPDATE USING (true);

CREATE POLICY "Allow anon read all crops" ON public.crops FOR SELECT USING (true);
CREATE POLICY "Allow anon insert crops" ON public.crops FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update crops" ON public.crops FOR UPDATE USING (true);

CREATE POLICY "Allow anon read all soil" ON public.soil_data FOR SELECT USING (true);
CREATE POLICY "Allow anon update soil" ON public.soil_data FOR ALL USING (true);

CREATE POLICY "Allow anon read all weather" ON public.weather_data FOR SELECT USING (true);
CREATE POLICY "Allow anon update weather" ON public.weather_data FOR ALL USING (true);

CREATE POLICY "Allow anon read all satellite" ON public.satellite_data FOR SELECT USING (true);
CREATE POLICY "Allow anon update satellite" ON public.satellite_data FOR ALL USING (true);

CREATE POLICY "Allow anon read all problems" ON public.problem_cases FOR SELECT USING (true);
CREATE POLICY "Allow anon insert problems" ON public.problem_cases FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update problems" ON public.problem_cases FOR UPDATE USING (true);

CREATE POLICY "Allow anon read all alerts" ON public.alerts FOR SELECT USING (true);
CREATE POLICY "Allow anon insert alerts" ON public.alerts FOR INSERT WITH CHECK (true);

ALTER TABLE public.disease_scans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anon all disease_scans" ON public.disease_scans FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- Initial Demo Seed Data
-- ==============================================================================
INSERT INTO public.profiles (id, name, phone, email, role, village, district, state, total_land_acres, experience_years)
VALUES 
  ('usr_ramesh_01', 'Ramesh Singh', '+91 98765 43210', 'ramesh.singh@krishvya.in', 'farmer', 'Saoner', 'Nagpur', 'Maharashtra, India', 2.5, 18),
  ('usr_expert_01', 'Dr. Sunita Deshmukh', '+91 98111 22334', 'expert.deshmukh@krishvya.in', 'expert', 'Nagpur Central', 'Nagpur', 'Maharashtra, India', 0.0, 22)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.farms (id, owner_id, name, address, district, state, latitude, longitude, size, size_unit, farm_health_score, irrigation_type)
VALUES
  ('farm_01', 'usr_ramesh_01', 'Ramesh Shwet Farm', 'Saoner, Nagpur District', 'Nagpur', 'Maharashtra, India', 21.3855, 78.9189, 2.5, 'acres', 84, 'Drip')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.crops (id, farm_id, name, variety, stage, sowing_date, expected_harvest_date)
VALUES
  ('crop_01', 'farm_01', 'Soybean', 'JS-335 Gold', 'Flowering', '2024-06-15', '2024-10-20')
ON CONFLICT (farm_id) DO NOTHING;

INSERT INTO public.soil_data (id, farm_id, health_score, nitrogen, phosphorus, potassium, ph, organic_carbon, moisture_percentage, soil_type)
VALUES
  ('soil_01', 'farm_01', 78, 'Good', 'Medium', 'Good', 6.7, 'Medium (0.6%)', 42.0, 'Loamy Black Cotton')
ON CONFLICT (farm_id) DO NOTHING;

INSERT INTO public.weather_data (id, farm_id, temperature, condition, rain_probability, humidity, wind_speed_kmh, advice)
VALUES
  ('weather_01', 'farm_01', 28.0, 'Partly Cloudy', 60.0, 72.0, 12.0, 'Rain is expected tomorrow. We recommend delaying irrigation today.')
ON CONFLICT (farm_id) DO NOTHING;

INSERT INTO public.satellite_data (id, farm_id, health_score, ndvi, stress_detected, stress_area_description)
VALUES
  ('sat_01', 'farm_01', 82, 0.78, false, 'Slight lower vegetative density in north-east border, within normal threshold.')
ON CONFLICT (farm_id) DO NOTHING;

INSERT INTO public.problem_cases (id, farmer_id, farm_id, category, title, description, status, confidence_score, ai_recommendation, expert_notes)
VALUES
  ('case_seed_01', 'usr_ramesh_01', 'farm_01', 'disease_pest', 'DISEASE / PEST Reported', 'Brown spots and yellow halos observed on lower soybean leaves.', 'expert_review', 74.0, 'Early Leaf Blight detected. Case escalated to Dr. Sunita Deshmukh for validation.', 'Field team instructed to inspect moisture accumulation along Sector B border.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.alerts (id, district, category, title, description, severity, actionable_text)
VALUES
  ('alt_01', 'Nagpur', 'weather', 'Heavy Rain Expected', 'Rainfall 40mm expected tomorrow. Consider postponing fertilizer and pesticide spraying.', 'high', 'Delay Irrigation'),
  ('alt_02', 'Nagpur', 'crop', 'Crop Stress Detected', 'NDVI vegetative anomaly observed in the northern border of your 2.5 acre field.', 'medium', 'View Satellite Map'),
  ('alt_03', 'Nagpur', 'soil', 'Soil Moisture Low in Sector B', 'Moisture dropped to 34% in upper soil tier. Prepare light drip irrigation if rain delays.', 'medium', 'Check Soil Status'),
  ('alt_04', 'Nagpur', 'crop', 'High Disease Risk: Leaf Blight', 'Current humidity (72%) and warm temperature elevate risk of fungal leaf spots in soybean.', 'high', 'Scan Leaves Now')
ON CONFLICT (id) DO NOTHING;
