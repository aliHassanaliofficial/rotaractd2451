-- ── STORAGE RLS POLICIES ───────────────────────────────────
-- storage.objects has RLS enabled by default in Supabase.
-- These policies allow public reads + role-based writes for the
-- buckets used directly from the browser client (see STORAGE_BUCKETS).
-- Run this file in the Supabase SQL editor.

-- Helper: roles allowed to manage a given area
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- ── GALLERY ─────────────────────────────────────────────────
DO $$ BEGIN
  DROP POLICY IF EXISTS "gallery_read_public" ON storage.objects;
  CREATE POLICY "gallery_read_public" ON storage.objects FOR SELECT
    USING (bucket_id = 'gallery');
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "gallery_write_admin" ON storage.objects;
  CREATE POLICY "gallery_write_admin" ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'gallery'
      AND get_user_role() IN ('club_admin','district_admin','superadmin'));
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "gallery_update_admin" ON storage.objects;
  CREATE POLICY "gallery_update_admin" ON storage.objects FOR UPDATE TO authenticated
    USING (bucket_id = 'gallery'
      AND get_user_role() IN ('club_admin','district_admin','superadmin'));
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "gallery_delete_admin" ON storage.objects;
  CREATE POLICY "gallery_delete_admin" ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'gallery'
      AND get_user_role() IN ('club_admin','district_admin','superadmin'));
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- ── LIBRARY ─────────────────────────────────────────────────
DO $$ BEGIN
  DROP POLICY IF EXISTS "library_read_public" ON storage.objects;
  CREATE POLICY "library_read_public" ON storage.objects FOR SELECT
    USING (bucket_id = 'library');
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "library_write_admin" ON storage.objects;
  CREATE POLICY "library_write_admin" ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'library'
      AND get_user_role() IN ('district_admin','superadmin'));
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "library_update_admin" ON storage.objects;
  CREATE POLICY "library_update_admin" ON storage.objects FOR UPDATE TO authenticated
    USING (bucket_id = 'library'
      AND get_user_role() IN ('district_admin','superadmin'));
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "library_delete_admin" ON storage.objects;
  CREATE POLICY "library_delete_admin" ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'library'
      AND get_user_role() IN ('district_admin','superadmin'));
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- ── EVENT COVERS (posts & announcements) ────────────────────
DO $$ BEGIN
  DROP POLICY IF EXISTS "covers_read_public" ON storage.objects;
  CREATE POLICY "covers_read_public" ON storage.objects FOR SELECT
    USING (bucket_id = 'event-covers');
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "covers_write_admin" ON storage.objects;
  CREATE POLICY "covers_write_admin" ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'event-covers'
      AND get_user_role() IN ('club_admin','district_admin','superadmin'));
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "covers_update_admin" ON storage.objects;
  CREATE POLICY "covers_update_admin" ON storage.objects FOR UPDATE TO authenticated
    USING (bucket_id = 'event-covers'
      AND get_user_role() IN ('club_admin','district_admin','superadmin'));
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "covers_delete_admin" ON storage.objects;
  CREATE POLICY "covers_delete_admin" ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'event-covers'
      AND get_user_role() IN ('club_admin','district_admin','superadmin'));
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- ── CLUB LOGOS ──────────────────────────────────────────────
DO $$ BEGIN
  DROP POLICY IF EXISTS "logos_read_public" ON storage.objects;
  CREATE POLICY "logos_read_public" ON storage.objects FOR SELECT
    USING (bucket_id = 'club-logos');
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "logos_write_admin" ON storage.objects;
  CREATE POLICY "logos_write_admin" ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'club-logos'
      AND get_user_role() IN ('club_admin','district_admin','superadmin'));
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "logos_update_admin" ON storage.objects;
  CREATE POLICY "logos_update_admin" ON storage.objects FOR UPDATE TO authenticated
    USING (bucket_id = 'club-logos'
      AND get_user_role() IN ('club_admin','district_admin','superadmin'));
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "logos_delete_admin" ON storage.objects;
  CREATE POLICY "logos_delete_admin" ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'club-logos'
      AND get_user_role() IN ('club_admin','district_admin','superadmin'));
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- ── AVATARS (own profile only) ──────────────────────────────
DO $$ BEGIN
  DROP POLICY IF EXISTS "avatars_read_public" ON storage.objects;
  CREATE POLICY "avatars_read_public" ON storage.objects FOR SELECT
    USING (bucket_id = 'avatars');
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "avatars_insert_own" ON storage.objects;
  CREATE POLICY "avatars_insert_own" ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'avatars'
      AND (storage.foldername(name))[1] = auth.uid()::text);
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "avatars_update_own" ON storage.objects;
  CREATE POLICY "avatars_update_own" ON storage.objects FOR UPDATE TO authenticated
    USING (bucket_id = 'avatars'
      AND (storage.foldername(name))[1] = auth.uid()::text);
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "avatars_delete_own" ON storage.objects;
  CREATE POLICY "avatars_delete_own" ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'avatars'
      AND (storage.foldername(name))[1] = auth.uid()::text);
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- ── REGISTRATION PROOFS (payment proof uploads) ──────────────
DO $$ BEGIN
  DROP POLICY IF EXISTS "proof_read_public" ON storage.objects;
  CREATE POLICY "proof_read_public" ON storage.objects FOR SELECT
    USING (bucket_id = 'registration-proofs');
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "proof_write_authenticated" ON storage.objects;
  CREATE POLICY "proof_write_authenticated" ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'registration-proofs');
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "proof_update_admin" ON storage.objects;
  CREATE POLICY "proof_update_admin" ON storage.objects FOR UPDATE TO authenticated
    USING (bucket_id = 'registration-proofs'
      AND get_user_role() IN ('district_admin','superadmin'));
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "proof_delete_admin" ON storage.objects;
  CREATE POLICY "proof_delete_admin" ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'registration-proofs'
      AND get_user_role() IN ('district_admin','superadmin'));
EXCEPTION WHEN undefined_table THEN NULL;
END $$;
