/**
 * Ensure Supabase E2E test user exists before running Playwright.
 *
 * Uses the service role key (server-side only) to:
 * 1) Create the test auth user if missing
 * 2) Seed a minimal user_profiles row for the app UI
 *
 * Required env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, E2E_USERNAME, E2E_PASSWORD
 */
const { createClient } = require('@supabase/supabase-js');

const requiredEnv = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'E2E_USERNAME', 'E2E_PASSWORD'];
const missing = requiredEnv.filter((key) => !process.env[key]);

if (missing.length) {
  console.warn(`[ensure-e2e-user] Missing env vars: ${missing.join(', ')}. Skipping user bootstrap.`);
  process.exit(0);
}

const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function ensureUser() {
  const email = process.env.E2E_USERNAME;
  const password = process.env.E2E_PASSWORD;

  // Try to fetch existing user
  const existingId = await findUserIdByEmail(email);

  const userId =
    existingId ||
    (await createUser(email, password)) ||
    (() => {
      throw new Error('[ensure-e2e-user] Unable to create or read E2E user');
    })();

  // Reset password to ensure tests use the expected credentials
  await ensurePassword(userId, password);
  await ensureProfile(userId, email);
  console.log('[ensure-e2e-user] E2E user ready:', userId);
}

async function findUserIdByEmail(email) {
  const result = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });

  if (result.error) {
    console.warn('[ensure-e2e-user] Error listing users, will attempt creation next:', result.error.message);
    return null;
  }

  return result.data?.users?.find((user) => user.email?.toLowerCase() === email.toLowerCase())?.id || null;
}

async function createUser(email, password) {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { e2e: true },
    user_metadata: { e2e: true },
  });

  if (error) {
    // If user already exists, return null and let caller retry fetch
    if (error.message?.toLowerCase().includes('already registered')) {
      console.log('[ensure-e2e-user] User already exists, will fetch id next');
      return findUserIdByEmail(email);
    }
    throw error;
  }

  return data.user?.id || null;
}

async function ensurePassword(userId, password) {
  const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    password,
  });

  if (error) {
    throw error;
  }
}

async function ensureProfile(userId, email) {
  const profile = {
    id: userId,
    company_name: 'E2E Test Company',
    address: 'E2E Street 1, 00-000 Test City',
    nip: '0000000000',
    bank_account: 'PL61109010140000071219812874',
    logo_url: null,
    invoice_number_format: 'E2E/{YYYY}/{MM}/{NNN}',
    invoice_number_counter: 1,
  };

  const { error } = await supabaseAdmin.from('user_profiles').upsert(profile, { onConflict: 'id' });
  if (error) {
    throw error;
  }

  console.log('[ensure-e2e-user] Profile ensured for', email);
}

ensureUser().catch((err) => {
  console.error('[ensure-e2e-user] Failed to bootstrap user:', err);
  process.exit(1);
});
