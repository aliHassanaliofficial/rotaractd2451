-- ── CLUB ADMIN CLUB MEDIA ────────────────────────────────────
-- Allow club admins to update their assigned clubs' profile picture and
-- cover photo. Storage policies for the club-logos bucket already grant
-- club_admin insert/update/delete.

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

-- Club admins can update their assigned clubs
DO $$ BEGIN
  CREATE POLICY "clubs_club_admin_write" ON clubs FOR UPDATE
    USING (get_user_role() = 'club_admin' AND (id IN (SELECT get_assigned_clubs())))
    WITH CHECK (get_user_role() = 'club_admin' AND (id IN (SELECT get_assigned_clubs())));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
