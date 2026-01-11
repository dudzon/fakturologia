-- Create E2E Test User
-- Run this script in the Supabase Dashboard SQL Editor to create the user required for E2E tests.

-- 1. Create the user in auth.users
INSERT INTO "auth"."users" (
    "instance_id",
    "id",
    "aud",
    "role",
    "email",
    "encrypted_password",
    "email_confirmed_at",
    "raw_app_meta_data",
    "raw_user_meta_data",
    "created_at",
    "updated_at",
    "confirmation_token",
    "recovery_token",
    "email_change_token_new",
    "email_change"
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    'cd135ae8-5fbb-439d-804b-6617c5a5daf6',
    'authenticated',
    'authenticated',
    'dudzinski.investor@gmail.com', -- MUST MATCH YOUR E2E_USERNAME SECRET
    '$2a$10$T138e46wW9U0xYV8SkTXvOBOI2E0q4awUJeRuew4wlB5QF7IWK6Ha', -- This hash matches the test password. If using a different password, update this hash or change via dashboard.
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"sub": "cd135ae8-5fbb-439d-804b-6617c5a5daf6", "email": "dudzinski.investor@gmail.com", "email_verified": true, "phone_verified": false}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
) ON CONFLICT (id) DO NOTHING;

-- 2. Create identity (optional but recommended)
INSERT INTO "auth"."identities" (
    "id",
    "user_id",
    "identity_data",
    "provider",
    "provider_id",
    "last_sign_in_at",
    "created_at",
    "updated_at"
) VALUES (
    '62f26320-c052-45bc-8b5a-5822a216aa3f',
    'cd135ae8-5fbb-439d-804b-6617c5a5daf6',
    '{"sub": "cd135ae8-5fbb-439d-804b-6617c5a5daf6", "email": "dudzinski.investor@gmail.com", "email_verified": false, "phone_verified": false}',
    'email',
    'cd135ae8-5fbb-439d-804b-6617c5a5daf6',
    NOW(),
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- 3. Create user profile (Application specific)
INSERT INTO "public"."user_profiles" (
    "id",
    "company_name",
    "address",
    "nip",
    "bank_account",
    "invoice_number_format",
    "invoice_number_counter"
) VALUES (
    'cd135ae8-5fbb-439d-804b-6617c5a5daf6',
    'Firma Testowa E2E',
    'Testowa 1, 00-001 Warszawa',
    '1234567890',
    'PL00000000000000000000000000',
    'FV/{YYYY}/{MM}/{NNN}',
    0
) ON CONFLICT (id) DO NOTHING;
