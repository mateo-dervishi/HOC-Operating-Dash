-- House of Clarence Operations Platform Database Schema
-- Run this migration in your Supabase SQL editor

-- =====================================================
-- ADMIN USERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'sales' CHECK (role IN ('admin', 'sales', 'operations', 'manager')),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);

-- =====================================================
-- CLIENT PIPELINE TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS client_pipeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  stage TEXT NOT NULL DEFAULT 'new_lead' CHECK (stage IN (
    'new_lead', 
    'selection_submitted', 
    'quoted', 
    'negotiating', 
    'confirmed', 
    'in_progress', 
    'delivered', 
    'complete',
    'lost'
  )),
  assigned_to UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  estimated_value DECIMAL(12,2),
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  next_follow_up TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id)
);

-- Indexes for pipeline queries
CREATE INDEX IF NOT EXISTS idx_client_pipeline_stage ON client_pipeline(stage);
CREATE INDEX IF NOT EXISTS idx_client_pipeline_assigned ON client_pipeline(assigned_to);
CREATE INDEX IF NOT EXISTS idx_client_pipeline_priority ON client_pipeline(priority);
CREATE INDEX IF NOT EXISTS idx_client_pipeline_follow_up ON client_pipeline(next_follow_up);

-- =====================================================
-- QUOTES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_number TEXT UNIQUE NOT NULL,
  client_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft',
    'sent',
    'viewed',
    'approved',
    'rejected',
    'expired',
    'revised'
  )),
  version INTEGER DEFAULT 1,
  parent_quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,
  items JSONB NOT NULL DEFAULT '[]',
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  vat_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  notes TEXT,
  terms TEXT,
  valid_until DATE,
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for quote queries
CREATE INDEX IF NOT EXISTS idx_quotes_client ON quotes(client_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_valid_until ON quotes(valid_until);

-- =====================================================
-- ORDERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  client_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'confirmed',
    'processing',
    'partially_ordered',
    'ordered',
    'partially_received',
    'received',
    'ready_for_delivery',
    'partially_delivered',
    'delivered',
    'completed',
    'cancelled'
  )),
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  vat_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  delivery_address JSONB,
  billing_address JSONB,
  delivery_notes TEXT,
  internal_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for order queries
CREATE INDEX IF NOT EXISTS idx_orders_client ON orders(client_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_assigned ON orders(assigned_to);

-- =====================================================
-- ORDER ITEMS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_slug TEXT NOT NULL,
  product_name TEXT NOT NULL,
  product_image TEXT,
  colour TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(12,2) NOT NULL,
  total_price DECIMAL(12,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'ordered',
    'in_transit',
    'received',
    'ready',
    'delivered',
    'cancelled',
    'backordered'
  )),
  supplier_name TEXT,
  supplier_reference TEXT,
  expected_date DATE,
  received_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for order items
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_status ON order_items(status);

-- =====================================================
-- DELIVERIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  delivery_number TEXT,
  scheduled_date DATE NOT NULL,
  scheduled_time_window TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN (
    'scheduled',
    'confirmed',
    'out_for_delivery',
    'delivered',
    'failed',
    'rescheduled',
    'cancelled'
  )),
  delivery_address JSONB,
  contact_name TEXT,
  contact_phone TEXT,
  delivery_notes TEXT,
  driver_notes TEXT,
  items JSONB DEFAULT '[]',
  completed_at TIMESTAMPTZ,
  signature_url TEXT,
  proof_of_delivery_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for deliveries
CREATE INDEX IF NOT EXISTS idx_deliveries_order ON deliveries(order_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_date ON deliveries(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON deliveries(status);

-- =====================================================
-- CLIENT NOTES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS client_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  author_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  note_type TEXT NOT NULL DEFAULT 'general' CHECK (note_type IN (
    'general',
    'call',
    'meeting',
    'email',
    'important',
    'handoff',
    'follow_up'
  )),
  content TEXT NOT NULL,
  is_important BOOLEAN DEFAULT FALSE,
  is_pinned BOOLEAN DEFAULT FALSE,
  mentions UUID[] DEFAULT '{}',
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for notes
CREATE INDEX IF NOT EXISTS idx_client_notes_client ON client_notes(client_id);
CREATE INDEX IF NOT EXISTS idx_client_notes_author ON client_notes(author_id);
CREATE INDEX IF NOT EXISTS idx_client_notes_important ON client_notes(is_important) WHERE is_important = TRUE;

-- =====================================================
-- TEAM NOTIFICATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS team_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES admin_users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'mention',
    'assignment',
    'follow_up_due',
    'quote_expiring',
    'order_update',
    'delivery_scheduled',
    'new_lead',
    'system'
  )),
  title TEXT NOT NULL,
  message TEXT,
  link TEXT,
  metadata JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user ON team_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON team_notifications(read) WHERE read = FALSE;

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_pipeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_notifications ENABLE ROW LEVEL SECURITY;

-- Admin users can read all admin data
CREATE POLICY admin_users_read ON admin_users
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.user_id = auth.uid() AND au.is_active = TRUE
    )
  );

-- Similar policies for other tables (admin access)
CREATE POLICY client_pipeline_admin ON client_pipeline
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.user_id = auth.uid() AND au.is_active = TRUE
    )
  );

CREATE POLICY quotes_admin ON quotes
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.user_id = auth.uid() AND au.is_active = TRUE
    )
  );

CREATE POLICY orders_admin ON orders
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.user_id = auth.uid() AND au.is_active = TRUE
    )
  );

CREATE POLICY order_items_admin ON order_items
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.user_id = auth.uid() AND au.is_active = TRUE
    )
  );

CREATE POLICY deliveries_admin ON deliveries
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.user_id = auth.uid() AND au.is_active = TRUE
    )
  );

CREATE POLICY client_notes_admin ON client_notes
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.user_id = auth.uid() AND au.is_active = TRUE
    )
  );

CREATE POLICY team_notifications_owner ON team_notifications
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.user_id = auth.uid() AND au.id = team_notifications.user_id
    )
  );

