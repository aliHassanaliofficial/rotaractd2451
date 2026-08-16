-- Add calendar_type to events so the district calendar can color-code entries:
--   event   -> red
--   project -> blue
--   meeting -> yellow
-- Run this in the Supabase Dashboard > SQL Editor.

ALTER TABLE events ADD COLUMN IF NOT EXISTS calendar_type TEXT NOT NULL DEFAULT 'event';

DO $$ BEGIN
  ALTER TABLE events ADD CONSTRAINT check_calendar_type
    CHECK (calendar_type IN ('event', 'project', 'meeting'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
