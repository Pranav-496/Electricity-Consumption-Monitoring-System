require('dotenv').config();

const env = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || '',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  ENABLE_DEMO_FALLBACK: process.env.ENABLE_DEMO_FALLBACK !== 'false',
  isSupabaseConfigured() {
    return Boolean(
      this.SUPABASE_URL && 
      this.SUPABASE_URL !== 'https://your-project-id.supabase.co' && 
      this.SUPABASE_ANON_KEY && 
      this.SUPABASE_ANON_KEY !== 'your_supabase_anon_public_key'
    );
  }
};

module.exports = env;
