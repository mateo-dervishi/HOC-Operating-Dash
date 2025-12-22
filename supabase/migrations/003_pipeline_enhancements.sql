-- Migration: Pipeline Enhancements
-- Description: Update pipeline stages and add payment tracking

-- ============================================
-- 1. Update client_pipeline table stages
-- ============================================

-- Drop and recreate the stage constraint with new values
ALTER TABLE client_pipeline DROP CONSTRAINT IF EXISTS client_pipeline_stage_check;

ALTER TABLE client_pipeline ADD CONSTRAINT client_pipeline_stage_check 
  CHECK (stage IN (
    'submitted',        -- Selection submitted, needs review
    'contacted',        -- Initial contact made
    'meeting_scheduled', -- Meeting booked
    'quoted',           -- Quote sent
    'deposit_paid',     -- 20% deposit received
    'in_production',    -- 70% paid, production started
    'ready_delivery',   -- Ready for delivery, awaiting final 10%
    'completed',        -- Fully paid and delivered
    'lost'              -- Did not convert
  ));

-- Update existing stages to new values
UPDATE client_pipeline SET stage = 'submitted' WHERE stage = 'new_lead';
UPDATE client_pipeline SET stage = 'submitted' WHERE stage = 'selection_submitted';
UPDATE client_pipeline SET stage = 'quoted' WHERE stage = 'negotiating';
UPDATE client_pipeline SET stage = 'deposit_paid' WHERE stage = 'confirmed';
UPDATE client_pipeline SET stage = 'in_production' WHERE stage = 'in_progress';
UPDATE client_pipeline SET stage = 'completed' WHERE stage = 'delivered';
UPDATE client_pipeline SET stage = 'completed' WHERE stage = 'complete';

-- ============================================
-- 2. Add new columns to client_pipeline
-- ============================================

-- Add meeting_date column
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'client_pipeline' AND column_name = 'meeting_date') THEN
    ALTER TABLE client_pipeline ADD COLUMN meeting_date TIMESTAMPTZ;
  END IF;
END $$;

-- Add last_contacted_at column
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'client_pipeline' AND column_name = 'last_contacted_at') THEN
    ALTER TABLE client_pipeline ADD COLUMN last_contacted_at TIMESTAMPTZ;
  END IF;
END $$;

-- Add quote_id reference
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'client_pipeline' AND column_name = 'quote_id') THEN
    ALTER TABLE client_pipeline ADD COLUMN quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add order_id reference
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'client_pipeline' AND column_name = 'order_id') THEN
    ALTER TABLE client_pipeline ADD COLUMN order_id UUID REFERENCES orders(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add source tracking
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'client_pipeline' AND column_name = 'source') THEN
    ALTER TABLE client_pipeline ADD COLUMN source TEXT DEFAULT 'website_signup';
  END IF;
END $$;

-- ============================================
-- 3. Add interest_level to profiles for leads
-- ============================================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'interest_level') THEN
    ALTER TABLE profiles ADD COLUMN interest_level TEXT DEFAULT 'warm' CHECK (interest_level IN ('cold', 'warm', 'hot'));
  END IF;
END $$;

-- ============================================
-- 4. Create payments table for tracking 20/70/10
-- ============================================

CREATE TABLE IF NOT EXISTS client_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  pipeline_id UUID REFERENCES client_pipeline(id) ON DELETE SET NULL,
  quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('deposit', 'production', 'delivery', 'other')),
  percentage INTEGER, -- 20, 70, or 10
  amount DECIMAL(12,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  due_date DATE,
  paid_at TIMESTAMPTZ,
  payment_method TEXT,
  reference TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for payments
CREATE INDEX IF NOT EXISTS idx_client_payments_client ON client_payments(client_id);
CREATE INDEX IF NOT EXISTS idx_client_payments_pipeline ON client_payments(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_client_payments_status ON client_payments(status);

-- Enable RLS
ALTER TABLE client_payments ENABLE ROW LEVEL SECURITY;

-- Admin access policy
CREATE POLICY client_payments_admin ON client_payments
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.user_id = auth.uid() AND au.is_active = TRUE
    )
  );

-- ============================================
-- 5. Create lead_activities table
-- ============================================

CREATE TABLE IF NOT EXISTS lead_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'status_change', 
    'note_added', 
    'email_sent', 
    'call_made', 
    'sms_sent',
    'meeting_scheduled',
    'meeting_completed',
    'quote_sent', 
    'payment_received',
    'order_created',
    'delivery_scheduled'
  )),
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_lead_activities_client ON lead_activities(client_id);
CREATE INDEX IF NOT EXISTS idx_lead_activities_type ON lead_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_lead_activities_created ON lead_activities(created_at);

-- Enable RLS
ALTER TABLE lead_activities ENABLE ROW LEVEL SECURITY;

-- Admin access policy
CREATE POLICY lead_activities_admin ON lead_activities
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.user_id = auth.uid() AND au.is_active = TRUE
    )
  );

-- ============================================
-- 6. Create lead_outreach table for marketing
-- ============================================

CREATE TABLE IF NOT EXISTS lead_outreach (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  outreach_type TEXT NOT NULL CHECK (outreach_type IN ('email', 'call', 'sms', 'meeting', 'other')),
  outcome TEXT NOT NULL CHECK (outcome IN (
    'no_answer', 
    'voicemail', 
    'spoke', 
    'email_sent', 
    'meeting_booked', 
    'not_interested', 
    'follow_up_needed'
  )),
  notes TEXT,
  follow_up_date DATE,
  created_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_lead_outreach_client ON lead_outreach(client_id);
CREATE INDEX IF NOT EXISTS idx_lead_outreach_follow_up ON lead_outreach(follow_up_date) WHERE follow_up_date IS NOT NULL;

-- Enable RLS
ALTER TABLE lead_outreach ENABLE ROW LEVEL SECURITY;

-- Admin access policy
CREATE POLICY lead_outreach_admin ON lead_outreach
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.user_id = auth.uid() AND au.is_active = TRUE
    )
  );

-- ============================================
-- 7. Add nurturing_status to profiles
-- ============================================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'nurturing_status') THEN
    ALTER TABLE profiles ADD COLUMN nurturing_status TEXT DEFAULT 'active' CHECK (nurturing_status IN ('active', 'nurturing', 'not_interested', 'do_not_contact'));
  END IF;
END $$;

-- ============================================
-- 8. Function to auto-create pipeline entry on submission
-- ============================================

CREATE OR REPLACE FUNCTION create_pipeline_on_submission()
RETURNS TRIGGER AS $$
BEGIN
  -- Create pipeline entry when a selection is submitted
  INSERT INTO client_pipeline (client_id, stage, estimated_value, source)
  VALUES (
    NEW.profile_id, 
    'submitted', 
    NEW.estimated_value,
    COALESCE((SELECT lead_source FROM profiles WHERE id = NEW.profile_id), 'website_signup')
  )
  ON CONFLICT (client_id) 
  DO UPDATE SET 
    stage = 'submitted',
    estimated_value = NEW.estimated_value,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-creating pipeline
DROP TRIGGER IF EXISTS on_selection_submitted ON selection_submissions;
CREATE TRIGGER on_selection_submitted
  AFTER INSERT ON selection_submissions
  FOR EACH ROW
  EXECUTE FUNCTION create_pipeline_on_submission();

-- ============================================
-- 9. Updated_at triggers
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_client_payments_updated_at ON client_payments;
CREATE TRIGGER update_client_payments_updated_at
  BEFORE UPDATE ON client_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();


