-- Create user referral codes table
CREATE TABLE IF NOT EXISTS user_referral_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id) -- Each user can only have one referral code
);

-- Create referrals table (tracks actions attributed to referral codes)
CREATE TABLE IF NOT EXISTS referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referral_code TEXT NOT NULL, -- References user_referral_codes.referral_code
  action_type TEXT NOT NULL CHECK (action_type IN ('click', 'signup', 'rsvp')),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE, -- Optional: which event the action was for
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id), -- The user who performed the action
  session_id TEXT -- For session tracking
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_referrals_referral_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_action_type ON referrals(action_type);
CREATE INDEX IF NOT EXISTS idx_referrals_event_id ON referrals(event_id);
CREATE INDEX IF NOT EXISTS idx_referrals_timestamp ON referrals(timestamp);

-- Enable RLS (Row Level Security)
ALTER TABLE user_referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own referral code
CREATE POLICY "Users can view their own referral code" ON user_referral_codes
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can create their own referral code
CREATE POLICY "Users can create their own referral code" ON user_referral_codes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view referrals for their referral code
CREATE POLICY "Users can view referrals for their code" ON referrals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_referral_codes
      WHERE user_referral_codes.referral_code = referrals.referral_code
      AND user_referral_codes.user_id = auth.uid()
    )
  );

-- Policy: Allow inserts for tracking actions
CREATE POLICY "Allow inserts for referral tracking" ON referrals
  FOR INSERT WITH CHECK (true);