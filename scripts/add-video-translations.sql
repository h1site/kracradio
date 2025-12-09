-- Script SQL pour ajouter les colonnes de traduction aux vidéos
-- Exécuter dans Supabase SQL Editor

-- Ajouter les colonnes de description traduites
ALTER TABLE videos
ADD COLUMN IF NOT EXISTS description_fr TEXT,
ADD COLUMN IF NOT EXISTS description_en TEXT,
ADD COLUMN IF NOT EXISTS description_es TEXT;

-- Copier la description existante dans description_fr si elle existe
UPDATE videos
SET description_fr = description
WHERE description IS NOT NULL
  AND description_fr IS NULL;

-- Ajouter un commentaire
COMMENT ON COLUMN videos.description_fr IS 'Description en français';
COMMENT ON COLUMN videos.description_en IS 'Description en anglais';
COMMENT ON COLUMN videos.description_es IS 'Description en espagnol';
