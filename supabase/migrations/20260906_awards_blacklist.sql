-- Awards: admin-managed recognition shown to the public
CREATE TABLE IF NOT EXISTS awards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  recipient TEXT,
  category TEXT,
  year INT,
  description TEXT,
  image_url TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Blacklist: people blocked from registering (by email or phone)
CREATE TABLE IF NOT EXISTS blacklist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  reason TEXT,
  added_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_awards_year ON awards(year DESC, sort_order ASC);
CREATE INDEX IF NOT EXISTS idx_blacklist_email ON blacklist(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_blacklist_phone ON blacklist(phone);

-- ── RLS: public can read; district admins manage ─────────────
ALTER TABLE awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE blacklist ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON awards TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON awards TO authenticated;
GRANT SELECT ON blacklist TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON blacklist TO authenticated;

DO $$ BEGIN
  DROP POLICY IF EXISTS "awards_public_read" ON awards;
  CREATE POLICY "awards_public_read" ON awards FOR SELECT USING (TRUE);
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "awards_admin_all" ON awards;
  CREATE POLICY "awards_admin_all" ON awards FOR ALL
    USING (get_user_role() IN ('district_admin', 'superadmin'))
    WITH CHECK (get_user_role() IN ('district_admin', 'superadmin'));
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "blacklist_public_read" ON blacklist;
  CREATE POLICY "blacklist_public_read" ON blacklist FOR SELECT USING (TRUE);
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "blacklist_admin_all" ON blacklist;
  CREATE POLICY "blacklist_admin_all" ON blacklist FOR ALL
    USING (get_user_role() IN ('district_admin', 'superadmin'))
    WITH CHECK (get_user_role() IN ('district_admin', 'superadmin'));
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DROP TRIGGER IF EXISTS trg_awards_updated ON awards;
CREATE TRIGGER trg_awards_updated BEFORE UPDATE ON awards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Hard block: never allow a blacklisted contact to register ──
CREATE OR REPLACE FUNCTION block_blacklisted_registration()
RETURNS TRIGGER AS $$
DECLARE
  v_email TEXT;
  v_phone TEXT;
BEGIN
  IF NEW.profile_id IS NOT NULL THEN
    SELECT COALESCE(email, ''), COALESCE(phone, '')
      INTO v_email, v_phone
    FROM profiles WHERE id = NEW.profile_id;
  ELSE
    v_email := COALESCE(NEW.guest_email, '');
    v_phone := COALESCE(NEW.guest_phone, '');
  END IF;

  IF EXISTS (
    SELECT 1 FROM blacklist
    WHERE (
      v_email <> ''
      AND LOWER(COALESCE(blacklist.email, '')) = LOWER(v_email)
    )
    OR (
      v_phone <> ''
      AND regexp_replace(COALESCE(blacklist.phone, ''), '\D', '', 'g') <> ''
      AND (
        regexp_replace(v_phone, '\D', '', 'g') = regexp_replace(COALESCE(blacklist.phone, ''), '\D', '', 'g')
        OR regexp_replace('0' || v_phone, '\D', '', 'g') IN (
          regexp_replace(COALESCE(blacklist.phone, ''), '\D', '', 'g'),
          regexp_replace('0' || COALESCE(blacklist.phone, ''), '\D', '', 'g')
        )
      )
    )
  ) THEN
    RAISE EXCEPTION 'Registration blocked: this contact is on the district blacklist';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_block_blacklisted ON registrations;
CREATE TRIGGER trg_block_blacklisted BEFORE INSERT ON registrations
  FOR EACH ROW EXECUTE FUNCTION block_blacklisted_registration();