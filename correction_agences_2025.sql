-- Script de correction avec les dates de 2025
-- Les règles historiques s'appliquent en octobre 2025

DO $$
DECLARE
    updated_count INTEGER;
    total_entries INTEGER;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'CORRECTION AGENCES - OCTOBRE 2025';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Dates utilisées : 23, 24-29, 30+ octobre 2025';
    RAISE NOTICE '========================================';

    -- ============================================================
    -- 1. PK9 : 23 octobre 2025 par OLOLO
    -- ============================================================
    SELECT COUNT(*) INTO total_entries
    FROM public.inventory
    WHERE UPPER(TRIM(nom_agent_inventaire)) LIKE 'OLOLO%'
      AND DATE(created_at) = '2025-10-23';

    IF total_entries > 0 THEN
        UPDATE public.inventory
        SET agence = 'PK9'
        WHERE UPPER(TRIM(nom_agent_inventaire)) LIKE 'OLOLO%'
          AND DATE(created_at) = '2025-10-23'
          AND agence != 'PK9';

        GET DIAGNOSTICS updated_count = ROW_COUNT;
        RAISE NOTICE '✓ PK9 (23 oct 2025 - OLOLO) : % entrées corrigées sur % total', updated_count, total_entries;
    ELSE
        RAISE NOTICE '⚠ Aucune entrée trouvée pour PK9 (23 oct 2025 - OLOLO)';
    END IF;

    -- ============================================================
    -- 2. OKALA : 24-29 octobre 2025 par OLOLO
    -- ============================================================
    SELECT COUNT(*) INTO total_entries
    FROM public.inventory
    WHERE UPPER(TRIM(nom_agent_inventaire)) LIKE 'OLOLO%'
      AND DATE(created_at) >= '2025-10-24'
      AND DATE(created_at) <= '2025-10-29';

    IF total_entries > 0 THEN
        UPDATE public.inventory
        SET agence = 'Okala'
        WHERE UPPER(TRIM(nom_agent_inventaire)) LIKE 'OLOLO%'
          AND DATE(created_at) >= '2025-10-24'
          AND DATE(created_at) <= '2025-10-29'
          AND agence != 'Okala';

        GET DIAGNOSTICS updated_count = ROW_COUNT;
        RAISE NOTICE '✓ Okala (24-29 oct 2025 - OLOLO) : % entrées corrigées sur % total', updated_count, total_entries;
    ELSE
        RAISE NOTICE '⚠ Aucune entrée trouvée pour Okala (24-29 oct 2025 - OLOLO)';
    END IF;

    -- ============================================================
    -- 3. NZENG-AYONG : >= 30 octobre 2025 par OLOLO
    -- ============================================================
    SELECT COUNT(*) INTO total_entries
    FROM public.inventory
    WHERE UPPER(TRIM(nom_agent_inventaire)) LIKE 'OLOLO%'
      AND DATE(created_at) >= '2025-10-30';

    IF total_entries > 0 THEN
        UPDATE public.inventory
        SET agence = 'Nzeng-Ayong'
        WHERE UPPER(TRIM(nom_agent_inventaire)) LIKE 'OLOLO%'
          AND DATE(created_at) >= '2025-10-30'
          AND agence != 'Nzeng-Ayong';

        GET DIAGNOSTICS updated_count = ROW_COUNT;
        RAISE NOTICE '✓ Nzeng-Ayong (>= 30 oct 2025 - OLOLO) : % entrées corrigées sur % total', updated_count, total_entries;
    ELSE
        RAISE NOTICE '⚠ Aucune entrée trouvée pour Nzeng-Ayong (>= 30 oct 2025 - OLOLO)';
    END IF;

    -- ============================================================
    -- 4. ESPACE CONSEIL : Avant le 23 octobre 2025 (tous agents)
    -- ============================================================
    SELECT COUNT(*) INTO total_entries
    FROM public.inventory
    WHERE DATE(created_at) < '2025-10-23';

    IF total_entries > 0 THEN
        UPDATE public.inventory
        SET agence = 'Espace Conseil'
        WHERE DATE(created_at) < '2025-10-23'
          AND (agence IS NULL OR agence != 'Espace Conseil');

        GET DIAGNOSTICS updated_count = ROW_COUNT;
        RAISE NOTICE '✓ Espace Conseil (avant 23 oct 2025) : % entrées corrigées sur % total', updated_count, total_entries;
    END IF;

    -- ============================================================
    -- 5. ESPACE CONSEIL : 93 premières entrées du 29 octobre 2025 par Ndong
    -- ============================================================
    WITH first_93_ndong_29oct AS (
        SELECT id
        FROM public.inventory
        WHERE (UPPER(TRIM(nom_agent_inventaire)) LIKE '%NDONG%'
           OR UPPER(TRIM(nom_agent_inventaire)) LIKE '%NELL%'
           OR UPPER(TRIM(nom_agent_inventaire)) LIKE '%DAVY%')
          AND DATE(created_at) = '2025-10-29'
          AND (agence IS NULL OR agence IN ('Owendo', 'Espace Conseil'))
        ORDER BY created_at ASC
        LIMIT 93
    )
    UPDATE public.inventory
    SET agence = 'Espace Conseil'
    WHERE id IN (SELECT id FROM first_93_ndong_29oct);

    GET DIAGNOSTICS updated_count = ROW_COUNT;
    IF updated_count > 0 THEN
        RAISE NOTICE '✓ Espace Conseil (29 oct 2025 - Ndong - 93 premières) : % entrées', updated_count;
    END IF;

    -- ============================================================
    -- 6. OWENDO : 23-29 octobre 2025 par Ndong (sauf 93 premières du 29 oct)
    -- ============================================================
    SELECT COUNT(*) INTO total_entries
    FROM public.inventory
    WHERE (UPPER(TRIM(nom_agent_inventaire)) LIKE '%NDONG%'
       OR UPPER(TRIM(nom_agent_inventaire)) LIKE '%NELL%'
       OR UPPER(TRIM(nom_agent_inventaire)) LIKE '%DAVY%')
      AND DATE(created_at) >= '2025-10-23'
      AND DATE(created_at) <= '2025-10-29';

    IF total_entries > 0 THEN
        UPDATE public.inventory
        SET agence = 'Owendo'
        WHERE (UPPER(TRIM(nom_agent_inventaire)) LIKE '%NDONG%'
           OR UPPER(TRIM(nom_agent_inventaire)) LIKE '%NELL%'
           OR UPPER(TRIM(nom_agent_inventaire)) LIKE '%DAVY%')
          AND DATE(created_at) >= '2025-10-23'
          AND DATE(created_at) <= '2025-10-29'
          AND agence != 'Espace Conseil'
          AND (agence IS NULL OR agence != 'Owendo');

        GET DIAGNOSTICS updated_count = ROW_COUNT;
        RAISE NOTICE '✓ Owendo (23-29 oct 2025 - Ndong) : % entrées corrigées sur % total', updated_count, total_entries;
    END IF;

    -- ============================================================
    -- 7. OWENDO : Ndong après le 29 octobre 2025
    -- ============================================================
    SELECT COUNT(*) INTO total_entries
    FROM public.inventory
    WHERE (UPPER(TRIM(nom_agent_inventaire)) LIKE '%NDONG%'
       OR UPPER(TRIM(nom_agent_inventaire)) LIKE '%NELL%'
       OR UPPER(TRIM(nom_agent_inventaire)) LIKE '%DAVY%')
      AND DATE(created_at) > '2025-10-29';

    IF total_entries > 0 THEN
        UPDATE public.inventory
        SET agence = 'Owendo'
        WHERE (UPPER(TRIM(nom_agent_inventaire)) LIKE '%NDONG%'
           OR UPPER(TRIM(nom_agent_inventaire)) LIKE '%NELL%'
           OR UPPER(TRIM(nom_agent_inventaire)) LIKE '%DAVY%')
          AND DATE(created_at) > '2025-10-29'
          AND (agence IS NULL OR agence != 'Owendo');

        GET DIAGNOSTICS updated_count = ROW_COUNT;
        RAISE NOTICE '✓ Owendo (après 29 oct 2025 - Ndong) : % entrées corrigées sur % total', updated_count, total_entries;
    END IF;

    -- ============================================================
    -- 8. NZENG-AYONG : OLOLO autres dates (par continuité)
    -- ============================================================
    UPDATE public.inventory
    SET agence = 'Nzeng-Ayong'
    WHERE UPPER(TRIM(nom_agent_inventaire)) LIKE 'OLOLO%'
      AND (agence IS NULL OR agence = 'Espace Conseil')
      AND NOT (
          DATE(created_at) = '2025-10-23' OR
          (DATE(created_at) >= '2025-10-24' AND DATE(created_at) <= '2025-10-29') OR
          DATE(created_at) >= '2025-10-30'
      );

    GET DIAGNOSTICS updated_count = ROW_COUNT;
    IF updated_count > 0 THEN
        RAISE NOTICE '→ Nzeng-Ayong (OLOLO - autres dates) : % entrées', updated_count;
    END IF;

    -- ============================================================
    -- RÉSUMÉ FINAL
    -- ============================================================
    RAISE NOTICE '========================================';
    RAISE NOTICE 'RÉSUMÉ FINAL PAR AGENCE :';
    
    FOR updated_count IN 
        SELECT COUNT(*) 
        FROM public.inventory 
        GROUP BY agence
        ORDER BY COUNT(*) DESC
    LOOP
        NULL;
    END LOOP;
    
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
