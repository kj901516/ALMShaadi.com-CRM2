/*
# ALMShaadi.com Marriage Bureau CRM — Core Schema

## Purpose
Single-tenant CRM for a marriage bureau. Stores profile biodata and bureau settings.
Profile photos are stored in Supabase Storage (bucket: profile-photos) and referenced by path.

## 1. New Tables

### `profiles`
Holds all marriage-candidate profiles. Mirrors the existing in-app Profile type.
- `id` (text, primary key) — human-readable business ID like "MB0001"
- `created_at`, `updated_at` (timestamptz)
- Personal: full_name, gender, age, height, marital_status, disability_status
- Education: education, college_university
- Occupation: profession, monthly_income
- Contact: whatsapp_number
- Religion: sect_maslak, caste, sub_caste, local_muhajir
- Residence: residence_type, house_size, city, village, nationality, address, property_details
- Family: father_occupation, mother_occupation, brothers, married_brothers, sisters, married_sisters
- Partner prefs: pref_age_from, pref_age_to, pref_height_from, pref_height_to, pref_city, pref_caste, pref_education (text[]), pref_profession (text[]), pref_disability_status
- `photos` (jsonb) — array of {id, path, name, addedAt}; actual image bytes live in Storage
- `entered_by` (text)

### `settings`
Single-row table (key='app') storing bureau settings as jsonb.

## 2. Storage
- Bucket `profile-photos` created for profile photo uploads.

## 3. Security (RLS)
- Single-tenant app (no sign-in). All policies `TO anon, authenticated` with `USING (true)` / `WITH CHECK (true)` — the data is intentionally shared/public.
- Storage bucket is public for read, authenticated/anon for write.

## 4. Indexes
- profiles(full_name), profiles(city), profiles(caste), profiles(created_at)
*/

-- PROFILES TABLE
CREATE TABLE IF NOT EXISTS profiles (
  id text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  full_name text NOT NULL DEFAULT '',
  gender text NOT NULL DEFAULT '',
  age integer,
  height text NOT NULL DEFAULT '',
  marital_status text NOT NULL DEFAULT '',
  disability_status text NOT NULL DEFAULT '',

  education text NOT NULL DEFAULT '',
  college_university text NOT NULL DEFAULT '',

  profession text NOT NULL DEFAULT '',
  monthly_income text NOT NULL DEFAULT '',
  whatsapp_number text NOT NULL DEFAULT '',

  sect_maslak text NOT NULL DEFAULT '',
  caste text NOT NULL DEFAULT '',
  sub_caste text NOT NULL DEFAULT '',
  local_muhajir text NOT NULL DEFAULT '',

  residence_type text NOT NULL DEFAULT '',
  house_size text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  village text NOT NULL DEFAULT '',
  nationality text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  property_details text NOT NULL DEFAULT '',

  father_occupation text NOT NULL DEFAULT '',
  mother_occupation text NOT NULL DEFAULT '',
  brothers integer,
  married_brothers integer,
  sisters integer,
  married_sisters integer,

  pref_age_from integer,
  pref_age_to integer,
  pref_height_from text NOT NULL DEFAULT '',
  pref_height_to text NOT NULL DEFAULT '',
  pref_city text NOT NULL DEFAULT '',
  pref_caste text NOT NULL DEFAULT '',
  pref_education text[] NOT NULL DEFAULT '{}',
  pref_profession text[] NOT NULL DEFAULT '{}',
  pref_disability_status text NOT NULL DEFAULT '',

  photos jsonb NOT NULL DEFAULT '[]'::jsonb,
  entered_by text NOT NULL DEFAULT ''
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_profiles" ON profiles;
CREATE POLICY "anon_select_profiles" ON profiles FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_profiles" ON profiles;
CREATE POLICY "anon_insert_profiles" ON profiles FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_profiles" ON profiles;
CREATE POLICY "anon_update_profiles" ON profiles FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_profiles" ON profiles;
CREATE POLICY "anon_delete_profiles" ON profiles FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_profiles_full_name ON profiles (full_name);
CREATE INDEX IF NOT EXISTS idx_profiles_city ON profiles (city);
CREATE INDEX IF NOT EXISTS idx_profiles_caste ON profiles (caste);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles (created_at DESC);

-- SETTINGS TABLE (single-row, key='app')
CREATE TABLE IF NOT EXISTS settings (
  key text PRIMARY KEY DEFAULT 'app',
  value jsonb NOT NULL DEFAULT '{}'::jsonb
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_settings" ON settings;
CREATE POLICY "anon_select_settings" ON settings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_settings" ON settings;
CREATE POLICY "anon_insert_settings" ON settings FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_settings" ON settings;
CREATE POLICY "anon_update_settings" ON settings FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_settings" ON settings;
CREATE POLICY "anon_delete_settings" ON settings FOR DELETE
  TO anon, authenticated USING (true);

-- PROFILE ID SEQUENCE (stored in a meta table)
CREATE TABLE IF NOT EXISTS meta (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb
);

ALTER TABLE meta ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_meta" ON meta;
CREATE POLICY "anon_select_meta" ON meta FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_meta" ON meta;
CREATE POLICY "anon_insert_meta" ON meta FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_meta" ON meta;
CREATE POLICY "anon_update_meta" ON meta FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_meta" ON meta;
CREATE POLICY "anon_delete_meta" ON meta FOR DELETE
  TO anon, authenticated USING (true);

-- STORAGE BUCKET for profile photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-photos', 'profile-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: public read, anon+authenticated write
DROP POLICY IF EXISTS "anon_read_photos" ON storage.objects;
CREATE POLICY "anon_read_photos" ON storage.objects FOR SELECT
  TO anon, authenticated USING (bucket_id = 'profile-photos');

DROP POLICY IF EXISTS "anon_insert_photos" ON storage.objects;
CREATE POLICY "anon_insert_photos" ON storage.objects FOR INSERT
  TO anon, authenticated WITH CHECK (bucket_id = 'profile-photos');

DROP POLICY IF EXISTS "anon_update_photos" ON storage.objects;
CREATE POLICY "anon_update_photos" ON storage.objects FOR UPDATE
  TO anon, authenticated USING (bucket_id = 'profile-photos') WITH CHECK (bucket_id = 'profile-photos');

DROP POLICY IF EXISTS "anon_delete_photos" ON storage.objects;
CREATE POLICY "anon_delete_photos" ON storage.objects FOR DELETE
  TO anon, authenticated USING (bucket_id = 'profile-photos');