/*
# Profile ID sequence function

## Purpose
Atomic counter for generating human-readable profile IDs (MB0001, MB0002, ...).
Stored in the meta table under key 'seq'. This function reads and increments it atomically.

## Security
- SECURITY DEFINER so it can update the meta row even if anon policies are restrictive.
- Granted to anon and authenticated roles.
*/

CREATE OR REPLACE FUNCTION get_next_profile_id()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_val integer;
  new_val integer;
BEGIN
  SELECT (value->>'n')::integer INTO current_val
  FROM meta
  WHERE key = 'seq'
  FOR UPDATE;

  new_val := COALESCE(current_val, 0) + 1;

  INSERT INTO meta (key, value) VALUES ('seq', jsonb_build_object('n', new_val))
  ON CONFLICT (key) DO UPDATE SET value = jsonb_build_object('n', new_val);

  RETURN new_val;
END;
$$;

GRANT EXECUTE ON FUNCTION get_next_profile_id() TO anon, authenticated;
