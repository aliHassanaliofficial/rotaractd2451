-- Fix: library categories are not visible to anonymous (public) users on the user-facing Library page.
-- The live database has RLS enabled on library_categories, but no SELECT policy allows public reads.
-- Run this in the Supabase Dashboard > SQL Editor.

DO $$ BEGIN
  DROP POLICY IF EXISTS "library_categories_public_read" ON library_categories;
  CREATE POLICY "library_categories_public_read" ON library_categories FOR SELECT USING (TRUE);
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- If the table does not have RLS enabled yet, ensure it matches the schema (safe to run either way):
ALTER TABLE library_categories ENABLE ROW LEVEL SECURITY;

-- Verify (should return rows for anon):
-- SELECT * FROM library_categories;
