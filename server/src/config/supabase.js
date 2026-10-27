const { createClient } = require('@supabase/supabase-js');
const env = require('./env');

let supabase = null;
let supabaseAdmin = null;

if (env.isSupabaseConfigured()) {
  try {
    supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
    
    // Service role client bypasses RLS for administrative server actions
    if (env.SUPABASE_SERVICE_ROLE_KEY && env.SUPABASE_SERVICE_ROLE_KEY !== 'your_server_only_service_role_key') {
      supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
    } else {
      supabaseAdmin = supabase;
    }
    console.log('[Database] Supabase client initialized with endpoint:', env.SUPABASE_URL);
  } catch (err) {
    console.warn('[Database] Failed to initialize live Supabase client:', err.message);
  }
} else {
  console.log('[Database] Supabase URL/Key not configured or using placeholders. Standalone Demonstration Mode is active.');
}

module.exports = {
  supabase,
  supabaseAdmin,
  isLiveSupabase: env.isSupabaseConfigured()
};
