-- Events: type (regular event | conference) + public capacity visibility toggle
ALTER TABLE events ADD COLUMN IF NOT EXISTS event_type TEXT NOT NULL DEFAULT 'event';
ALTER TABLE events ADD COLUMN IF NOT EXISTS show_capacity BOOLEAN NOT NULL DEFAULT TRUE;

DO $$ BEGIN
  ALTER TABLE events ADD CONSTRAINT check_events_event_type
    CHECK (event_type IN ('event', 'conference'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Payment / transaction methods shown to attendees on paid events
CREATE TABLE IF NOT EXISTS transaction_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  instructions TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT NOT NULL DEFAULT 0,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Registrations: which method was used + uploaded proof
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS transaction_method_id UUID REFERENCES transaction_methods(id);
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS transaction_proof_url TEXT;

CREATE INDEX IF NOT EXISTS idx_registrations_event ON registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_registrations_transaction_method ON registrations(transaction_method_id);

-- A registration can be declined by an admin after payment review.
DO $$ BEGIN
  ALTER TYPE reg_status ADD VALUE IF NOT EXISTS 'declined';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── RLS for transaction_methods ──────────────────────────────
-- Public (incl. guests) can read active methods; admins manage all rows.
ALTER TABLE transaction_methods ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON transaction_methods TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON transaction_methods TO authenticated;

DO $$ BEGIN
  DROP POLICY IF EXISTS "tx_pay_read_public" ON transaction_methods;
  CREATE POLICY "tx_pay_read_public" ON transaction_methods FOR SELECT
    USING (is_active = TRUE OR get_user_role() IN ('district_admin', 'superadmin'));
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "tx_pay_admin_all" ON transaction_methods;
  CREATE POLICY "tx_pay_admin_all" ON transaction_methods FOR ALL
    USING (get_user_role() IN ('district_admin', 'superadmin'))
    WITH CHECK (get_user_role() IN ('district_admin', 'superadmin'));
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DROP TRIGGER IF EXISTS trg_transaction_methods_updated ON transaction_methods;
CREATE TRIGGER trg_transaction_methods_updated BEFORE UPDATE ON transaction_methods
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Storage bucket for registration payment proofs ───────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('registration-proofs', 'registration-proofs', TRUE)
ON CONFLICT (id) DO NOTHING;

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