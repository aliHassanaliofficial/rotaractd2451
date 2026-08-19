-- Leadership: remove profile FK, add name field
-- Photo stays as photo_url TEXT (uploaded to gallery bucket, not a URL input)

ALTER TABLE district_leadership
  DROP CONSTRAINT IF EXISTS district_leadership_profile_id_fkey;

ALTER TABLE district_leadership
  DROP COLUMN IF EXISTS profile_id;

ALTER TABLE district_leadership
  ADD COLUMN IF NOT EXISTS name TEXT;
