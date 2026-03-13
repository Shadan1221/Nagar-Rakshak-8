-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  complaint_id UUID REFERENCES complaints(id) ON DELETE CASCADE,
  complaint_code TEXT NOT NULL,
  stage TEXT NOT NULL CHECK (stage IN ('confirmation', 'acknowledgement', 'resolution')),
  message TEXT NOT NULL,
  user_id TEXT DEFAULT 'anonymous',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_complaint_id ON notifications(complaint_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policy for anonymous users to read their notifications
CREATE POLICY "Allow anonymous users to read notifications" ON notifications
  FOR SELECT USING (user_id = 'anonymous');

-- Create policy for anonymous users to update their notifications
CREATE POLICY "Allow anonymous users to update notifications" ON notifications
  FOR UPDATE USING (user_id = 'anonymous');

-- Create policy for anonymous users to insert notifications
CREATE POLICY "Allow anonymous users to insert notifications" ON notifications
  FOR INSERT WITH CHECK (user_id = 'anonymous');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_notifications_updated_at 
  BEFORE UPDATE ON notifications 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

