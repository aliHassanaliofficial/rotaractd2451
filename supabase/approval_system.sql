-- ── APPROVAL WORKFLOW ───────────────────────────────────────
ALTER TABLE posts ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'approved';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES profiles(id);
ALTER TABLE posts ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

ALTER TABLE events ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'approved';
ALTER TABLE events ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES profiles(id);
ALTER TABLE events ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

ALTER TABLE gallery_albums ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'approved';
ALTER TABLE gallery_albums ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES profiles(id);
ALTER TABLE gallery_albums ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- ── MULTI-CLUB ADMIN ASSIGNMENT ─────────────────────────────
CREATE TABLE IF NOT EXISTS club_admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id, club_id)
);

ALTER TABLE club_admins ENABLE ROW LEVEL SECURITY;

-- ── HELPER FUNCTIONS ────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_assigned_clubs()
RETURNS SETOF UUID AS $$
  SELECT club_id FROM profiles WHERE id = auth.uid() AND club_id IS NOT NULL
  UNION
  SELECT club_id FROM club_admins WHERE profile_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- ── DROP OLD POLICIES ───────────────────────────────────────
DROP POLICY IF EXISTS "events_admin_all" ON events;
DROP POLICY IF EXISTS "events_public_read" ON events;
DROP POLICY IF EXISTS "posts_admin_all" ON posts;
DROP POLICY IF EXISTS "posts_public_read" ON posts;
DROP POLICY IF EXISTS "profiles_public_select" ON profiles;
DROP POLICY IF EXISTS "profiles_own_update" ON profiles;
DROP POLICY IF EXISTS "profiles_admin_all" ON profiles;
DROP POLICY IF EXISTS "clubs_public_read" ON clubs;
DROP POLICY IF EXISTS "clubs_admin_write" ON clubs;
DROP POLICY IF EXISTS "gallery_albums_admin" ON gallery_albums;
DROP POLICY IF EXISTS "gallery_media_admin" ON gallery_media;
DROP POLICY IF EXISTS "library_public" ON library_items;
DROP POLICY IF EXISTS "library_admin" ON library_items;
DROP POLICY IF EXISTS "history_public" ON history_entries;
DROP POLICY IF EXISTS "history_admin" ON history_entries;
DROP POLICY IF EXISTS "leadership_public" ON district_leadership;
DROP POLICY IF EXISTS "leadership_admin" ON district_leadership;
DROP POLICY IF EXISTS "contact_insert" ON contact_messages;
DROP POLICY IF EXISTS "contact_admin_read" ON contact_messages;
DROP POLICY IF EXISTS "notif_own" ON notifications;
DROP POLICY IF EXISTS "notif_admin_insert" ON notifications;
DROP POLICY IF EXISTS "settings_public_read" ON site_settings;
DROP POLICY IF EXISTS "settings_superadmin_write" ON site_settings;
DROP POLICY IF EXISTS "audit_superadmin" ON audit_logs;
DROP POLICY IF EXISTS "regs_admin_update" ON registrations;
DROP POLICY IF EXISTS "regs_own_read" ON registrations;
DROP POLICY IF EXISTS "regs_insert_any" ON registrations;

-- ── NEW RLS POLICIES ────────────────────────────────────────

-- EVENTS: public sees approved+published; club_admin sees their clubs' events; district_admin+superadmin see all
DO $$ BEGIN
  CREATE POLICY "events_public_read" ON events FOR SELECT
    USING (status = 'published' AND (approval_status IS NULL OR approval_status = 'approved'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "events_club_admin_manage" ON events FOR ALL
    USING (get_user_role() = 'club_admin' AND (host_club_id IN (SELECT get_assigned_clubs())))
    WITH CHECK (get_user_role() = 'club_admin' AND (host_club_id IN (SELECT get_assigned_clubs())));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "events_district_admin_all" ON events FOR ALL
    USING (get_user_role() IN ('district_admin', 'superadmin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- POSTS: public sees approved+published; club_admin manages their clubs' posts; district_admin+superadmin see all
DO $$ BEGIN
  CREATE POLICY "posts_public_read" ON posts FOR SELECT
    USING (status = 'published' AND (approval_status IS NULL OR approval_status = 'approved'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "posts_club_admin_manage" ON posts FOR ALL
    USING (get_user_role() = 'club_admin' AND (club_id IN (SELECT get_assigned_clubs())))
    WITH CHECK (get_user_role() = 'club_admin' AND (club_id IN (SELECT get_assigned_clubs())));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "posts_district_admin_all" ON posts FOR ALL
    USING (get_user_role() IN ('district_admin', 'superadmin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- PROFILES
DO $$ BEGIN
  CREATE POLICY "profiles_public_select" ON profiles FOR SELECT USING (TRUE);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "profiles_own_update" ON profiles FOR UPDATE USING (id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "profiles_superadmin_all" ON profiles FOR ALL
    USING (get_user_role() = 'superadmin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "profiles_district_admin_select" ON profiles FOR SELECT
    USING (get_user_role() IN ('district_admin', 'superadmin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CLUBS
DO $$ BEGIN
  CREATE POLICY "clubs_public_read" ON clubs FOR SELECT USING (TRUE);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "clubs_district_admin_write" ON clubs FOR ALL
    USING (get_user_role() IN ('district_admin', 'superadmin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "clubs_club_admin_read" ON clubs FOR SELECT
    USING (get_user_role() = 'club_admin' AND id IN (SELECT get_assigned_clubs()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "clubs_club_admin_write" ON clubs FOR UPDATE
    USING (get_user_role() = 'club_admin' AND (id IN (SELECT get_assigned_clubs())))
    WITH CHECK (get_user_role() = 'club_admin' AND (id IN (SELECT get_assigned_clubs())));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- REGISTRATIONS
DO $$ BEGIN
  CREATE POLICY "regs_own_read" ON registrations FOR SELECT
    USING (profile_id = auth.uid() OR get_user_role() IN ('district_admin', 'superadmin') OR (get_user_role() = 'club_admin' AND event_id IN (SELECT id FROM events WHERE host_club_id IN (SELECT get_assigned_clubs()))));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "regs_insert_any" ON registrations FOR INSERT WITH CHECK (TRUE);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "regs_admin_update" ON registrations FOR UPDATE
    USING (get_user_role() IN ('district_admin', 'superadmin') OR (get_user_role() = 'club_admin' AND event_id IN (SELECT id FROM events WHERE host_club_id IN (SELECT get_assigned_clubs()))));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- GALLERY ALBUMS
DO $$ BEGIN
  CREATE POLICY "gallery_albums_public" ON gallery_albums FOR SELECT USING (is_published = TRUE AND (approval_status IS NULL OR approval_status = 'approved'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "gallery_albums_club_admin" ON gallery_albums FOR ALL
    USING (get_user_role() = 'club_admin' AND (club_id IN (SELECT get_assigned_clubs())))
    WITH CHECK (get_user_role() = 'club_admin' AND (club_id IN (SELECT get_assigned_clubs())));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "gallery_albums_district_admin" ON gallery_albums FOR ALL
    USING (get_user_role() IN ('district_admin', 'superadmin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- GALLERY MEDIA
DO $$ BEGIN
  CREATE POLICY "gallery_media_public" ON gallery_media FOR SELECT
    USING ((SELECT is_published FROM gallery_albums WHERE id = album_id));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "gallery_media_club_admin" ON gallery_media FOR ALL
    USING (get_user_role() = 'club_admin' AND album_id IN (SELECT id FROM gallery_albums WHERE club_id IN (SELECT get_assigned_clubs())))
    WITH CHECK (get_user_role() = 'club_admin' AND album_id IN (SELECT id FROM gallery_albums WHERE club_id IN (SELECT get_assigned_clubs())));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "gallery_media_district_admin" ON gallery_media FOR ALL
    USING (get_user_role() IN ('district_admin', 'superadmin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- LIBRARY
DO $$ BEGIN
  CREATE POLICY "library_public" ON library_items FOR SELECT USING (is_published = TRUE);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "library_district_admin" ON library_items FOR ALL
    USING (get_user_role() IN ('district_admin', 'superadmin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- HISTORY
DO $$ BEGIN
  CREATE POLICY "history_public" ON history_entries FOR SELECT USING (TRUE);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "history_admin" ON history_entries FOR ALL
    USING (get_user_role() IN ('district_admin', 'superadmin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- LEADERSHIP
DO $$ BEGIN
  CREATE POLICY "leadership_public" ON district_leadership FOR SELECT USING (TRUE);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "leadership_admin" ON district_leadership FOR ALL
    USING (get_user_role() IN ('district_admin', 'superadmin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CONTACT
DO $$ BEGIN
  CREATE POLICY "contact_insert" ON contact_messages FOR INSERT WITH CHECK (TRUE);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "contact_admin_read" ON contact_messages FOR SELECT
    USING (get_user_role() IN ('district_admin', 'superadmin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- NOTIFICATIONS
DO $$ BEGIN
  CREATE POLICY "notif_own" ON notifications FOR ALL USING (profile_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "notif_admin_insert" ON notifications FOR INSERT
    WITH CHECK (get_user_role() IN ('district_admin', 'superadmin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AUDIT LOG
DO $$ BEGIN
  CREATE POLICY "audit_superadmin" ON audit_logs FOR ALL
    USING (get_user_role() = 'superadmin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- SETTINGS
DO $$ BEGIN
  CREATE POLICY "settings_public_read" ON site_settings FOR SELECT USING (TRUE);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "settings_superadmin_write" ON site_settings FOR ALL
    USING (get_user_role() = 'superadmin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CLUB ADMINS
DO $$ BEGIN
  CREATE POLICY "club_admins_select" ON club_admins FOR SELECT
    USING (get_user_role() IN ('superadmin', 'district_admin') OR profile_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "club_admins_insert" ON club_admins FOR INSERT
    WITH CHECK (get_user_role() = 'superadmin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "club_admins_delete" ON club_admins FOR DELETE
    USING (get_user_role() = 'superadmin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── CLUB OFFICERS ────────────────────────────────────────────
ALTER TABLE club_officers ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON club_officers TO authenticated;
GRANT SELECT ON club_officers TO anon;

DO $$ BEGIN
  CREATE POLICY "club_officers_public_read" ON club_officers FOR SELECT
    USING (TRUE);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "club_officers_club_admin_manage" ON club_officers FOR ALL
    USING (get_user_role() = 'club_admin' AND (club_id IN (SELECT get_assigned_clubs())))
    WITH CHECK (get_user_role() = 'club_admin' AND (club_id IN (SELECT get_assigned_clubs())));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "club_officers_district_admin_all" ON club_officers FOR ALL
    USING (get_user_role() IN ('district_admin', 'superadmin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
