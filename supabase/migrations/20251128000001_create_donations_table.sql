-- Create donations table for tracking donation campaigns
-- Table: donations
CREATE TABLE IF NOT EXISTS public.donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  donor_name TEXT, -- NULL = anonymous
  donor_email TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- optional link to user account
  campaign_id TEXT DEFAULT 'default', -- for multiple campaigns
  payment_provider TEXT DEFAULT 'paypal', -- paypal, stripe, etc.
  payment_id TEXT, -- external payment reference
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'refunded', 'failed')),
  message TEXT, -- optional message from donor
  is_anonymous BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create donation_campaigns table for managing multiple campaigns
CREATE TABLE IF NOT EXISTS public.donation_campaigns (
  id TEXT PRIMARY KEY, -- e.g., 'default', 'equipment-2024', etc.
  title_fr TEXT NOT NULL,
  title_en TEXT,
  title_es TEXT,
  description_fr TEXT,
  description_en TEXT,
  description_es TEXT,
  goal DECIMAL(10, 2) NOT NULL DEFAULT 5000,
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default campaign
INSERT INTO public.donation_campaigns (id, title_fr, title_en, title_es, description_fr, description_en, description_es, goal)
VALUES (
  'default',
  'Fonctionnement de la station',
  'Station Operations',
  'Operaciones de la estación',
  'Aidez-nous à maintenir et améliorer votre station de radio indépendante préférée.',
  'Help us maintain and improve your favorite independent radio station.',
  'Ayúdanos a mantener y mejorar tu estación de radio independiente favorita.',
  5000
) ON CONFLICT (id) DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_donations_campaign_id ON public.donations(campaign_id);
CREATE INDEX IF NOT EXISTS idx_donations_created_at ON public.donations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_donations_status ON public.donations(status);
CREATE INDEX IF NOT EXISTS idx_donations_user_id ON public.donations(user_id);

-- Enable RLS
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donation_campaigns ENABLE ROW LEVEL SECURITY;

-- RLS Policies for donations
-- Anyone can view completed donations (for leaderboard/recent donors)
CREATE POLICY "Anyone can view completed donations"
  ON public.donations
  FOR SELECT
  USING (status = 'completed');

-- Users can view their own donations
CREATE POLICY "Users can view own donations"
  ON public.donations
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admin can manage all donations
CREATE POLICY "Admin can manage donations"
  ON public.donations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Service role can insert donations (for webhook processing)
CREATE POLICY "Service role can insert donations"
  ON public.donations
  FOR INSERT
  WITH CHECK (true);

-- RLS Policies for campaigns
-- Anyone can view active campaigns
CREATE POLICY "Anyone can view active campaigns"
  ON public.donation_campaigns
  FOR SELECT
  USING (is_active = true);

-- Admin can manage campaigns
CREATE POLICY "Admin can manage campaigns"
  ON public.donation_campaigns
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create function to get campaign stats
CREATE OR REPLACE FUNCTION public.get_campaign_stats(p_campaign_id TEXT DEFAULT 'default')
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'campaign_id', p_campaign_id,
    'total_raised', COALESCE(SUM(d.amount), 0),
    'donor_count', COUNT(DISTINCT COALESCE(d.user_id::text, d.donor_email, d.id::text)),
    'donation_count', COUNT(*),
    'goal', c.goal,
    'percentage', CASE
      WHEN c.goal > 0 THEN ROUND((COALESCE(SUM(d.amount), 0) / c.goal * 100)::numeric, 1)
      ELSE 0
    END,
    'recent_donors', (
      SELECT json_agg(recent)
      FROM (
        SELECT
          CASE WHEN is_anonymous THEN NULL ELSE donor_name END as donor_name,
          amount,
          created_at
        FROM public.donations
        WHERE campaign_id = p_campaign_id AND status = 'completed'
        ORDER BY created_at DESC
        LIMIT 5
      ) recent
    )
  ) INTO result
  FROM public.donation_campaigns c
  LEFT JOIN public.donations d ON d.campaign_id = c.id AND d.status = 'completed'
  WHERE c.id = p_campaign_id
  GROUP BY c.id, c.goal;

  RETURN result;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_campaign_stats(TEXT) TO anon, authenticated;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.update_donations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER donations_updated_at
  BEFORE UPDATE ON public.donations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_donations_updated_at();

CREATE TRIGGER donation_campaigns_updated_at
  BEFORE UPDATE ON public.donation_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_donations_updated_at();
