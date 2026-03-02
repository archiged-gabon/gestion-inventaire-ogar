-- Migration pour ajouter le champ etat_contrat à la table inventory
-- Ce champ permet de distinguer les contrats "Actifs" et "Résiliés"

-- Vérifier si la colonne existe déjà avant de la créer
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'inventory' 
        AND column_name = 'etat_contrat'
    ) THEN
        -- Ajouter la colonne etat_contrat avec la valeur par défaut "Actif"
        ALTER TABLE public.inventory
        ADD COLUMN etat_contrat text DEFAULT 'Actif' CHECK (etat_contrat IN ('Actif', 'Résilié'));
        
        -- Nous ne mettons PAS à jour les anciennes entrées automatiquement
        -- Les anciennes entrées restent avec etat_contrat = NULL
        
        -- Ajouter un index pour optimiser les recherches par état de contrat
        CREATE INDEX idx_inventory_etat_contrat ON public.inventory(etat_contrat);
        
        -- Ajouter un commentaire explicatif sur la colonne
        COMMENT ON COLUMN public.inventory.etat_contrat IS 'État du contrat: Actif ou Résilié';
    END IF;
END $$;