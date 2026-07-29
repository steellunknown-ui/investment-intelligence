-- Migration: Add package_name column to transactions table
-- Run this in your Supabase SQL editor

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS package_name TEXT DEFAULT NULL;

COMMENT ON COLUMN transactions.package_name IS 
  'Android package name of the app that generated the notification (e.g. com.fampay.in)';
