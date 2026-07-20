/*
# Preferred Caste: convert to multi-select (text[] array)

## Purpose
The Partner Requirements "Preferred Caste" field is being upgraded from a single
free-text value to a multi-select with custom manual entries, matching the existing
behavior of `pref_education` and `pref_profession`. This migration changes the column
type from `text` to `text[]` so multiple caste preferences can be stored per profile.

## Changes
- `profiles.pref_caste`: type `text` -> `text[]`
  - The existing `''::text` default is dropped first (cannot be cast to text[]),
    then replaced with `'{}'::text[]`.
  - Existing single-string values are split on commas into array elements
    (e.g. "Jutt, Rajput" -> {"Jutt","Rajput"}).
  - Empty strings become an empty array `{}`.

## Security
- No RLS policy changes. Existing anon/authenticated CRUD policies on `profiles`
  continue to apply unchanged.

## Backward compatibility
- Old rows with a single string value are converted to single-element arrays.
- Old rows with comma-separated strings are split into multi-element arrays.
- The application's `migrateProfile()` helper also normalizes legacy string values
  on read, so any previously exported JSON backups remain importable.
*/

ALTER TABLE profiles ALTER COLUMN pref_caste DROP DEFAULT;

ALTER TABLE profiles
  ALTER COLUMN pref_caste TYPE text[]
  USING CASE
    WHEN pref_caste IS NULL OR pref_caste = '' THEN '{}'::text[]
    ELSE string_to_array(trim(pref_caste), ',')
  END;

ALTER TABLE profiles
  ALTER COLUMN pref_caste SET DEFAULT '{}'::text[];
