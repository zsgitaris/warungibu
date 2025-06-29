
// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://usqyluzofhrrnzfkroes.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzcXlsdXpvZmhycm56Zmtyb2VzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4OTA3MTEsImV4cCI6MjA2NTQ2NjcxMX0.kBbnj5oyfZrrwqSRt_-Fk2gl_OVAFExU2YRTb6D7MlY";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
  }
});
