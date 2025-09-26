-- Create discovered_events table to track events users found via invites
CREATE TABLE IF NOT EXISTS discovered_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  discovered_via_invite_id UUID REFERENCES invites(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, event_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_discovered_events_user_id ON discovered_events(user_id);
CREATE INDEX IF NOT EXISTS idx_discovered_events_event_id ON discovered_events(event_id);

-- Enable RLS (Row Level Security)
ALTER TABLE discovered_events ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own discovered events
CREATE POLICY "Users can view their discovered events" ON discovered_events
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can add discovered events
CREATE POLICY "Users can add discovered events" ON discovered_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can remove discovered events
CREATE POLICY "Users can remove discovered events" ON discovered_events
  FOR DELETE USING (auth.uid() = user_id);