// Development environment example - copy to environment.ts and fill in values
// For local development with Supabase, run: supabase status -o env
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000',
  supabaseUrl: 'http://127.0.0.1:54321', // Get from: supabase status
  supabaseKey: 'your-anon-key-here', // Get from: supabase status -o env (ANON_KEY)
};
