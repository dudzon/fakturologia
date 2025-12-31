// Production environment - values should be injected at build time
// Set SUPABASE_URL and SUPABASE_KEY environment variables during deployment
export const environment = {
  production: true,
  supabaseUrl: '${SUPABASE_URL}',
  supabaseKey: '${SUPABASE_KEY}',
};
