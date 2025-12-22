-- Migration: Lead Source Tracking
-- Description: Add newsletter subscribers table and lead source tracking to profiles

-- ============================================
-- 1. Create newsletter_subscribers table
-- ============================================

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  source TEXT NOT NULL DEFAULT 'website_newsletter',
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  converted_to_account BOOLEAN DEFAULT false,
  converted_at TIMESTAMP WITH TIME ZONE,
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_email ON newsletter_subscribers(email);

-- Index for source filtering
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_source ON newsletter_subscribers(source);

-- Index for finding unconverted subscribers
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_converted ON newsletter_subscribers(converted_to_account) WHERE converted_to_account = false;

-- ============================================
-- 2. Add lead_source columns to profiles table
-- ============================================

-- Add lead_source column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'lead_source') THEN
    ALTER TABLE profiles ADD COLUMN lead_source TEXT DEFAULT 'website_signup';
  END IF;
END $$;

-- Add referral_source column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'referral_source') THEN
    ALTER TABLE profiles ADD COLUMN referral_source TEXT;
  END IF;
END $$;

-- Add UTM tracking columns to profiles if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'utm_source') THEN
    ALTER TABLE profiles ADD COLUMN utm_source TEXT;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'utm_medium') THEN
    ALTER TABLE profiles ADD COLUMN utm_medium TEXT;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'utm_campaign') THEN
    ALTER TABLE profiles ADD COLUMN utm_campaign TEXT;
  END IF;
END $$;

-- ============================================
-- 3. Row Level Security for newsletter_subscribers
-- ============================================

ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role has full access to newsletter_subscribers" ON newsletter_subscribers
  FOR ALL USING (auth.role() = 'service_role');

-- Allow anon users to insert (for signup form)
CREATE POLICY "Anyone can subscribe to newsletter" ON newsletter_subscribers
  FOR INSERT WITH CHECK (true);

-- Allow authenticated users to read (for admin dashboard)
CREATE POLICY "Authenticated users can view newsletter_subscribers" ON newsletter_subscribers
  FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================
-- 4. Function to check if email exists and auto-link
-- ============================================

CREATE OR REPLACE FUNCTION check_newsletter_conversion()
RETURNS TRIGGER AS $$
BEGIN
  -- When a new profile is created, check if they were a newsletter subscriber
  UPDATE newsletter_subscribers
  SET 
    converted_to_account = true,
    converted_at = NOW(),
    profile_id = NEW.id
  WHERE email = NEW.email
    AND converted_to_account = false;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-link newsletter subscribers when they create an account
DROP TRIGGER IF EXISTS on_profile_created_check_newsletter ON profiles;
CREATE TRIGGER on_profile_created_check_newsletter
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION check_newsletter_conversion();

-- ============================================
-- 5. Updated_at trigger for newsletter_subscribers
-- ============================================

CREATE OR REPLACE FUNCTION update_newsletter_subscribers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_newsletter_subscribers_updated_at ON newsletter_subscribers;
CREATE TRIGGER update_newsletter_subscribers_updated_at
  BEFORE UPDATE ON newsletter_subscribers
  FOR EACH ROW
  EXECUTE FUNCTION update_newsletter_subscribers_updated_at();

