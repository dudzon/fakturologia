/**
 * Centralna konfiguracja aplikacji
 *
 * Funkcja ta jest wywoływana przez ConfigModule.forRoot()
 * i zwraca obiekt konfiguracji zbudowany ze zmiennych środowiskowych.
 *
 * @returns Obiekt konfiguracji aplikacji
 */
export default () => ({
  // Konfiguracja serwera
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // Konfiguracja Supabase
  supabase: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    jwtSecret: process.env.SUPABASE_JWT_SECRET,
  },

  // Konfiguracja CORS
  cors: {
    origins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:4200'],
  },

  // Konfiguracja uploadu plików
  upload: {
    maxLogoSizeBytes: 2 * 1024 * 1024, // 2MB
    allowedMimeTypes: ['image/png', 'image/jpeg'],
  },
});
