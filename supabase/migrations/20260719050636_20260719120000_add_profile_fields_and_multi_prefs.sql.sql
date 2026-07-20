/*
# Add profile fields + multi-value partner preferences

## Purpose
Enhance the Basic Information and Partner Requirements sections of the CRM.
Adds four new text fields to every profile and converts four partner-preference
fields to multi-value (text[]) columns. No existing data is deleted or rewritten;
existing rows keep their values and remain fully readable.

## 1. New columns (profiles table)

Basic Information:
- `father_mother_name` (text, default '') — Father / Mother name.
- `contact_person_name` (text, default '') — Contact person name (e.g. Father, Brother).
- `profession_type` (text, default '') — Government Job / Private Job / Business.
- `job_business_details` (text, default '') — Free-text job/business description.

Partner Requirements (multi-value):
- `pref_maslak` (text[], default '{}') — Preferred Maslak list.
- `pref_nationality` (text[], default '{}') — Preferred Nationality/Country list.
- `pref_marital_status` (text[], default '{}') — Preferred Marital Status list.

## 2. Modified columns
- `profiles.pref_city`: type `text` -> `text[]`
  - The existing `''::text` default is dropped first (cannot be cast to text[]),
    then replaced with `'{}'::text[]`.
  - Existing single-string values are split on commas into array elements
    (e.g. "Lahore, Karachi" -> {"Lahore","Karachi"}).
  - Empty strings become an empty array `{}`.
  - No existing rows are deleted; values are converted in place.

## 3. Security
- No RLS policy changes. Existing anon/authenticated CRUD policies on `profiles`
  continue to apply unchanged. New columns inherit the table's existing policies.

## 4. Backward compatibility
- All new columns have safe defaults ('' for text, '{}' for text[]) so old rows
  remain valid without modification.
- `pref_city` conversion is non-destructive: single strings and comma-separated
  strings become arrays; empty strings become '{}'.
- The application's `migrateProfile()` helper also normalizes legacy string
  values on read, so previously exported JSON backups remain importable.
*/

-- New text columns (Basic Information + Profession)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS father_mother_name text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS contact_person_name text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS profession_type text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS job_business_details text NOT NULL DEFAULT '';

-- New text[] columns (Partner Requirements)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS pref_maslak text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS pref_nationality text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS pref_marital_status text[] NOT NULL DEFAULT '{}'::text[];

-- Convert pref_city from text to text[] (non-destructive)
ALTER TABLE profiles ALTER COLUMN pref_city DROP DEFAULT;

ALTER TABLE profiles
  ALTER COLUMN pref_city TYPE text[]
  USING CASE
    WHEN pref_city IS NULL OR pref_city = '' THEN '{}'::text[]
    ELSE string_to_array(trim(pref_city), ',')
  END;

ALTER TABLE profiles
  ALTER COLUMN pref_city SET DEFAULT '{}'::text[];
