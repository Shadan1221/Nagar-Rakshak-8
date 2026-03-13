-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  complaint_id UUID NOT NULL,
  complaint_code TEXT NOT NULL,
  stage TEXT NOT NULL CHECK (stage IN ('confirmation', 'acknowledgement', 'resolution')),
  message TEXT NOT NULL,
  user_id TEXT NOT NULL DEFAULT 'anonymous',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_complaint_id ON notifications(complaint_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policy for anonymous users (for demo purposes)
CREATE POLICY "Allow anonymous read access" ON notifications
  FOR SELECT USING (true);

CREATE POLICY "Allow anonymous insert access" ON notifications
  FOR INSERT WITH CHECK (true);
