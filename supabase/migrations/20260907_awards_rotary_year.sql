-- Awards: year as Rotary Year text (e.g. "26/27") like district_leadership
ALTER TABLE awards ALTER COLUMN year TYPE TEXT USING year::text;