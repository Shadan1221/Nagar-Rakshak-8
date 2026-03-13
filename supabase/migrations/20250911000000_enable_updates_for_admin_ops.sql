-- Allow public (anon, authenticated) to update complaints and insert complaint status updates
-- This is required for the manual worker assignment flow in the Admin UI.

-- Complaints: allow UPDATE
DO $$ BEGIN
  CREATE POLICY "Public can update complaints"
  ON public.complaints
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Complaint status updates: allow INSERT
DO $$ BEGIN
  CREATE POLICY "Public can insert complaint status updates"
  ON public.complaint_status_updates
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


