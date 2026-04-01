-- Ajout d'une table agences + liaison par ID (agence_id) sur inventory

-- 1) Table des agences
CREATE TABLE IF NOT EXISTS public.agences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2) Seed des agences (inclut Site Okala)
INSERT INTO public.agences (code, label)
VALUES
  ('Okala', 'Agence Okala'),
  ('Site Okala', 'Site Okala'),
  ('Nzeng-Ayong', 'Agence Nzeng-Ayong'),
  ('PK9', 'Agence PK9'),
  ('Espace Conseil', 'Espace Conseil'),
  ('Owendo', 'Agence Owendo')
ON CONFLICT (code) DO UPDATE
SET label = EXCLUDED.label;

-- 3) Ajouter la colonne agence_id
ALTER TABLE public.inventory
ADD COLUMN IF NOT EXISTS agence_id UUID;

-- 4) Foreign key
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints tc
    WHERE tc.table_schema = 'public'
      AND tc.table_name = 'inventory'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND tc.constraint_name = 'inventory_agence_id_fkey'
  ) THEN
    ALTER TABLE public.inventory
    ADD CONSTRAINT inventory_agence_id_fkey
    FOREIGN KEY (agence_id)
    REFERENCES public.agences(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL;
  END IF;
END $$;

-- 5) Index
CREATE INDEX IF NOT EXISTS idx_inventory_agence_id ON public.inventory(agence_id);

-- 6) Étendre la contrainte CHECK du champ texte agence pour autoriser 'Site Okala'
DO $$
BEGIN
  -- Nom standard postgres pour un CHECK implicite: inventory_agence_check
  ALTER TABLE public.inventory DROP CONSTRAINT IF EXISTS inventory_agence_check;

  -- Recréer la contrainte avec Site Okala
  ALTER TABLE public.inventory
  ADD CONSTRAINT inventory_agence_check
  CHECK (agence IN ('Okala', 'Site Okala', 'Nzeng-Ayong', 'PK9', 'Espace Conseil', 'Owendo'));
EXCEPTION
  WHEN undefined_column THEN
    -- Si la colonne agence n'existe pas dans certaines bases (environnements), ignorer.
    NULL;
END $$;

-- 7) Backfill agence_id à partir du texte agence
UPDATE public.inventory i
SET agence_id = a.id
FROM public.agences a
WHERE i.agence IS NOT NULL
  AND i.agence = a.code
  AND i.agence_id IS NULL;
