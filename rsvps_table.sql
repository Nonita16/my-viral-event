-- Create rsvps table
CREATE TABLE IF NOT EXISTS rsvps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, user_id) -- Prevent duplicate RSVPs
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_rsvps_event_id ON rsvps(event_id);
CREATE INDEX IF NOT EXISTS idx_rsvps_user_id ON rsvps(user_id);

-- Enable RLS (Row Level Security)
ALTER TABLE rsvps ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view RSVPs for events they created
CREATE POLICY "Users can view RSVPs for their events" ON rsvps
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = rsvps.event_id
      AND events.user_id = auth.uid()
    )
  );

-- Policy: Users can RSVP to any event
CREATE POLICY "Users can RSVP to events" ON rsvps
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only delete their own RSVPs
CREATE POLICY "Users can delete their own RSVPs" ON rsvps
  FOR DELETE USING (auth.uid() = user_id);