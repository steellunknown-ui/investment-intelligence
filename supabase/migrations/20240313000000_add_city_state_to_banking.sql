-- Migration: Add city and state columns to bank_accounts table
-- Run in: Supabase Dashboard → SQL Editor → New Query

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='bank_accounts' AND column_name='city') THEN
    ALTER TABLE public.bank_accounts ADD COLUMN city TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='bank_accounts' AND column_name='state') THEN
    ALTER TABLE public.bank_accounts ADD COLUMN state TEXT;
  END IF;
END $$;
