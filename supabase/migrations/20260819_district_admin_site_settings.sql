-- Allow district_admin to write site_settings (was superadmin only)
DROP POLICY IF EXISTS "settings_superadmin_write" ON site_settings;
CREATE POLICY "settings_superadmin_write" ON site_settings FOR ALL
  USING (get_user_role() IN ('district_admin', 'superadmin'));
