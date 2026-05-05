-- Rendre les dates optionnelles dans inventory
-- Permettre NULL sur date_effet et date_echeance

ALTER TABLE public.inventory
  ALTER COLUMN date_effet DROP NOT NULL;

ALTER TABLE public.inventory
  ALTER COLUMN date_echeance DROP NOT NULL;
