-- Create referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invite_id UUID NOT NULL REFERENCES invites(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('click', 'signup', 'rsvp')),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id), -- Optional, for tracking which user performed the action
  session_id TEXT -- Optional, for session tracking
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_referrals_invite_id ON referrals(invite_id);
CREATE INDEX IF NOT EXISTS idx_referrals_action_type ON referrals(action_type);
CREATE INDEX IF NOT EXISTS idx_referrals_timestamp ON referrals(timestamp);

-- Enable RLS (Row Level Security)
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see referrals for invites they created
CREATE POLICY "Users can view referrals for their invites" ON referrals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM invites
      WHERE invites.id = referrals.invite_id
      AND invites.referrer_id = auth.uid()
    )
  );

-- Policy: Allow inserts for tracking actions (we'll handle validation in code)
CREATE POLICY "Allow inserts for referral tracking" ON referrals
  FOR INSERT WITH CHECK (true);