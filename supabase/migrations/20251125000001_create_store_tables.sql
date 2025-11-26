-- Migration: Create store tables for digital music sales
-- Created: 2025-11-25
-- Purpose: Enable artists to sell music via Shopify integration

-- ============================================
-- TABLE: store_products
-- Maps KracRadio tracks to Shopify products
-- ============================================
CREATE TABLE IF NOT EXISTS store_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  track_title TEXT NOT NULL,
  track_file_url TEXT,
  artist_name TEXT NOT NULL,
  shopify_product_id TEXT,
  shopify_variant_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'disabled', 'live')),
  price DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'CAD',
  commission_artist_percent INTEGER DEFAULT 85,
  commission_platform_percent INTEGER DEFAULT 15,
  product_type TEXT DEFAULT 'single' CHECK (product_type IN ('single', 'ep', 'album')),
  cover_image_url TEXT,
  preview_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_store_products_user_id ON store_products(user_id);
CREATE INDEX IF NOT EXISTS idx_store_products_status ON store_products(status);
CREATE INDEX IF NOT EXISTS idx_store_products_shopify_id ON store_products(shopify_product_id);

-- ============================================
-- TABLE: store_submissions
-- Tracks artist requests to sell music
-- ============================================
CREATE TABLE IF NOT EXISTS store_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  store_product_id UUID REFERENCES store_products(id) ON DELETE SET NULL,
  submission_type TEXT DEFAULT 'new_product' CHECK (submission_type IN ('new_product', 'update', 'remove')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),

  -- Track info (for new submissions)
  track_title TEXT NOT NULL,
  artist_name TEXT NOT NULL,
  requested_price DECIMAL(10, 2) NOT NULL,
  product_type TEXT DEFAULT 'single' CHECK (product_type IN ('single', 'ep', 'album')),

  -- Files
  audio_file_url TEXT,
  cover_image_url TEXT,

  -- Artist confirmation
  rights_confirmed BOOLEAN DEFAULT FALSE,
  artist_message TEXT,

  -- Admin response
  admin_comment TEXT,
  reviewed_by UUID REFERENCES auth.users(id),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_store_submissions_user_id ON store_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_store_submissions_status ON store_submissions(status);
CREATE INDEX IF NOT EXISTS idx_store_submissions_created_at ON store_submissions(created_at DESC);

-- ============================================
-- TABLE: store_sales
-- Records from Shopify webhooks
-- ============================================
CREATE TABLE IF NOT EXISTS store_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shopify_order_id TEXT NOT NULL,
  shopify_line_item_id TEXT,
  shopify_product_id TEXT NOT NULL,
  store_product_id UUID REFERENCES store_products(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Sale details
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'CAD',

  -- Revenue split
  revenue_gross DECIMAL(10, 2) NOT NULL,
  revenue_artist DECIMAL(10, 2) NOT NULL,
  revenue_platform DECIMAL(10, 2) NOT NULL,

  -- Customer info (anonymized)
  customer_country TEXT,

  -- Timestamps
  order_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Prevent duplicate entries
  UNIQUE(shopify_order_id, shopify_line_item_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_store_sales_user_id ON store_sales(user_id);
CREATE INDEX IF NOT EXISTS idx_store_sales_store_product_id ON store_sales(store_product_id);
CREATE INDEX IF NOT EXISTS idx_store_sales_shopify_order_id ON store_sales(shopify_order_id);
CREATE INDEX IF NOT EXISTS idx_store_sales_order_date ON store_sales(order_date DESC);

-- ============================================
-- TABLE: artist_payouts (for future use)
-- Tracks payments to artists
-- ============================================
CREATE TABLE IF NOT EXISTS artist_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Amounts
  gross_amount DECIMAL(10, 2) NOT NULL,
  net_amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'CAD',

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'paid', 'failed')),

  -- Payment details
  payment_method TEXT,
  payment_reference TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid_at TIMESTAMP WITH TIME ZONE,

  -- Notes
  notes TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_artist_payouts_user_id ON artist_payouts(user_id);
CREATE INDEX IF NOT EXISTS idx_artist_payouts_status ON artist_payouts(status);

-- ============================================
-- RLS POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE store_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE artist_payouts ENABLE ROW LEVEL SECURITY;

-- store_products policies
DROP POLICY IF EXISTS "Users can view their own products" ON store_products;
CREATE POLICY "Users can view their own products"
ON store_products FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own products" ON store_products;
CREATE POLICY "Users can insert their own products"
ON store_products FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own products" ON store_products;
CREATE POLICY "Users can update their own products"
ON store_products FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all products" ON store_products;
CREATE POLICY "Admins can view all products"
ON store_products FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

DROP POLICY IF EXISTS "Admins can update all products" ON store_products;
CREATE POLICY "Admins can update all products"
ON store_products FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- store_submissions policies
DROP POLICY IF EXISTS "Users can view their own submissions" ON store_submissions;
CREATE POLICY "Users can view their own submissions"
ON store_submissions FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own submissions" ON store_submissions;
CREATE POLICY "Users can insert their own submissions"
ON store_submissions FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all submissions" ON store_submissions;
CREATE POLICY "Admins can view all submissions"
ON store_submissions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

DROP POLICY IF EXISTS "Admins can update all submissions" ON store_submissions;
CREATE POLICY "Admins can update all submissions"
ON store_submissions FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- store_sales policies
DROP POLICY IF EXISTS "Users can view their own sales" ON store_sales;
CREATE POLICY "Users can view their own sales"
ON store_sales FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all sales" ON store_sales;
CREATE POLICY "Admins can view all sales"
ON store_sales FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

DROP POLICY IF EXISTS "Admins can insert sales" ON store_sales;
CREATE POLICY "Admins can insert sales"
ON store_sales FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Service role can insert sales (for webhooks)
DROP POLICY IF EXISTS "Service role can insert sales" ON store_sales;
CREATE POLICY "Service role can insert sales"
ON store_sales FOR INSERT
TO service_role
WITH CHECK (true);

-- artist_payouts policies
DROP POLICY IF EXISTS "Users can view their own payouts" ON artist_payouts;
CREATE POLICY "Users can view their own payouts"
ON artist_payouts FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage all payouts" ON artist_payouts;
CREATE POLICY "Admins can manage all payouts"
ON artist_payouts FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_store_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for store_products
DROP TRIGGER IF EXISTS trigger_update_store_products_updated_at ON store_products;
CREATE TRIGGER trigger_update_store_products_updated_at
BEFORE UPDATE ON store_products
FOR EACH ROW
EXECUTE FUNCTION update_store_products_updated_at();
