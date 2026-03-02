-- Migration pour ajouter le champ agence à la table inventory
-- Ce champ permet de distinguer dans quelle agence chaque saisie a été effectuée

-- Vérifier si la colonne existe déjà avant de la créer
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'inventory' 
        AND column_name = 'agence'
    ) THEN
        -- Ajouter la colonne agence avec les valeurs possibles
        ALTER TABLE public.inventory
        ADD COLUMN agence TEXT CHECK (agence IN ('Okala', 'Nzeng-Ayong', 'PK9', 'Espace Conseil', 'Owendo'));
        
        -- Ajouter un index pour optimiser les recherches par agence
        CREATE INDEX idx_inventory_agence ON public.inventory(agence);
        
        -- Ajouter un commentaire explicatif sur la colonne
        COMMENT ON COLUMN public.inventory.agence IS 'Agence où la saisie a été effectuée : Okala, Nzeng-Ayong, PK9, Espace Conseil, Owendo';
    END IF;
END $$;
