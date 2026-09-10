-- Analytics: numbers maintained manually by the super admin, viewed by district admins only
CREATE TABLE IF NOT EXISTS analytics_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  label TEXT NOT NULL,
  value NUMERIC NOT NULL DEFAULT 0,
  suffix TEXT,
  category TEXT,
  note TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_order ON analytics_entries(sort_order ASC);

ALTER TABLE analytics_entries ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON analytics_entries TO authenticated;

-- District admins (incl. superadmin) can read; only superadmin can write.
DO $$ BEGIN
  DROP POLICY IF EXISTS "analytics_admin_read" ON analytics_entries;
  CREATE POLICY "analytics_admin_read" ON analytics_entries FOR SELECT
    USING (get_user_role() IN ('district_admin', 'superadmin'));
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "analytics_superadmin_write" ON analytics_entries;
  CREATE POLICY "analytics_superadmin_write" ON analytics_entries FOR ALL
    USING (get_user_role() = 'superadmin')
    WITH CHECK (get_user_role() = 'superadmin');
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DROP TRIGGER IF EXISTS trg_analytics_updated ON analytics_entries;
CREATE TRIGGER trg_analytics_updated BEFORE UPDATE ON analytics_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();