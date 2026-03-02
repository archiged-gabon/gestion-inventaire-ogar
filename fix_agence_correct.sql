-- Script de correction INTELLIGENTE des agences
-- Ce script analyse d'abord les données, puis applique les règles de manière sélective
-- Il évite de tout assigner à "Espace Conseil"

DO $$
DECLARE
    total_entries INTEGER;
    updated_count INTEGER;
    agent_name TEXT;
    creation_date DATE;
    rule_applied TEXT;
BEGIN
    -- Compter le total d'entrées
    SELECT COUNT(*) INTO total_entries FROM public.inventory;
    RAISE NOTICE 'Total d''entrées à traiter : %', total_entries;
    RAISE NOTICE '========================================';

    -- ============================================================
    -- ÉTAPE 1 : Mettre à jour les entrées selon les règles spécifiques
    -- ============================================================

    -- 1. PK9 : 23 octobre par OLOLO Jesmiel
    UPDATE public.inventory
    SET agence = 'PK9'
    WHERE nom_agent_inventaire = 'OLOLO Jesmiel'
      AND DATE(created_at) = '2024-10-23';
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    IF updated_count > 0 THEN
        RAISE NOTICE '✓ PK9 (23 oct OLOLO Jesmiel) : % entrées', updated_count;
    END IF;

    -- 2. Okala : 24-29 octobre par OLOLO Jesmiel
    UPDATE public.inventory
    SET agence = 'Okala'
    WHERE nom_agent_inventaire = 'OLOLO Jesmiel'
      AND DATE(created_at) >= '2024-10-24'
      AND DATE(created_at) <= '2024-10-29';
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    IF updated_count > 0 THEN
        RAISE NOTICE '✓ Okala (24-29 oct OLOLO Jesmiel) : % entrées', updated_count;
    END IF;

    -- 3. Nzeng-Ayong : à partir du 30 octobre par OLOLO Jesmiel
    UPDATE public.inventory
    SET agence = 'Nzeng-Ayong'
    WHERE nom_agent_inventaire = 'OLOLO Jesmiel'
      AND DATE(created_at) >= '2024-10-30';
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    IF updated_count > 0 THEN
        RAISE NOTICE '✓ Nzeng-Ayong (>= 30 oct OLOLO Jesmiel) : % entrées', updated_count;
    END IF;

    -- 4. Espace Conseil : avant le 23 octobre (TOUS les agents)
    UPDATE public.inventory
    SET agence = 'Espace Conseil'
    WHERE DATE(created_at) < '2024-10-23';
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    IF updated_count > 0 THEN
        RAISE NOTICE '✓ Espace Conseil (avant 23 oct - tous agents) : % entrées', updated_count;
    END IF;

    -- 5. Espace Conseil : 93 premières entrées du 29 octobre par NDONG Nell Davy
    -- Utiliser un CTE pour éviter les conflits
    WITH first_93 AS (
        SELECT id
        FROM public.inventory
        WHERE nom_agent_inventaire = 'NDONG Nell Davy'
          AND DATE(created_at) = '2024-10-29'
          AND agence != 'Espace Conseil'  -- Ne pas toucher celles déjà assignées
        ORDER BY created_at ASC
        LIMIT 93
    )
    UPDATE public.inventory
    SET agence = 'Espace Conseil'
    WHERE id IN (SELECT id FROM first_93);
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    IF updated_count > 0 THEN
        RAISE NOTICE '✓ Espace Conseil (29 oct NDONG - 93 premières) : % entrées', updated_count;
    END IF;

    -- 6. Owendo : 23-29 octobre par NDONG Nell Davy (sauf les 93 du 29 octobre déjà traitées)
    UPDATE public.inventory
    SET agence = 'Owendo'
    WHERE nom_agent_inventaire = 'NDONG Nell Davy'
      AND DATE(created_at) >= '2024-10-23'
      AND DATE(created_at) <= '2024-10-29'
      AND agence IS NULL  -- Seulement celles qui n'ont pas encore été assignées
      AND NOT (
          DATE(created_at) = '2024-10-29' 
          AND id IN (
              SELECT id 
              FROM public.inventory 
              WHERE nom_agent_inventaire = 'NDONG Nell Davy'
                AND DATE(created_at) = '2024-10-29'
              ORDER BY created_at ASC
              LIMIT 93
          )
      );
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    IF updated_count > 0 THEN
        RAISE NOTICE '✓ Owendo (23-29 oct NDONG) : % entrées', updated_count;
    END IF;

    -- ============================================================
    -- ÉTAPE 2 : Règles par défaut pour les entités restantes
    -- SEULEMENT pour les entrées qui n'ont toujours pas d'agence
    -- ============================================================

    -- 7. NDONG Nell Davy (autres dates) -> Owendo par continuité
    UPDATE public.inventory
    SET agence = 'Owendo'
    WHERE nom_agent_inventaire = 'NDONG Nell Davy'
      AND agence IS NULL;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    IF updated_count > 0 THEN
        RAISE NOTICE '→ Owendo (NDONG - autres dates par défaut) : % entrées', updated_count;
    END IF;

    -- 8. OLOLO Jesmiel (autres cas) -> Nzeng-Ayong par continuité
    UPDATE public.inventory
    SET agence = 'Nzeng-Ayong'
    WHERE nom_agent_inventaire = 'OLOLO Jesmiel'
      AND agence IS NULL;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    IF updated_count > 0 THEN
        RAISE NOTICE '→ Nzeng-Ayong (OLOLO Jesmiel - autres dates par défaut) : % entrées', updated_count;
    END IF;

    -- 9. Tous les autres agents -> Espace Conseil par défaut
    UPDATE public.inventory
    SET agence = 'Espace Conseil'
    WHERE agence IS NULL;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    IF updated_count > 0 THEN
        RAISE NOTICE '→ Espace Conseil (autres agents par défaut) : % entrées', updated_count;
    END IF;

    -- ============================================================
    -- RÉSUMÉ FINAL
    -- ============================================================
    RAISE NOTICE '========================================';
    RAISE NOTICE 'RÉSUMÉ PAR AGENCE :';
    
    FOR rule_applied IN 
        SELECT agence || ' : ' || COUNT(*)::TEXT || ' entrées'
        FROM public.inventory
        GROUP BY agence
        ORDER BY COUNT(*) DESC
    LOOP
        RAISE NOTICE '%', rule_applied;
    END LOOP;
    
    RAISE NOTICE '========================================';

END $$;
