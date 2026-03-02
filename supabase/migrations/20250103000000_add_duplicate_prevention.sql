-- Migration pour ajouter la prévention des doublons et la gestion des doublons existants
-- Cette migration ajoute des contraintes uniques et des index pour détecter les doublons

-- 1. Ajouter une contrainte unique composite pour les champs clés
-- Cette contrainte empêche les doublons exacts sur les champs métier essentiels
ALTER TABLE public.inventory 
ADD CONSTRAINT inventory_unique_police_intermediaire 
UNIQUE (police_orass, intermediaire_orass, nom_assure, date_effet);

-- 2. Créer un index pour améliorer les performances de détection de doublons
CREATE INDEX idx_inventory_duplicate_detection 
ON public.inventory (police_orass, intermediaire_orass, nom_assure, date_effet);

-- 3. Ajouter une colonne pour marquer les doublons potentiels (optionnel, pour l'analyse)
ALTER TABLE public.inventory 
ADD COLUMN IF NOT EXISTS is_potential_duplicate BOOLEAN DEFAULT FALSE;

-- 4. Créer une fonction pour détecter et marquer les doublons existants
CREATE OR REPLACE FUNCTION mark_potential_duplicates()
RETURNS void AS $$
BEGIN
    -- Marquer les entrées qui ont des doublons potentiels
    UPDATE public.inventory 
    SET is_potential_duplicate = TRUE
    WHERE id IN (
        SELECT DISTINCT i1.id
        FROM public.inventory i1
        WHERE EXISTS (
            SELECT 1 
            FROM public.inventory i2 
            WHERE i1.id != i2.id
            AND i1.police_orass = i2.police_orass
            AND i1.intermediaire_orass = i2.intermediaire_orass
            AND i1.nom_assure = i2.nom_assure
            AND i1.date_effet = i2.date_effet
        )
    );
    
    -- Réinitialiser les autres entrées
    UPDATE public.inventory 
    SET is_potential_duplicate = FALSE
    WHERE id NOT IN (
        SELECT DISTINCT i1.id
        FROM public.inventory i1
        WHERE EXISTS (
            SELECT 1 
            FROM public.inventory i2 
            WHERE i1.id != i2.id
            AND i1.police_orass = i2.police_orass
            AND i1.intermediaire_orass = i2.intermediaire_orass
            AND i1.nom_assure = i2.nom_assure
            AND i1.date_effet = i2.date_effet
        )
    );
END;
$$ LANGUAGE plpgsql;

-- 5. Exécuter la fonction pour marquer les doublons existants
SELECT mark_potential_duplicates();

-- 6. Créer une fonction pour détecter les doublons avant insertion
CREATE OR REPLACE FUNCTION check_duplicate_before_insert()
RETURNS TRIGGER AS $$
BEGIN
    -- Vérifier s'il existe déjà une entrée avec les mêmes données
    IF EXISTS (
        SELECT 1 
        FROM public.inventory 
        WHERE police_orass = NEW.police_orass
        AND intermediaire_orass = NEW.intermediaire_orass
        AND nom_assure = NEW.nom_assure
        AND date_effet = NEW.date_effet
        AND id != COALESCE(NEW.id, gen_random_uuid()) -- Éviter les conflits sur UPDATE
    ) THEN
        RAISE EXCEPTION 'Une entrée avec ces données existe déjà. Doublon détecté sur: Police ORASS %, Intermédiaire %, Assuré %, Date effet %', 
            NEW.police_orass, NEW.intermediaire_orass, NEW.nom_assure, NEW.date_effet;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Créer le trigger pour vérifier les doublons avant insertion
DROP TRIGGER IF EXISTS trigger_check_duplicate_before_insert ON public.inventory;
CREATE TRIGGER trigger_check_duplicate_before_insert
    BEFORE INSERT OR UPDATE ON public.inventory
    FOR EACH ROW
    EXECUTE FUNCTION check_duplicate_before_insert();

-- 8. Créer une vue pour faciliter la détection des doublons
CREATE OR REPLACE VIEW public.inventory_duplicates AS
SELECT 
    police_orass,
    intermediaire_orass,
    nom_assure,
    date_effet,
    COUNT(*) as duplicate_count,
    ARRAY_AGG(id ORDER BY created_at) as duplicate_ids,
    ARRAY_AGG(no ORDER BY created_at) as duplicate_numbers,
    MIN(created_at) as first_created,
    MAX(created_at) as last_created
FROM public.inventory
GROUP BY police_orass, intermediaire_orass, nom_assure, date_effet
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC, first_created;

-- 9. Commentaires pour documentation
COMMENT ON CONSTRAINT inventory_unique_police_intermediaire ON public.inventory IS 
'Contrainte unique empêchant les doublons exacts sur les champs métier essentiels';

COMMENT ON INDEX idx_inventory_duplicate_detection IS 
'Index pour améliorer les performances de détection de doublons';

COMMENT ON COLUMN public.inventory.is_potential_duplicate IS 
'Marqueur pour indiquer si cette entrée est un doublon potentiel';

COMMENT ON FUNCTION mark_potential_duplicates() IS 
'Fonction pour détecter et marquer les doublons existants dans la base';

COMMENT ON FUNCTION check_duplicate_before_insert() IS 
'Fonction trigger pour empêcher l''insertion de doublons';

COMMENT ON VIEW public.inventory_duplicates IS 
'Vue pour identifier et analyser les doublons existants';
