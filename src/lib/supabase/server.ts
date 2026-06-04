import { createClient } from '@supabase/supabase-js';
import { env } from '@/lib/server/env';

export const supabaseAdmin = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
  env.SUPABASE_SERVICE_ROLE_KEY || 'local-service-role-placeholder',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);
