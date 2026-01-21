-- ============================================
-- migration: initial_schema
-- purpose: creates the initial database schema for fakturologia mvp
-- affected tables: user_profiles, contractors, invoices, invoice_items
-- storage buckets: logos
-- author: database migration
-- date: 2024-12-31
-- ============================================

-- ============================================
-- 1. extensions
-- ============================================

-- Note: Using built-in gen_random_uuid() instead of uuid_generate_v4()
-- This is available in PostgreSQL 13+ without additional extensions

-- ============================================
-- 2. custom types (enums)
-- ============================================

-- invoice_status: represents the lifecycle state of an invoice
-- - draft: incomplete invoice, cannot generate pdf
-- - unpaid: issued invoice, awaiting payment
-- - paid: payment received
create type invoice_status as enum ('draft', 'unpaid', 'paid');

-- ============================================
-- 3. tables
-- ============================================

-- --------------------------------------------
-- 3.1 user_profiles
-- extends supabase auth.users with seller/company data
-- relationship: 1:1 with auth.users (created via trigger)
-- --------------------------------------------
create table user_profiles (
  -- primary key references auth.users - cascade delete ensures cleanup
  id uuid primary key references auth.users(id) on delete cascade,
  
  -- company/seller information (nullable for progressive profile completion)
  company_name text,
  address text,
  nip varchar(10),
  bank_account varchar(32),
  logo_url text,
  
  -- invoice numbering configuration
  -- format supports placeholders: {YYYY}, {MM}, {NNN}, etc.
  invoice_number_format varchar(100) default 'FV/{YYYY}/{NNN}',
  invoice_number_counter integer default 0,
  
  -- audit timestamps
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- add table comment for documentation
comment on table user_profiles is 'user profile extending supabase auth with seller/company data';
comment on column user_profiles.invoice_number_format is 'template for generating invoice numbers, supports {YYYY}, {MM}, {NNN} placeholders';
comment on column user_profiles.invoice_number_counter is 'auto-incrementing counter for invoice numbering';

-- --------------------------------------------
-- 3.2 contractors
-- stores buyer/client information per user
-- supports soft delete for data retention compliance
-- --------------------------------------------
create table contractors (
  id uuid primary key default gen_random_uuid(),
  
  -- owner relationship - cascade delete when user is removed
  user_id uuid not null references auth.users(id) on delete cascade,
  
  -- contractor data
  name text not null,
  address text,
  nip varchar(10), -- optional for individual clients (non-business)
  
  -- audit timestamps
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  -- soft delete - vat invoices must be retained for minimum 5 years
  deleted_at timestamptz
);

comment on table contractors is 'buyers/clients belonging to a user, supports soft delete';
comment on column contractors.deleted_at is 'soft delete timestamp - null means active, set means deleted';

-- --------------------------------------------
-- 3.3 invoices
-- main invoice entity with seller/buyer snapshots
-- snapshots ensure historical accuracy (legal requirement)
-- --------------------------------------------
create table invoices (
  id uuid primary key default gen_random_uuid(),
  
  -- ownership and optional contractor reference
  user_id uuid not null references auth.users(id) on delete cascade,
  contractor_id uuid references contractors(id) on delete set null,
  
  -- invoice identification and dates
  invoice_number varchar(50) not null,
  issue_date date not null default current_date,
  due_date date not null,
  
  -- invoice status and payment details
  status invoice_status not null default 'draft',
  payment_method varchar(20) not null default 'transfer',
  currency varchar(3) not null default 'PLN',
  notes text,
  
  -- seller snapshot (copied from user_profiles at invoice creation)
  -- these fields preserve the seller data as it was when invoice was issued
  seller_company_name text not null,
  seller_address text not null,
  seller_nip varchar(10) not null,
  seller_bank_account varchar(32),
  seller_logo_url text,
  
  -- buyer snapshot (copied from contractor or entered directly)
  -- these fields preserve the buyer data as it was when invoice was issued
  buyer_name text not null,
  buyer_address text,
  buyer_nip varchar(10),
  
  -- calculated totals (stored for performance and consistency)
  -- prevents rounding differences from dynamic calculation
  total_net decimal(12,2) not null,
  total_vat decimal(12,2) not null,
  total_gross decimal(12,2) not null,
  
  -- audit timestamps
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  -- soft delete - legal requirement to retain invoices
  deleted_at timestamptz
);

comment on table invoices is 'invoice records with seller/buyer snapshots for historical accuracy';
comment on column invoices.contractor_id is 'optional reference to contractor - buyer data is always stored in snapshots';
comment on column invoices.seller_company_name is 'snapshot of seller company name at invoice creation time';
comment on column invoices.buyer_name is 'snapshot of buyer name at invoice creation time';
comment on column invoices.total_net is 'pre-calculated net total for performance';

-- --------------------------------------------
-- 3.4 invoice_items
-- line items belonging to an invoice
-- cascade deleted when parent invoice is removed
-- --------------------------------------------
create table invoice_items (
  id uuid primary key default gen_random_uuid(),
  
  -- parent invoice reference - cascade ensures cleanup
  invoice_id uuid not null references invoices(id) on delete cascade,
  
  -- item details
  position integer not null, -- display order on invoice
  name text not null,
  unit varchar(20) not null default 'szt.',
  quantity decimal(12,2) not null,
  unit_price decimal(12,2) not null,
  
  -- vat rate as varchar to support both numeric ('23','8','5','0') and 'zw' (exempt)
  vat_rate varchar(5) not null,
  
  -- audit timestamps
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table invoice_items is 'line items for invoices, cascade deleted with parent';
comment on column invoice_items.vat_rate is 'vat rate - numeric (23,8,5,0) or zw for exempt';

-- ============================================
-- 4. indexes
-- ============================================

-- --------------------------------------------
-- 4.1 contractors indexes
-- --------------------------------------------

-- primary lookup: list of contractors for a user
create index idx_contractors_user_id on contractors(user_id);

-- filter active contractors (where deleted_at is null)
create index idx_contractors_user_deleted on contractors(user_id, deleted_at);

-- unique nip per user (partial index - only for non-deleted contractors with nip)
-- prevents duplicate nip entries while allowing null nip values
create unique index idx_contractors_user_nip on contractors(user_id, nip)
  where nip is not null and deleted_at is null;

-- --------------------------------------------
-- 4.2 invoices indexes
-- --------------------------------------------

-- primary lookup: list of invoices ordered by creation date (newest first)
create index idx_invoices_user_created on invoices(user_id, created_at desc);

-- filter by status (for dashboard views: draft, unpaid, paid)
create index idx_invoices_user_status on invoices(user_id, status);

-- filter active invoices (where deleted_at is null)
create index idx_invoices_user_deleted on invoices(user_id, deleted_at);

-- unique invoice number per user (business requirement)
create unique index idx_invoices_user_number on invoices(user_id, invoice_number);

-- --------------------------------------------
-- 4.3 invoice_items indexes
-- --------------------------------------------

-- primary lookup: get all items for an invoice
create index idx_invoice_items_invoice on invoice_items(invoice_id);

-- ============================================
-- 5. functions and triggers
-- ============================================

-- --------------------------------------------
-- 5.1 auto-create user profile on registration
-- this trigger ensures every auth.users entry has a corresponding profile
-- --------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer -- runs with definer's permissions to access auth schema
set search_path = public
as $$
begin
  -- create empty profile for new user
  -- user will fill in details through the application
  insert into public.user_profiles (id)
  values (new.id);
  return new;
end;
$$;

comment on function public.handle_new_user() is 'automatically creates user_profile when new auth user is registered';

-- trigger: fires after new user registration in supabase auth
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- --------------------------------------------
-- 5.2 auto-update updated_at timestamp
-- generic function to maintain updated_at across all tables
-- --------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

comment on function public.set_updated_at() is 'automatically sets updated_at to current timestamp on row update';

-- apply updated_at trigger to all tables with updated_at column
create trigger set_updated_at_user_profiles
  before update on user_profiles
  for each row
  execute function public.set_updated_at();

create trigger set_updated_at_contractors
  before update on contractors
  for each row
  execute function public.set_updated_at();

create trigger set_updated_at_invoices
  before update on invoices
  for each row
  execute function public.set_updated_at();

create trigger set_updated_at_invoice_items
  before update on invoice_items
  for each row
  execute function public.set_updated_at();

-- ============================================
-- 6. row level security (rls)
-- all tables must have rls enabled for supabase security
-- ============================================

-- --------------------------------------------
-- 6.1 user_profiles rls
-- users can only access their own profile
-- --------------------------------------------
alter table user_profiles enable row level security;

-- select: authenticated users can only view their own profile
-- rationale: profile contains sensitive business data (nip, bank account)
create policy "user_profiles_select_own_authenticated"
  on user_profiles
  for select
  to authenticated
  using (id = auth.uid());

-- insert: authenticated users can only create their own profile
-- note: typically handled by trigger, but policy ensures security
-- rationale: prevents users from creating profiles for other users
create policy "user_profiles_insert_own_authenticated"
  on user_profiles
  for insert
  to authenticated
  with check (id = auth.uid());

-- update: authenticated users can only modify their own profile
-- rationale: users should only edit their own business data
create policy "user_profiles_update_own_authenticated"
  on user_profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- note: no delete policy - profiles are managed through auth.users cascade
-- deleting a user in auth automatically removes their profile

-- anon role: no access to user profiles
-- rationale: profile data is private and requires authentication

-- --------------------------------------------
-- 6.2 contractors rls
-- users can only access their own contractors
-- --------------------------------------------
alter table contractors enable row level security;

-- select: authenticated users can view only their own active contractors
-- rationale: contractors are private business data, soft-deleted items are hidden
create policy "contractors_select_own_authenticated"
  on contractors
  for select
  to authenticated
  using (user_id = auth.uid() and deleted_at is null);

-- insert: authenticated users can only add contractors to themselves
-- rationale: prevents creating contractors assigned to other users
create policy "contractors_insert_own_authenticated"
  on contractors
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- update: authenticated users can only modify their own contractors
-- rationale: prevents modifying other users' contractor data
create policy "contractors_update_own_authenticated"
  on contractors
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- delete: authenticated users can only delete their own contractors
-- note: application should use soft delete (set deleted_at) instead
-- rationale: allows hard delete if needed, but soft delete is preferred
create policy "contractors_delete_own_authenticated"
  on contractors
  for delete
  to authenticated
  using (user_id = auth.uid());

-- anon role: no access to contractors
-- rationale: contractor data is private business information

-- --------------------------------------------
-- 6.3 invoices rls
-- users can only access their own invoices
-- --------------------------------------------
alter table invoices enable row level security;

-- select: authenticated users can view only their own active invoices
-- rationale: invoices contain sensitive financial data, soft-deleted items are hidden
create policy "invoices_select_own_authenticated"
  on invoices
  for select
  to authenticated
  using (user_id = auth.uid() and deleted_at is null);

-- insert: authenticated users can only create invoices for themselves
-- rationale: prevents creating invoices assigned to other users
create policy "invoices_insert_own_authenticated"
  on invoices
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- update: authenticated users can only modify their own invoices
-- rationale: prevents modifying other users' financial records
create policy "invoices_update_own_authenticated"
  on invoices
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- delete: authenticated users can only delete their own invoices
-- note: application should use soft delete (set deleted_at) instead
-- legal requirement: vat invoices must be retained for 5+ years
-- rationale: allows hard delete if needed, but soft delete is mandatory for compliance
create policy "invoices_delete_own_authenticated"
  on invoices
  for delete
  to authenticated
  using (user_id = auth.uid());

-- anon role: no access to invoices
-- rationale: financial data is strictly private

-- --------------------------------------------
-- 6.4 invoice_items rls
-- access determined by parent invoice ownership
-- uses subquery to verify invoice belongs to user
-- --------------------------------------------
alter table invoice_items enable row level security;

-- select: authenticated users can view items only from their own invoices
-- rationale: invoice items inherit access control from parent invoice
create policy "invoice_items_select_own_authenticated"
  on invoice_items
  for select
  to authenticated
  using (
    invoice_id in (
      select id from invoices where user_id = auth.uid()
    )
  );

-- insert: authenticated users can add items only to their own invoices
-- rationale: prevents adding items to other users' invoices
create policy "invoice_items_insert_own_authenticated"
  on invoice_items
  for insert
  to authenticated
  with check (
    invoice_id in (
      select id from invoices where user_id = auth.uid()
    )
  );

-- update: authenticated users can modify items only in their own invoices
-- rationale: prevents modifying line items in other users' invoices
create policy "invoice_items_update_own_authenticated"
  on invoice_items
  for update
  to authenticated
  using (
    invoice_id in (
      select id from invoices where user_id = auth.uid()
    )
  )
  with check (
    invoice_id in (
      select id from invoices where user_id = auth.uid()
    )
  );

-- delete: authenticated users can remove items only from their own invoices
-- rationale: prevents deleting line items from other users' invoices
create policy "invoice_items_delete_own_authenticated"
  on invoice_items
  for delete
  to authenticated
  using (
    invoice_id in (
      select id from invoices where user_id = auth.uid()
    )
  );

-- anon role: no access to invoice items
-- rationale: financial line item data is strictly private

-- ============================================
-- 7. storage configuration
-- ============================================

-- --------------------------------------------
-- 7.1 logos bucket
-- stores company logos for user profiles
-- private bucket - access controlled by rls policies
-- file structure: {user_id}/logo.{ext}
-- --------------------------------------------

-- create the logos bucket (private by default)
insert into storage.buckets (id, name, public)
values ('logos', 'logos', false)
on conflict (id) do nothing;

-- select: users can view only their own logo files
-- folder structure enforces ownership: files stored in {user_id}/ folder
-- rationale: logos may contain proprietary business branding
create policy "logos_select_own_authenticated"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'logos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- insert: users can upload only to their own folder
-- rationale: prevents uploading files to other users' storage space
create policy "logos_insert_own_authenticated"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'logos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- update: users can replace only their own logo files
-- rationale: allows logo updates while maintaining ownership
create policy "logos_update_own_authenticated"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'logos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- delete: users can remove only their own logo files
-- rationale: allows cleanup of old logos, maintains ownership
create policy "logos_delete_own_authenticated"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'logos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- anon role: no access to logo storage
-- rationale: logo files are private business assets

-- ============================================
-- end of migration
-- ============================================
