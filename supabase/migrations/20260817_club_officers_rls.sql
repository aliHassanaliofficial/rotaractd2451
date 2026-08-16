-- ── CLUB OFFICERS RLS ────────────────────────────────────────
-- Enable row-level security and grant the authenticated/anon roles access so
-- club admins can manage officer positions for their assigned clubs.

ALTER TABLE club_officers ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON club_officers TO authenticated;
GRANT SELECT ON club_officers TO anon;

-- Helper functions (idempotent; also defined in approval_system.sql)
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

-- Public can read officers (shown on public club pages)
DO $$ BEGIN
  CREATE POLICY "club_officers_public_read" ON club_officers FOR SELECT
    USING (TRUE);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Club admins manage officers for their assigned clubs
DO $$ BEGIN
  CREATE POLICY "club_officers_club_admin_manage" ON club_officers FOR ALL
    USING (get_user_role() = 'club_admin' AND (club_id IN (SELECT get_assigned_clubs())))
    WITH CHECK (get_user_role() = 'club_admin' AND (club_id IN (SELECT get_assigned_clubs())));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- District admins and superadmins manage all officers
DO $$ BEGIN
  CREATE POLICY "club_officers_district_admin_all" ON club_officers FOR ALL
    USING (get_user_role() IN ('district_admin', 'superadmin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
