// supabase/functions/_shared/cors.ts

// This file defines the Cross-Origin Resource Sharing (CORS) headers.
// It allows your web app (running on a different domain) to securely call this Edge Function.

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

