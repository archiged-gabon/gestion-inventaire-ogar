-- Script de correction adapté aux dates réelles dans la base
-- À exécuter APRÈS avoir identifié les dates réelles avec diagnostic_dates_reelles.sql
-- 
-- MODIFIER LES DATES CI-DESSOUS selon les résultats du diagnostic

DO $$
DECLARE
    updated_count INTEGER;
    date_23_oct DATE;
    date_24_oct DATE;
    date_29_oct DATE;
    date_30_oct DATE;
    total_entries INTEGER;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'CORRECTION AVEC DATES RÉELLES';
    RAISE NOTICE '========================================';
    RAISE NOTICE '⚠️ IMPORTANT : Modifiez les dates ci-dessous selon vos données réelles';
    RAISE NOTICE '';

    -- ============================================================
    -- CONFIGURATION DES DATES
    -- À MODIFIER selon les résultats du diagnostic_dates_reelles.sql
    -- ============================================================
    
    -- Détection automatique de l'année la plus récente pour octobre
    SELECT 
        DATE_TRUNC('year', MAX(created_at))::DATE + INTERVAL '9 months' + INTERVAL '22 days'
    INTO date_23_oct
    FROM public.inventory
    WHERE EXTRACT(MONTH FROM created_at) = 10;
    
    -- Si aucune entrée en octobre, utiliser l'année la plus récente
    IF date_23_oct IS NULL THEN
        SELECT 
            DATE_TRUNC('year', MAX(created_at))::DATE + INTERVAL '9 months' + INTERVAL '22 days'
        INTO date_23_oct
        FROM public.inventory;
    END IF;
    
    -- Ou définir manuellement (décommentez et modifiez si nécessaire) :
    -- date_23_oct := '2025-10-23';  -- Utilisez 2025 selon vos données
    
    date_24_oct := date_23_oct + INTERVAL '1 day';
    date_29_oct := date_23_oct + INTERVAL '6 days';
    date_30_oct := date_23_oct + INTERVAL '7 days';

    RAISE NOTICE 'Dates utilisées :';
    RAISE NOTICE '  - 23 octobre : %', date_23_oct;
    RAISE NOTICE '  - 24 octobre : %', date_24_oct;
    RAISE NOTICE '  - 29 octobre : %', date_29_oct;
    RAISE NOTICE '  - 30 octobre : %', date_30_oct;
    RAISE NOTICE '========================================';

    -- ============================================================
    -- 1. PK9 : 23 octobre par OLOLO
    -- ============================================================
    SELECT COUNT(*) INTO total_entries
    FROM public.inventory
    WHERE UPPER(TRIM(nom_agent_inventaire)) LIKE 'OLOLO%'
      AND DATE(created_at) = date_23_oct;

    IF total_entries > 0 THEN
        UPDATE public.inventory
        SET agence = 'PK9'
        WHERE UPPER(TRIM(nom_agent_inventaire)) LIKE 'OLOLO%'
          AND DATE(created_at) = date_23_oct
          AND agence != 'PK9';

        GET DIAGNOSTICS updated_count = ROW_COUNT;
        RAISE NOTICE '✓ PK9 (% - OLOLO) : % entrées corrigées sur % total', date_23_oct, updated_count, total_entries;
    ELSE
        RAISE NOTICE '⚠ Aucune entrée trouvée pour PK9 (% - OLOLO)', date_23_oct;
    END IF;

    -- ============================================================
    -- 2. OKALA : 24-29 octobre par OLOLO
    -- ============================================================
    SELECT COUNT(*) INTO total_entries
    FROM public.inventory
    WHERE UPPER(TRIM(nom_agent_inventaire)) LIKE 'OLOLO%'
      AND DATE(created_at) >= date_24_oct
      AND DATE(created_at) <= date_29_oct;

    IF total_entries > 0 THEN
        UPDATE public.inventory
        SET agence = 'Okala'
        WHERE UPPER(TRIM(nom_agent_inventaire)) LIKE 'OLOLO%'
          AND DATE(created_at) >= date_24_oct
          AND DATE(created_at) <= date_29_oct
          AND agence != 'Okala';

        GET DIAGNOSTICS updated_count = ROW_COUNT;
        RAISE NOTICE '✓ Okala (% à % - OLOLO) : % entrées corrigées sur % total', date_24_oct, date_29_oct, updated_count, total_entries;
    ELSE
        RAISE NOTICE '⚠ Aucune entrée trouvée pour Okala (% à % - OLOLO)', date_24_oct, date_29_oct;
    END IF;

    -- ============================================================
    -- 3. NZENG-AYONG : >= 30 octobre par OLOLO
    -- ============================================================
    SELECT COUNT(*) INTO total_entries
    FROM public.inventory
    WHERE UPPER(TRIM(nom_agent_inventaire)) LIKE 'OLOLO%'
      AND DATE(created_at) >= date_30_oct;

    IF total_entries > 0 THEN
        UPDATE public.inventory
        SET agence = 'Nzeng-Ayong'
        WHERE UPPER(TRIM(nom_agent_inventaire)) LIKE 'OLOLO%'
          AND DATE(created_at) >= date_30_oct
          AND agence != 'Nzeng-Ayong';

        GET DIAGNOSTICS updated_count = ROW_COUNT;
        RAISE NOTICE '✓ Nzeng-Ayong (>= % - OLOLO) : % entrées corrigées sur % total', date_30_oct, updated_count, total_entries;
    ELSE
        RAISE NOTICE '⚠ Aucune entrée trouvée pour Nzeng-Ayong (>= % - OLOLO)', date_30_oct;
    END IF;

    -- ============================================================
    -- 4. OWENDO : 23-29 octobre par Ndong (avec 93 premières du 29 oct à Espace Conseil)
    -- ============================================================
    -- D'abord les 93 premières du 29 octobre
    WITH first_93_ndong_29oct AS (
        SELECT id
        FROM public.inventory
        WHERE (UPPER(TRIM(nom_agent_inventaire)) LIKE '%NDONG%'
           OR UPPER(TRIM(nom_agent_inventaire)) LIKE '%NELL%'
           OR UPPER(TRIM(nom_agent_inventaire)) LIKE '%DAVY%')
          AND DATE(created_at) = date_29_oct
          AND (agence IS NULL OR agence IN ('Owendo', 'Espace Conseil'))
        ORDER BY created_at ASC
        LIMIT 93
    )
    UPDATE public.inventory
    SET agence = 'Espace Conseil'
    WHERE id IN (SELECT id FROM first_93_ndong_29oct);

    GET DIAGNOSTICS updated_count = ROW_COUNT;
    IF updated_count > 0 THEN
        RAISE NOTICE '✓ Espace Conseil (% - Ndong - 93 premières) : % entrées', date_29_oct, updated_count;
    END IF;

    -- Ensuite le reste pour Owendo
    SELECT COUNT(*) INTO total_entries
    FROM public.inventory
    WHERE (UPPER(TRIM(nom_agent_inventaire)) LIKE '%NDONG%'
       OR UPPER(TRIM(nom_agent_inventaire)) LIKE '%NELL%'
       OR UPPER(TRIM(nom_agent_inventaire)) LIKE '%DAVY%')
      AND DATE(created_at) >= date_23_oct
      AND DATE(created_at) <= date_29_oct;

    IF total_entries > 0 THEN
        UPDATE public.inventory
        SET agence = 'Owendo'
        WHERE (UPPER(TRIM(nom_agent_inventaire)) LIKE '%NDONG%'
           OR UPPER(TRIM(nom_agent_inventaire)) LIKE '%NELL%'
           OR UPPER(TRIM(nom_agent_inventaire)) LIKE '%DAVY%')
          AND DATE(created_at) >= date_23_oct
          AND DATE(created_at) <= date_29_oct
          AND agence != 'Espace Conseil'
          AND agence != 'Owendo';

        GET DIAGNOSTICS updated_count = ROW_COUNT;
        RAISE NOTICE '✓ Owendo (% à % - Ndong) : % entrées corrigées sur % total', date_23_oct, date_29_oct, updated_count, total_entries;
    END IF;

    -- ============================================================
    -- RÉSUMÉ FINAL
    -- ============================================================
    RAISE NOTICE '========================================';
    RAISE NOTICE 'RÉSUMÉ FINAL :';
    
    SELECT COUNT(*) INTO updated_count FROM public.inventory WHERE agence = 'PK9';
    RAISE NOTICE 'Total PK9 : %', updated_count;
    
    SELECT COUNT(*) INTO updated_count FROM public.inventory WHERE agence = 'Okala';
    RAISE NOTICE 'Total Okala : %', updated_count;
    
    SELECT COUNT(*) INTO updated_count FROM public.inventory WHERE agence = 'Nzeng-Ayong';
    RAISE NOTICE 'Total Nzeng-Ayong : %', updated_count;
    
    SELECT COUNT(*) INTO updated_count FROM public.inventory WHERE agence = 'Owendo';
    RAISE NOTICE 'Total Owendo : %', updated_count;
    
    SELECT COUNT(*) INTO updated_count FROM public.inventory WHERE agence = 'Espace Conseil';
    RAISE NOTICE 'Total Espace Conseil : %', updated_count;
    
    RAISE NOTICE '========================================';

END $$;

-- Afficher la nouvelle répartition
SELECT 
    agence,
    COUNT(*) as nombre_dossiers,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) || '%' as pourcentage
FROM public.inventory
WHERE agence IS NOT NULL
GROUP BY agence
ORDER BY nombre_dossiers DESC;
