-- First drop the existing constraint
ALTER TABLE public.inventory 
DROP CONSTRAINT IF EXISTS inventory_societe_concernee_check;

-- Then update existing records
UPDATE public.inventory 
SET societe_concernee = 'IARD (Sinistre)' 
WHERE societe_concernee = 'Non Vie';

-- Finally add the new constraint
ALTER TABLE public.inventory 
ADD CONSTRAINT inventory_societe_concernee_check 
CHECK (societe_concernee IN ('Vie', 'IARD (Sinistre)', 'Production'));