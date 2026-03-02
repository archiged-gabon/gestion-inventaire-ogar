-- Script de correction spécifique pour assigner Okala et PK9
-- À utiliser après avoir identifié les entrées concernées avec diagnostic_comparaison_agences.sql

DO $$
DECLARE
    updated_count INTEGER;
    total_entries INTEGER;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'CORRECTION OKALA ET PK9';
    RAISE NOTICE '========================================';

    -- ============================================================
    -- 1. PK9 : 23 octobre par OLOLO (toutes variations)
    -- ============================================================
    SELECT COUNT(*) INTO total_entries
    FROM public.inventory
    WHERE UPPER(TRIM(nom_agent_inventaire)) LIKE 'OLOLO%'
      AND DATE(created_at) = '2024-10-23';

    IF total_entries > 0 THEN
        UPDATE public.inventory
        SET agence = 'PK9'
        WHERE UPPER(TRIM(nom_agent_inventaire)) LIKE 'OLOLO%'
          AND DATE(created_at) = '2024-10-23'
          AND agence != 'PK9';

        GET DIAGNOSTICS updated_count = ROW_COUNT;
        RAISE NOTICE '✓ PK9 (23 oct - OLOLO) : % entrées corrigées sur % total', updated_count, total_entries;
    ELSE
        RAISE NOTICE '⚠ Aucune entrée trouvée pour PK9 (23 oct - OLOLO)';
    END IF;

    -- ============================================================
    -- 2. OKALA : 24-29 octobre par OLOLO (toutes variations)
    -- ============================================================
    SELECT COUNT(*) INTO total_entries
    FROM public.inventory
    WHERE UPPER(TRIM(nom_agent_inventaire)) LIKE 'OLOLO%'
      AND DATE(created_at) >= '2024-10-24'
      AND DATE(created_at) <= '2024-10-29';

    IF total_entries > 0 THEN
        UPDATE public.inventory
        SET agence = 'Okala'
        WHERE UPPER(TRIM(nom_agent_inventaire)) LIKE 'OLOLO%'
          AND DATE(created_at) >= '2024-10-24'
          AND DATE(created_at) <= '2024-10-29'
          AND agence != 'Okala';

        GET DIAGNOSTICS updated_count = ROW_COUNT;
        RAISE NOTICE '✓ Okala (24-29 oct - OLOLO) : % entrées corrigées sur % total', updated_count, total_entries;
    ELSE
        RAISE NOTICE '⚠ Aucune entrée trouvée pour Okala (24-29 oct - OLOLO)';
    END IF;

    -- ============================================================
    -- VÉRIFICATION FINALE
    -- ============================================================
    RAISE NOTICE '========================================';
    RAISE NOTICE 'VÉRIFICATION FINALE :';
    
    SELECT COUNT(*) INTO updated_count
    FROM public.inventory
    WHERE agence = 'PK9';
    RAISE NOTICE 'Total entrées PK9 : %', updated_count;
    
    SELECT COUNT(*) INTO updated_count
    FROM public.inventory
    WHERE agence = 'Okala';
    RAISE NOTICE 'Total entrées Okala : %', updated_count;
    
    RAISE NOTICE '========================================';

END $$;

-- Afficher la nouvelle répartition
SELECT 
    agence,
    COUNT(*) as nombre_dossiers,
    COUNT(DISTINCT TRIM(nom_agent_inventaire)) as nombre_agents,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) || '%' as pourcentage
FROM public.inventory
WHERE agence IS NOT NULL
GROUP BY agence
ORDER BY nombre_dossiers DESC;
