-- Migration de correction complète pour mettre à jour toutes les entrées avec agence NULL
-- Cette migration peut être exécutée plusieurs fois en toute sécurité (idempotente)
-- Elle gère tous les cas, y compris les entrées sans agent ou avec des dates en dehors des plages historiques

DO $$
DECLARE
    total_null_count INTEGER;
    updated_count INTEGER;
    final_null_count INTEGER;
BEGIN
    -- Compter le nombre d'entrées avec agence NULL
    SELECT COUNT(*) INTO total_null_count
    FROM public.inventory
    WHERE agence IS NULL;

    RAISE NOTICE '========================================';
    RAISE NOTICE 'Correction des entrées avec agence NULL';
    RAISE NOTICE 'Nombre initial d''entrées avec agence NULL : %', total_null_count;
    RAISE NOTICE '========================================';

    -- Si aucune entrée n'a besoin d'être mise à jour, on sort
    IF total_null_count = 0 THEN
        RAISE NOTICE '✓ Aucune entrée à mettre à jour. Toutes les entrées ont déjà une agence.';
        RETURN;
    END IF;

    -- ============================================================
    -- RÈGLES SPÉCIFIQUES PAR AGENT ET DATE (règles historiques)
    -- ============================================================

    -- 1. Agence PK9 : Toutes les entrées du 23 octobre par OLOLO Jesmiel
    UPDATE public.inventory
    SET agence = 'PK9'
    WHERE nom_agent_inventaire = 'OLOLO Jesmiel'
      AND DATE(created_at) = '2024-10-23'
      AND agence IS NULL;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    IF updated_count > 0 THEN
        RAISE NOTICE '✓ PK9 (23 oct OLOLO Jesmiel) : % entrées mises à jour', updated_count;
    END IF;

    -- 2. Agence OKALA : Toutes les entrées du 24 au 29 octobre par OLOLO Jesmiel
    UPDATE public.inventory
    SET agence = 'Okala'
    WHERE nom_agent_inventaire = 'OLOLO Jesmiel'
      AND DATE(created_at) >= '2024-10-24'
      AND DATE(created_at) <= '2024-10-29'
      AND agence IS NULL;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    IF updated_count > 0 THEN
        RAISE NOTICE '✓ Okala (24-29 oct OLOLO Jesmiel) : % entrées mises à jour', updated_count;
    END IF;

    -- 3. Agence Nzeng-Ayong : Toutes les entrées à partir du 30 octobre par OLOLO Jesmiel
    UPDATE public.inventory
    SET agence = 'Nzeng-Ayong'
    WHERE nom_agent_inventaire = 'OLOLO Jesmiel'
      AND DATE(created_at) >= '2024-10-30'
      AND agence IS NULL;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    IF updated_count > 0 THEN
        RAISE NOTICE '✓ Nzeng-Ayong (>= 30 oct OLOLO Jesmiel) : % entrées mises à jour', updated_count;
    END IF;

    -- 4. Espace Conseil : Toutes les entrées avant le 23 octobre par tous les agents
    UPDATE public.inventory
    SET agence = 'Espace Conseil'
    WHERE DATE(created_at) < '2024-10-23'
      AND agence IS NULL;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    IF updated_count > 0 THEN
        RAISE NOTICE '✓ Espace Conseil (avant 23 oct - tous agents) : % entrées mises à jour', updated_count;
    END IF;

    -- 5. Espace Conseil : Les 93 premières entrées du 29 octobre par NDONG Nell Davy
    WITH ranked_entries AS (
        SELECT id
        FROM public.inventory
        WHERE nom_agent_inventaire = 'NDONG Nell Davy'
          AND DATE(created_at) = '2024-10-29'
          AND agence IS NULL
        ORDER BY created_at ASC
        LIMIT 93
    )
    UPDATE public.inventory
    SET agence = 'Espace Conseil'
    WHERE id IN (SELECT id FROM ranked_entries);
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    IF updated_count > 0 THEN
        RAISE NOTICE '✓ Espace Conseil (29 oct NDONG - 93 premières) : % entrées mises à jour', updated_count;
    END IF;

    -- 6. Agence OWENDO : Toutes les entrées du 23 au 29 octobre par NDONG Nell Davy
    -- (celles qui restent après avoir traité les 93 premières du 29 octobre)
    UPDATE public.inventory
    SET agence = 'Owendo'
    WHERE nom_agent_inventaire = 'NDONG Nell Davy'
      AND DATE(created_at) >= '2024-10-23'
      AND DATE(created_at) <= '2024-10-29'
      AND agence IS NULL;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    IF updated_count > 0 THEN
        RAISE NOTICE '✓ Owendo (23-29 oct NDONG) : % entrées mises à jour', updated_count;
    END IF;

    -- ============================================================
    -- RÈGLES PAR DÉFAUT POUR LES ENTITÉS RESTANTES
    -- ============================================================

    -- 7. Pour toutes les autres entrées de NDONG Nell Davy (après le 29 octobre), 
    -- assigner à Owendo par défaut (continuité logique)
    UPDATE public.inventory
    SET agence = 'Owendo'
    WHERE nom_agent_inventaire = 'NDONG Nell Davy'
      AND agence IS NULL;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    IF updated_count > 0 THEN
        RAISE NOTICE '✓ Owendo (NDONG - autres dates) : % entrées mises à jour', updated_count;
    END IF;

    -- 8. Pour toutes les autres entrées de OLOLO Jesmiel qui restent, 
    -- assigner à Nzeng-Ayong (continuité logique - c'est sa dernière agence)
    UPDATE public.inventory
    SET agence = 'Nzeng-Ayong'
    WHERE nom_agent_inventaire = 'OLOLO Jesmiel'
      AND agence IS NULL;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    IF updated_count > 0 THEN
        RAISE NOTICE '✓ Nzeng-Ayong (OLOLO Jesmiel - autres dates) : % entrées mises à jour', updated_count;
    END IF;

    -- 9. Pour toutes les autres entrées restantes (autres agents ou sans agent),
    -- assigner à "Espace Conseil" par défaut
    UPDATE public.inventory
    SET agence = 'Espace Conseil'
    WHERE agence IS NULL;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    IF updated_count > 0 THEN
        RAISE NOTICE '✓ Espace Conseil (par défaut - autres cas) : % entrées mises à jour', updated_count;
    END IF;

    -- ============================================================
    -- VÉRIFICATION FINALE
    -- ============================================================
    
    SELECT COUNT(*) INTO final_null_count
    FROM public.inventory
    WHERE agence IS NULL;

    RAISE NOTICE '========================================';
    IF final_null_count = 0 THEN
        RAISE NOTICE '✓ SUCCÈS : Toutes les entrées ont maintenant une agence assignée.';
    ELSE
        RAISE WARNING 'ATTENTION : Il reste % entrées avec agence NULL après traitement.', final_null_count;
    END IF;
    RAISE NOTICE '========================================';

END $$;
