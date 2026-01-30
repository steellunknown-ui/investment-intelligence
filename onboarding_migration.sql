-- Onboarding Profile Columns Migration
-- Run this in your Supabase SQL Editor

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS onboarding_dismissed_at timestamptz;
