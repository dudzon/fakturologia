/**
 * Central application configuration
 *
 * This function is called by ConfigModule.forRoot()
 * and returns configuration object built from environment variables.
 *
 * @returns Application configuration object
 */
export default () => ({
  // Server configuration
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // Supabase configuration
  supabase: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    jwtSecret: process.env.SUPABASE_JWT_SECRET,
  },

  // CORS configuration
  cors: {
    origins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:4200'],
  },

  // File upload configuration
  upload: {
    maxLogoSizeBytes: 2 * 1024 * 1024, // 2MB
    allowedMimeTypes: ['image/png', 'image/jpeg'],
  },
});
