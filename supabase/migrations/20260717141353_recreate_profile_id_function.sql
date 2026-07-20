/*
# Recreate profile ID sequence function (idempotent)

Ensures get_next_profile_id() RPC exists for atomic ID generation.
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
