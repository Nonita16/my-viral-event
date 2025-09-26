-- Create invites table
CREATE TABLE IF NOT EXISTS invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL,
  email_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_invites_event_id ON invites(event_id);
CREATE INDEX IF NOT EXISTS idx_invites_referrer_id ON invites(referrer_id);
CREATE INDEX IF NOT EXISTS idx_invites_code ON invites(code);

-- Enable RLS (Row Level Security)
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view invites for events they created
CREATE POLICY "Users can view invites for their events" ON invites
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = invites.event_id
      AND events.user_id = auth.uid()
    )
  );

-- Policy: Users can create invites for their events
CREATE POLICY "Users can create invites for their events" ON invites
  FOR INSERT WITH CHECK (
    auth.uid() = referrer_id AND
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = invites.event_id
      AND events.user_id = auth.uid()
    )
  );

-- Policy: Users can update invites for their events
CREATE POLICY "Users can update invites for their events" ON invites
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = invites.event_id
      AND events.user_id = auth.uid()
    )
  );

-- Policy: Users can delete invites for their events
CREATE POLICY "Users can delete invites for their events" ON invites
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = invites.event_id
      AND events.user_id = auth.uid()
    )
  );