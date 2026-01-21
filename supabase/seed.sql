SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- \restrict hhuj46vI8wad3MflKv2Y4GQj1XD3xrwmzLXODLuJZ7HKYQ07lyuCClYwBXqPM1a

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."audit_log_entries" ("instance_id", "id", "payload", "created_at", "ip_address") VALUES
	('00000000-0000-0000-0000-000000000000', '20c4269a-840c-4a3d-9dfc-2a87ff0d31ec', '{"action":"user_signedup","actor_id":"cd135ae8-5fbb-439d-804b-6617c5a5daf6","actor_username":"dudzinski.investor@gmail.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}', '2026-01-11 11:35:27.606047+00', ''),
	('00000000-0000-0000-0000-000000000000', 'd90f3e19-680d-4be4-9944-bec01e9a874f', '{"action":"login","actor_id":"cd135ae8-5fbb-439d-804b-6617c5a5daf6","actor_username":"dudzinski.investor@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-01-11 11:35:27.616371+00', ''),
	('00000000-0000-0000-0000-000000000000', '42af9e1a-e51d-4162-bd07-68f7b70b1125', '{"action":"login","actor_id":"cd135ae8-5fbb-439d-804b-6617c5a5daf6","actor_username":"dudzinski.investor@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-01-11 11:35:46.209581+00', ''),
	('00000000-0000-0000-0000-000000000000', 'd866da57-24a8-4b24-9550-e30c95376aaf', '{"action":"token_refreshed","actor_id":"cd135ae8-5fbb-439d-804b-6617c5a5daf6","actor_username":"dudzinski.investor@gmail.com","actor_via_sso":false,"log_type":"token"}', '2026-01-11 12:35:03.866182+00', ''),
	('00000000-0000-0000-0000-000000000000', '70400313-dd83-49d7-80f0-ae2c936524f0', '{"action":"token_revoked","actor_id":"cd135ae8-5fbb-439d-804b-6617c5a5daf6","actor_username":"dudzinski.investor@gmail.com","actor_via_sso":false,"log_type":"token"}', '2026-01-11 12:35:03.868157+00', ''),
	('00000000-0000-0000-0000-000000000000', 'dfa2c7b7-1035-470e-a198-5e34f2370992', '{"action":"logout","actor_id":"cd135ae8-5fbb-439d-804b-6617c5a5daf6","actor_username":"dudzinski.investor@gmail.com","actor_via_sso":false,"log_type":"account"}', '2026-01-11 13:31:35.166384+00', ''),
	('00000000-0000-0000-0000-000000000000', 'c0c40696-e7f3-400e-9b8a-eba53d6904ae', '{"action":"login","actor_id":"cd135ae8-5fbb-439d-804b-6617c5a5daf6","actor_username":"dudzinski.investor@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-01-11 13:31:56.655252+00', ''),
	('00000000-0000-0000-0000-000000000000', 'ab905fd4-dc5c-4f48-ae69-5a04e930904f', '{"action":"login","actor_id":"cd135ae8-5fbb-439d-804b-6617c5a5daf6","actor_username":"dudzinski.investor@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-01-11 13:33:06.49568+00', ''),
	('00000000-0000-0000-0000-000000000000', '0038cebe-2929-4d7b-93a4-72122edcf707', '{"action":"login","actor_id":"cd135ae8-5fbb-439d-804b-6617c5a5daf6","actor_username":"dudzinski.investor@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-01-11 13:33:06.495895+00', ''),
	('00000000-0000-0000-0000-000000000000', '4458dc37-4212-436e-baef-923f8eab121f', '{"action":"login","actor_id":"cd135ae8-5fbb-439d-804b-6617c5a5daf6","actor_username":"dudzinski.investor@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-01-11 13:34:19.867279+00', ''),
	('00000000-0000-0000-0000-000000000000', '37dcb3d7-d07c-4ee5-bec8-e2f17b6a2c3d', '{"action":"login","actor_id":"cd135ae8-5fbb-439d-804b-6617c5a5daf6","actor_username":"dudzinski.investor@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-01-11 13:34:19.871994+00', ''),
	('00000000-0000-0000-0000-000000000000', 'a1391747-b66e-431d-ae27-047573e2a120', '{"action":"logout","actor_id":"cd135ae8-5fbb-439d-804b-6617c5a5daf6","actor_username":"dudzinski.investor@gmail.com","actor_via_sso":false,"log_type":"account"}', '2026-01-11 13:34:20.256626+00', ''),
	('00000000-0000-0000-0000-000000000000', '0ba386ad-c965-4084-ac97-4c94d43115af', '{"action":"login","actor_id":"cd135ae8-5fbb-439d-804b-6617c5a5daf6","actor_username":"dudzinski.investor@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-01-11 13:38:28.610846+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e65f0009-e831-4932-b7ae-92492ea4e5f3', '{"action":"login","actor_id":"cd135ae8-5fbb-439d-804b-6617c5a5daf6","actor_username":"dudzinski.investor@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-01-11 13:38:28.611135+00', ''),
	('00000000-0000-0000-0000-000000000000', '1085dad3-3006-47a9-956d-af21a9e956cb', '{"action":"logout","actor_id":"cd135ae8-5fbb-439d-804b-6617c5a5daf6","actor_username":"dudzinski.investor@gmail.com","actor_via_sso":false,"log_type":"account"}', '2026-01-11 13:38:28.956645+00', ''),
	('00000000-0000-0000-0000-000000000000', '70cee6fc-c583-4be0-a6b6-ef4c7173f859', '{"action":"login","actor_id":"cd135ae8-5fbb-439d-804b-6617c5a5daf6","actor_username":"dudzinski.investor@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-01-11 15:27:27.43829+00', ''),
	('00000000-0000-0000-0000-000000000000', '60278cb4-e0a0-417b-af83-bc9ed49c9705', '{"action":"login","actor_id":"cd135ae8-5fbb-439d-804b-6617c5a5daf6","actor_username":"dudzinski.investor@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-01-11 15:27:27.440919+00', ''),
	('00000000-0000-0000-0000-000000000000', '4b0f585b-28c5-4c03-bdc6-3080f8b41826', '{"action":"logout","actor_id":"cd135ae8-5fbb-439d-804b-6617c5a5daf6","actor_username":"dudzinski.investor@gmail.com","actor_via_sso":false,"log_type":"account"}', '2026-01-11 15:27:27.873574+00', ''),
	('00000000-0000-0000-0000-000000000000', 'cc73c223-9527-4ea2-9b61-e19e944e86c3', '{"action":"login","actor_id":"cd135ae8-5fbb-439d-804b-6617c5a5daf6","actor_username":"dudzinski.investor@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-01-11 15:28:05.031002+00', ''),
	('00000000-0000-0000-0000-000000000000', '892d8f44-09fb-4309-818a-3a0311c84fcc', '{"action":"login","actor_id":"cd135ae8-5fbb-439d-804b-6617c5a5daf6","actor_username":"dudzinski.investor@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-01-11 15:28:05.032912+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f088f1ed-0e23-4039-9560-4d3dda313603', '{"action":"logout","actor_id":"cd135ae8-5fbb-439d-804b-6617c5a5daf6","actor_username":"dudzinski.investor@gmail.com","actor_via_sso":false,"log_type":"account"}', '2026-01-11 15:28:05.444832+00', ''),
	('00000000-0000-0000-0000-000000000000', '25792a37-c75c-4ba8-9256-98b8fbe8b2bb', '{"action":"login","actor_id":"cd135ae8-5fbb-439d-804b-6617c5a5daf6","actor_username":"dudzinski.investor@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-01-11 15:28:33.366874+00', ''),
	('00000000-0000-0000-0000-000000000000', 'a2f2bc17-54b2-4065-b50e-e613e61bbb7f', '{"action":"login","actor_id":"cd135ae8-5fbb-439d-804b-6617c5a5daf6","actor_username":"dudzinski.investor@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-01-11 15:28:33.367118+00', ''),
	('00000000-0000-0000-0000-000000000000', '0a0945a6-52eb-433f-9dbd-f09a7ae53fe3', '{"action":"logout","actor_id":"cd135ae8-5fbb-439d-804b-6617c5a5daf6","actor_username":"dudzinski.investor@gmail.com","actor_via_sso":false,"log_type":"account"}', '2026-01-11 15:28:33.755144+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b22af408-da46-4748-9efd-965421095f3e', '{"action":"login","actor_id":"cd135ae8-5fbb-439d-804b-6617c5a5daf6","actor_username":"dudzinski.investor@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-01-11 15:29:22.706336+00', ''),
	('00000000-0000-0000-0000-000000000000', '08d47386-b924-42d1-993d-8ef20d4329b0', '{"action":"login","actor_id":"cd135ae8-5fbb-439d-804b-6617c5a5daf6","actor_username":"dudzinski.investor@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-01-11 15:29:22.705661+00', ''),
	('00000000-0000-0000-0000-000000000000', '07acecdc-28ba-4d46-bf05-0d904ed32e6d', '{"action":"logout","actor_id":"cd135ae8-5fbb-439d-804b-6617c5a5daf6","actor_username":"dudzinski.investor@gmail.com","actor_via_sso":false,"log_type":"account"}', '2026-01-11 15:29:23.107251+00', '');


--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") VALUES
	('00000000-0000-0000-0000-000000000000', 'cd135ae8-5fbb-439d-804b-6617c5a5daf6', 'authenticated', 'authenticated', 'dudzinski.investor@gmail.com', '$2a$10$T138e46wW9U0xYV8SkTXvOBOI2E0q4awUJeRuew4wlB5QF7IWK6Ha', '2026-01-11 11:35:27.607089+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-01-11 15:29:22.708326+00', '{"provider": "email", "providers": ["email"]}', '{"sub": "cd135ae8-5fbb-439d-804b-6617c5a5daf6", "email": "dudzinski.investor@gmail.com", "email_verified": true, "phone_verified": false}', NULL, '2026-01-11 11:35:27.591942+00', '2026-01-11 15:29:22.715854+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false);


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."identities" ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") VALUES
	('cd135ae8-5fbb-439d-804b-6617c5a5daf6', 'cd135ae8-5fbb-439d-804b-6617c5a5daf6', '{"sub": "cd135ae8-5fbb-439d-804b-6617c5a5daf6", "email": "dudzinski.investor@gmail.com", "email_verified": false, "phone_verified": false}', 'email', '2026-01-11 11:35:27.604359+00', '2026-01-11 11:35:27.604383+00', '2026-01-11 11:35:27.604383+00', '62f26320-c052-45bc-8b5a-5822a216aa3f');


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_authorizations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_client_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_consents; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: contractors; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."contractors" ("id", "user_id", "name", "address", "nip", "created_at", "updated_at", "deleted_at") VALUES
	('3c1d1621-f6d9-463e-a63f-2deb374fd189', 'cd135ae8-5fbb-439d-804b-6617c5a5daf6', 'firma BCD sp. z o.o.', 'ul Jasna 18 02-232 Warszawa', '6732283130', '2026-01-11 11:55:19.655+00', '2026-01-11 11:55:19.655+00', NULL);


--
-- Data for Name: invoices; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."invoices" ("id", "user_id", "contractor_id", "invoice_number", "issue_date", "due_date", "status", "payment_method", "currency", "notes", "seller_company_name", "seller_address", "seller_nip", "seller_bank_account", "seller_logo_url", "buyer_name", "buyer_address", "buyer_nip", "total_net", "total_vat", "total_gross", "created_at", "updated_at", "deleted_at") VALUES
	('189cc915-7234-4d80-b99c-cb12f96a1419', 'cd135ae8-5fbb-439d-804b-6617c5a5daf6', NULL, 'FV/2026/01/001', '2026-01-11', '2026-01-25', 'unpaid', 'transfer', 'PLN', NULL, 'Firma Superowo sp. z o.o.', 'ul. Wiejska 22  31-916 Kraków', '6782796593', 'PL61109010140000071219812874', 'http://127.0.0.1:54321/storage/v1/object/public/logos/cd135ae8-5fbb-439d-804b-6617c5a5daf6/logo.1768131494098.jpg', 'Firma ABC sp z o.o.', 'ul Krucza 22 00-022 Warszawa', '6782796593', 1464.00, 336.72, 1800.72, '2026-01-11 11:46:17.135693+00', '2026-01-11 11:46:17.135693+00', NULL),
	('a2b2f9f7-3ee4-4ad2-8bc7-771ad8941a24', 'cd135ae8-5fbb-439d-804b-6617c5a5daf6', '3c1d1621-f6d9-463e-a63f-2deb374fd189', 'FV/2026/01/002', '2026-01-11', '2026-01-25', 'unpaid', 'transfer', 'PLN', NULL, 'Firma Superowo sp. z o.o.', 'ul. Wiejska 22  31-916 Kraków', '6782796593', 'PL61109010140000071219812874', 'http://127.0.0.1:54321/storage/v1/object/public/logos/cd135ae8-5fbb-439d-804b-6617c5a5daf6/logo.1768131494098.jpg', 'firma BCD sp. z o.o.', 'ul Jasna 18 02-232 Warszawa', '6732283130', 902.00, 207.46, 1109.46, '2026-01-11 11:57:28.759583+00', '2026-01-11 11:57:28.759583+00', NULL);


--
-- Data for Name: invoice_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."invoice_items" ("id", "invoice_id", "position", "name", "unit", "quantity", "unit_price", "vat_rate", "created_at", "updated_at") VALUES
	('307ade4c-a9fb-4b62-a3a9-374653e97bc1', '189cc915-7234-4d80-b99c-cb12f96a1419', 1, 'test', 'szt.', 12.00, 122.00, '23', '2026-01-11 11:46:17.146175+00', '2026-01-11 11:46:17.146175+00'),
	('cf8d8916-5035-43af-a911-e7e44a0cb311', 'a2b2f9f7-3ee4-4ad2-8bc7-771ad8941a24', 1, 'test 2', 'szt.', 11.00, 82.00, '23', '2026-01-11 11:57:28.771715+00', '2026-01-11 11:57:28.771715+00');


--
-- Data for Name: user_profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."user_profiles" ("id", "company_name", "address", "nip", "bank_account", "logo_url", "invoice_number_format", "invoice_number_counter", "created_at", "updated_at") VALUES
	('cd135ae8-5fbb-439d-804b-6617c5a5daf6', 'Firma Superowo sp. z o.o.', 'ul. Wiejska 22  31-916 Kraków', '6782796593', 'PL61109010140000071219812874', 'http://127.0.0.1:54321/storage/v1/object/public/logos/cd135ae8-5fbb-439d-804b-6617c5a5daf6/logo.1768131494098.jpg', 'FV/{YYYY}/{MM}/{NNN}', 2, '2026-01-11 11:35:27.591308+00', '2026-01-11 11:57:28.78401+00');


--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

INSERT INTO "storage"."buckets" ("id", "name", "owner", "created_at", "updated_at", "public", "avif_autodetection", "file_size_limit", "allowed_mime_types", "owner_id", "type") VALUES
	('logos', 'logos', NULL, '2026-01-11 10:58:53.551048+00', '2026-01-11 10:58:53.551048+00', true, false, NULL, NULL, NULL, 'STANDARD')
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public, allowed_mime_types = EXCLUDED.allowed_mime_types, file_size_limit = EXCLUDED.file_size_limit;


--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: buckets_vectors; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: iceberg_namespaces; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: iceberg_tables; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

INSERT INTO "storage"."objects" ("id", "bucket_id", "name", "owner", "created_at", "updated_at", "last_accessed_at", "metadata", "version", "owner_id", "user_metadata", "level") VALUES
	('97d98e3a-db6b-4628-8ce0-3559584d5c20', 'logos', 'cd135ae8-5fbb-439d-804b-6617c5a5daf6/logo.1768131494098.jpg', NULL, '2026-01-11 11:38:14.213532+00', '2026-01-11 11:38:14.213532+00', '2026-01-11 11:38:14.213532+00', '{"eTag": "\"c11a464d2045959ec9ab44b969434af2\"", "size": 158740, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-01-11T11:38:14.201Z", "contentLength": 158740, "httpStatusCode": 200}', '42238b8d-9551-4c9f-a2da-45a8cfb0d8f7', NULL, '{}', 2);


--
-- Data for Name: prefixes; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

INSERT INTO "storage"."prefixes" ("bucket_id", "name", "created_at", "updated_at") VALUES
	('logos', 'cd135ae8-5fbb-439d-804b-6617c5a5daf6', '2026-01-11 11:38:14.213532+00', '2026-01-11 11:38:14.213532+00');


--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: vector_indexes; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: hooks; Type: TABLE DATA; Schema: supabase_functions; Owner: supabase_functions_admin
--



--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 18, true);


--
-- Name: hooks_id_seq; Type: SEQUENCE SET; Schema: supabase_functions; Owner: supabase_functions_admin
--




--
-- PostgreSQL database dump complete
--

-- \unrestrict hhuj46vI8wad3MflKv2Y4GQj1XD3xrwmzLXODLuJZ7HKYQ07lyuCClYwBXqPM1a

RESET ALL;
