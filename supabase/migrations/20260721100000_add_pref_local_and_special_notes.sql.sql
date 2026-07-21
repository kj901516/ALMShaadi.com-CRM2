-- Add new profile columns: pref_local_muhajir and special_notes
-- Non-destructive: default values set so existing rows unaffected

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS pref_local_muhajir text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS special_notes text NOT NULL DEFAULT '';
