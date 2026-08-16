-- ── MEMBER ACTIVATION WORKFLOW ──────────────────────────────
-- Members self-register as 'pending'. Club Admins / District Admins /
-- Super Admins approve or reject the account to activate membership.
-- Existing profiles keep the 'approved' default so nobody is locked out.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'approved';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES profiles(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- Existing member profiles without a club (e.g. OAuth/Google sign-ins) are
-- incomplete: mark them pending and inactive so they must complete their
-- profile (club + details) and be approved by a club admin.
UPDATE profiles
SET approval_status = 'pending', is_active = false
WHERE role = 'member' AND club_id IS NULL;

