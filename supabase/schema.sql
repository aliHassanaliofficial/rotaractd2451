-- ── EXTENSIONS ──────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ── ENUMS ───────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('member','club_admin','district_admin','superadmin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE event_status AS ENUM ('draft','published','cancelled','completed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE reg_status AS ENUM ('pending','confirmed','cancelled','attended');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE post_status AS ENUM ('draft','published','archived');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE media_type AS ENUM ('image','video','document','pdf');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE announcement_priority AS ENUM ('normal','important','urgent');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── TABLES ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  bio TEXT,
  role user_role NOT NULL DEFAULT 'member',
  club_id UUID,
  rotaract_id TEXT UNIQUE,
  graduation_year INT,
  occupation TEXT,
  social_linkedin TEXT,
  social_instagram TEXT,
  social_facebook TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clubs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  charter_date DATE,
  description TEXT,
  mission TEXT,
  vision TEXT,
  logo_url TEXT,
  cover_url TEXT,
  university TEXT,
  city TEXT,
  country TEXT DEFAULT 'Egypt',
  website TEXT,
  email TEXT,
  phone TEXT,
  facebook TEXT,
  instagram TEXT,
  linkedin TEXT,
  president_id UUID REFERENCES profiles(id),
  secretary_id UUID REFERENCES profiles(id),
  treasurer_id UUID REFERENCES profiles(id),
  member_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  founded_year INT,
  meeting_day TEXT,
  meeting_time TEXT,
  meeting_location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$ BEGIN
  ALTER TABLE profiles ADD CONSTRAINT IF NOT EXISTS fk_club
    FOREIGN KEY (club_id) REFERENCES clubs(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS club_officers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  position TEXT NOT NULL,
  year TEXT NOT NULL,
  is_current BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  rich_description JSONB,
  cover_url TEXT,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  location TEXT,
  location_url TEXT,
  latitude DECIMAL,
  longitude DECIMAL,
  is_online BOOLEAN DEFAULT FALSE,
  online_url TEXT,
  capacity INT,
  registration_open BOOLEAN DEFAULT TRUE,
  registration_deadline TIMESTAMPTZ,
  registration_type TEXT DEFAULT 'public',
  price DECIMAL DEFAULT 0,
  currency TEXT DEFAULT 'EGP',
  status event_status DEFAULT 'draft',
  host_club_id UUID REFERENCES clubs(id),
  organizer_id UUID REFERENCES profiles(id),
  category TEXT,
  calendar_type TEXT DEFAULT 'event',
  tags TEXT[],
  agenda JSONB,
  sponsors JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$ BEGIN
  ALTER TABLE events ADD CONSTRAINT IF NOT EXISTS check_registration_type
    CHECK (registration_type IN ('public', 'members_only'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id),
  guest_name TEXT,
  guest_email TEXT,
  guest_phone TEXT,
  guest_club TEXT,
  qr_code TEXT UNIQUE NOT NULL DEFAULT uuid_generate_v4()::TEXT,
  ticket_number TEXT UNIQUE,
  status reg_status DEFAULT 'pending',
  notes TEXT,
  checked_in_at TIMESTAMPTZ,
  checked_in_by UUID REFERENCES profiles(id),
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT reg_has_attendee CHECK (
    profile_id IS NOT NULL OR (guest_name IS NOT NULL AND guest_email IS NOT NULL)
  )
);

CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT,
  content JSONB,
  cover_url TEXT,
  author_id UUID REFERENCES profiles(id),
  club_id UUID REFERENCES clubs(id),
  status post_status DEFAULT 'draft',
  is_announcement BOOLEAN DEFAULT FALSE,
  is_pinned BOOLEAN DEFAULT FALSE,
  announcement_priority announcement_priority DEFAULT 'normal',
  tags TEXT[],
  views INT DEFAULT 0,
  published_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gallery_albums (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  cover_url TEXT,
  event_id UUID REFERENCES events(id),
  club_id UUID REFERENCES clubs(id),
  is_published BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gallery_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  album_id UUID NOT NULL REFERENCES gallery_albums(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  type media_type DEFAULT 'image',
  caption TEXT,
  sort_order INT DEFAULT 0,
  uploaded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS library_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  sort_order INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS library_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  external_url TEXT,
  type media_type DEFAULT 'document',
  category_id UUID REFERENCES library_categories(id),
  tags TEXT[],
  is_published BOOLEAN DEFAULT TRUE,
  downloads INT DEFAULT 0,
  uploaded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS history_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  year INT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  milestone_type TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS district_leadership (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id),
  position TEXT NOT NULL,
  year TEXT NOT NULL,
  is_current BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  bio TEXT,
  photo_url TEXT
);

CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  replied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  link TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value JSONB,
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  subscribed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── DEFAULT SETTINGS ────────────────────────────────────────
INSERT INTO site_settings (key, value) VALUES
  ('district_info', '{"name":"Rotaract District 2451","year":"2026-2027","governor":"","theme":"","logo_url":"","hero_video_url":"","social":{}}'::jsonb),
  ('hero_slides', '[]'::jsonb),
  ('contact_info', '{"email":"","phone":"","address":"","map_embed_url":""}'::jsonb),
  ('feature_flags', '{"registration_open":true,"guest_registration":true,"show_member_directory":true,"gallery_public":true}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- ── INDEXES ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_start ON events(start_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_registrations_event ON registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_registrations_qr ON registrations(qr_code);
CREATE INDEX IF NOT EXISTS idx_profiles_club ON profiles(club_id);
CREATE INDEX IF NOT EXISTS idx_gallery_album ON gallery_media(album_id, sort_order);

-- ── TICKET NUMBER TRIGGER ──────────────────────────────────
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.ticket_number := 'D2451-' || UPPER(SUBSTRING(NEW.id::TEXT, 1, 8));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_ticket_number ON registrations;
CREATE TRIGGER set_ticket_number
  BEFORE INSERT ON registrations
  FOR EACH ROW EXECUTE FUNCTION generate_ticket_number();

-- ── UPDATED_AT TRIGGER ────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_updated ON profiles;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS trg_clubs_updated ON clubs;
CREATE TRIGGER trg_clubs_updated BEFORE UPDATE ON clubs FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS trg_events_updated ON events;
CREATE TRIGGER trg_events_updated BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS trg_posts_updated ON posts;
CREATE TRIGGER trg_posts_updated BEFORE UPDATE ON posts FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── ROW-LEVEL SECURITY ───────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE history_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE district_leadership ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_officers ENABLE ROW LEVEL SECURITY;

-- Helper function
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- ── RLS POLICIES ─────────────────────────────────────────────
DO $$ BEGIN
  DROP POLICY IF EXISTS "events_public_read" ON events;
  CREATE POLICY "events_public_read" ON events FOR SELECT USING (status = 'published');
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "events_admin_all" ON events;
  CREATE POLICY "events_admin_all" ON events FOR ALL
    USING (get_user_role() IN ('district_admin','superadmin')
      OR (get_user_role() = 'club_admin'
          AND host_club_id = (SELECT club_id FROM profiles WHERE id = auth.uid())));
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "posts_public_read" ON posts;
  CREATE POLICY "posts_public_read" ON posts FOR SELECT USING (status = 'published');
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "posts_admin_all" ON posts;
  CREATE POLICY "posts_admin_all" ON posts FOR ALL
    USING (get_user_role() IN ('district_admin','superadmin')
      OR (get_user_role() = 'club_admin'
          AND club_id = (SELECT club_id FROM profiles WHERE id = auth.uid())));
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "profiles_public_select" ON profiles;
  CREATE POLICY "profiles_public_select" ON profiles FOR SELECT USING (TRUE);
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "profiles_own_update" ON profiles;
  CREATE POLICY "profiles_own_update" ON profiles FOR UPDATE USING (id = auth.uid());
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "profiles_admin_all" ON profiles;
  CREATE POLICY "profiles_admin_all" ON profiles FOR ALL
    USING (get_user_role() IN ('district_admin','superadmin'));
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "clubs_public_read" ON clubs;
  CREATE POLICY "clubs_public_read" ON clubs FOR SELECT USING (TRUE);
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "clubs_admin_write" ON clubs;
  CREATE POLICY "clubs_admin_write" ON clubs FOR ALL
    USING (get_user_role() IN ('district_admin','superadmin')
      OR (get_user_role() = 'club_admin'
          AND id = (SELECT club_id FROM profiles WHERE id = auth.uid())));
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- ── CLUB OFFICERS ─────────────────────────────────────────────
GRANT SELECT, INSERT, UPDATE, DELETE ON club_officers TO authenticated;
GRANT SELECT ON club_officers TO anon;

DO $$ BEGIN
  DROP POLICY IF EXISTS "club_officers_public_read" ON club_officers;
  CREATE POLICY "club_officers_public_read" ON club_officers FOR SELECT USING (TRUE);
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "club_officers_club_admin_manage" ON club_officers;
  CREATE POLICY "club_officers_club_admin_manage" ON club_officers FOR ALL
    USING (get_user_role() = 'club_admin'
      AND (club_id = (SELECT club_id FROM profiles WHERE id = auth.uid())
        OR club_id IN (SELECT club_id FROM club_admins WHERE profile_id = auth.uid())))
    WITH CHECK (get_user_role() = 'club_admin'
      AND (club_id = (SELECT club_id FROM profiles WHERE id = auth.uid())
        OR club_id IN (SELECT club_id FROM club_admins WHERE profile_id = auth.uid())));
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "club_officers_district_admin_all" ON club_officers;
  CREATE POLICY "club_officers_district_admin_all" ON club_officers FOR ALL
    USING (get_user_role() IN ('district_admin','superadmin'));
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "regs_own_read" ON registrations;
  CREATE POLICY "regs_own_read" ON registrations FOR SELECT
    USING (profile_id = auth.uid() OR get_user_role() IN ('club_admin','district_admin','superadmin'));
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "regs_insert_any" ON registrations;
  CREATE POLICY "regs_insert_any" ON registrations FOR INSERT WITH CHECK (TRUE);
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "regs_admin_update" ON registrations;
  CREATE POLICY "regs_admin_update" ON registrations FOR UPDATE
    USING (get_user_role() IN ('club_admin','district_admin','superadmin'));
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "gallery_albums_public" ON gallery_albums;
  CREATE POLICY "gallery_albums_public" ON gallery_albums FOR SELECT USING (is_published = TRUE);
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "gallery_albums_admin" ON gallery_albums;
  CREATE POLICY "gallery_albums_admin" ON gallery_albums FOR ALL
    USING (get_user_role() IN ('club_admin','district_admin','superadmin'));
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "gallery_media_public" ON gallery_media;
  CREATE POLICY "gallery_media_public" ON gallery_media FOR SELECT
    USING ((SELECT is_published FROM gallery_albums WHERE id = album_id));
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "gallery_media_admin" ON gallery_media;
  CREATE POLICY "gallery_media_admin" ON gallery_media FOR ALL
    USING (get_user_role() IN ('club_admin','district_admin','superadmin'));
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "library_public" ON library_items;
  CREATE POLICY "library_public" ON library_items FOR SELECT USING (is_published = TRUE);
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "library_categories_public_read" ON library_categories;
  CREATE POLICY "library_categories_public_read" ON library_categories FOR SELECT USING (TRUE);
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "library_admin" ON library_items;
  CREATE POLICY "library_admin" ON library_items FOR ALL
    USING (get_user_role() IN ('district_admin','superadmin'));
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "history_public" ON history_entries;
  CREATE POLICY "history_public" ON history_entries FOR SELECT USING (TRUE);
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "history_admin" ON history_entries;
  CREATE POLICY "history_admin" ON history_entries FOR ALL
    USING (get_user_role() IN ('district_admin','superadmin'));
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "leadership_public" ON district_leadership;
  CREATE POLICY "leadership_public" ON district_leadership FOR SELECT USING (TRUE);
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "leadership_admin" ON district_leadership;
  CREATE POLICY "leadership_admin" ON district_leadership FOR ALL
    USING (get_user_role() IN ('district_admin','superadmin'));
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "contact_insert" ON contact_messages;
  CREATE POLICY "contact_insert" ON contact_messages FOR INSERT WITH CHECK (TRUE);
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "contact_admin_read" ON contact_messages;
  CREATE POLICY "contact_admin_read" ON contact_messages FOR SELECT
    USING (get_user_role() IN ('district_admin','superadmin'));
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "notif_own" ON notifications;
  CREATE POLICY "notif_own" ON notifications FOR ALL USING (profile_id = auth.uid());
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "notif_admin_insert" ON notifications;
  CREATE POLICY "notif_admin_insert" ON notifications FOR INSERT
    WITH CHECK (get_user_role() IN ('district_admin','superadmin'));
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "audit_superadmin" ON audit_logs;
  CREATE POLICY "audit_superadmin" ON audit_logs FOR ALL
    USING (get_user_role() = 'superadmin');
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "settings_public_read" ON site_settings;
  CREATE POLICY "settings_public_read" ON site_settings FOR SELECT USING (TRUE);
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "settings_superadmin_write" ON site_settings;
  CREATE POLICY "settings_superadmin_write" ON site_settings FOR ALL
    USING (get_user_role() = 'superadmin');
EXCEPTION WHEN undefined_table THEN NULL;
END $$;
