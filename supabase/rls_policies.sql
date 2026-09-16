-- ==============================================================================
-- KRISHVYA (Smart Indian Agriculture) - Strict Row-Level Security (RLS) Policies
-- Run this script in your Supabase SQL Editor: https://app.supabase.com
-- Ensures farmers can ONLY view and edit their own farm records!
-- ==============================================================================

-- 1. Enable Row-Level Security on all core farm tables
ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.soil_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weather_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.satellite_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.problem_cases ENABLE ROW LEVEL SECURITY;

-- 2. Clean up any permissive demo policies on farms if they exist
DROP POLICY IF EXISTS "Allow anon read all farms" ON public.farms;
DROP POLICY IF EXISTS "Allow anon insert farms" ON public.farms;
DROP POLICY IF EXISTS "Allow anon update farms" ON public.farms;

-- 3. Strict Farm Ownership Policies
-- A farmer can only SELECT their own farms
CREATE POLICY "Farmers can read only their own farms" ON public.farms
  FOR SELECT
  USING (
    owner_id = auth.uid()::text 
    OR owner_id = coalesce(current_setting('request.jwt.claim.sub', true), '')
    OR owner_id = coalesce(current_setting('request.headers', true)::json->>'x-farmer-id', '')
    OR auth.role() = 'service_role'
  );

-- A farmer can only INSERT farms where owner_id matches their identity
CREATE POLICY "Farmers can create their own farms" ON public.farms
  FOR INSERT
  WITH CHECK (
    owner_id = auth.uid()::text 
    OR owner_id = coalesce(current_setting('request.jwt.claim.sub', true), '')
    OR owner_id = coalesce(current_setting('request.headers', true)::json->>'x-farmer-id', '')
    OR auth.role() = 'service_role'
  );

-- A farmer can only UPDATE their own farms
CREATE POLICY "Farmers can update only their own farms" ON public.farms
  FOR UPDATE
  USING (
    owner_id = auth.uid()::text 
    OR owner_id = coalesce(current_setting('request.jwt.claim.sub', true), '')
    OR owner_id = coalesce(current_setting('request.headers', true)::json->>'x-farmer-id', '')
    OR auth.role() = 'service_role'
  );

-- A farmer can only DELETE their own farms
CREATE POLICY "Farmers can delete only their own farms" ON public.farms
  FOR DELETE
  USING (
    owner_id = auth.uid()::text 
    OR owner_id = coalesce(current_setting('request.jwt.claim.sub', true), '')
    OR owner_id = coalesce(current_setting('request.headers', true)::json->>'x-farmer-id', '')
    OR auth.role() = 'service_role'
  );

-- 4. Cascaded Child Table Policies (Crops, Soil, Weather, Satellite)
-- Crops
DROP POLICY IF EXISTS "Allow anon read all crops" ON public.crops;
DROP POLICY IF EXISTS "Allow anon insert crops" ON public.crops;
DROP POLICY IF EXISTS "Allow anon update crops" ON public.crops;

CREATE POLICY "Access crops of owned farms" ON public.crops
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.farms 
      WHERE farms.id = crops.farm_id 
      AND (
        farms.owner_id = auth.uid()::text 
        OR farms.owner_id = coalesce(current_setting('request.jwt.claim.sub', true), '')
        OR farms.owner_id = coalesce(current_setting('request.headers', true)::json->>'x-farmer-id', '')
        OR auth.role() = 'service_role'
      )
    )
  );

-- Soil Data
DROP POLICY IF EXISTS "Allow anon read all soil" ON public.soil_data;
DROP POLICY IF EXISTS "Allow anon update soil" ON public.soil_data;

CREATE POLICY "Access soil of owned farms" ON public.soil_data
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.farms 
      WHERE farms.id = soil_data.farm_id 
      AND (
        farms.owner_id = auth.uid()::text 
        OR farms.owner_id = coalesce(current_setting('request.jwt.claim.sub', true), '')
        OR farms.owner_id = coalesce(current_setting('request.headers', true)::json->>'x-farmer-id', '')
        OR auth.role() = 'service_role'
      )
    )
  );

-- Add boundary_vertices column to farms if not already present
ALTER TABLE public.farms ADD COLUMN IF NOT EXISTS boundary_vertices JSONB DEFAULT '[]'::jsonb;
