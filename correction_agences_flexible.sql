-- Script de correction avec correspondance flexible des noms d'agents
-- Utilise des patterns pour détecter les variations de noms
-- (au moins 2 prénoms/noms identiques pour considérer le même agent)

DO $$
DECLARE
    updated_count INTEGER;
    total_before INTEGER;
    total_after INTEGER;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'CORRECTION AVEC CORRESPONDANCE FLEXIBLE';
    RAISE NOTICE '========================================';

    -- Compter avant correction
    SELECT COUNT(*) INTO total_before FROM public.inventory;

    -- ============================================================
    -- CORRECTION POUR OLOLO (toutes variations)
    -- ============================================================

    -- 1. PK9 : 23 octobre par OLOLO (toute variation commençant par OLOLO)
    UPDATE public.inventory
    SET agence = 'PK9'
    WHERE UPPER(TRIM(nom_agent_inventaire)) LIKE 'OLOLO%'
      AND DATE(created_at) = '2024-10-23'
      AND (agence IS NULL OR agence != 'PK9');

    GET DIAGNOSTICS updated_count = ROW_COUNT;
    IF updated_count > 0 THEN
        RAISE NOTICE '✓ PK9 (23 oct - OLOLO variations) : % entrées corrigées', updated_count;
    END IF;

    -- 2. Okala : 24-29 octobre par OLOLO (toutes variations)
    UPDATE public.inventory
    SET agence = 'Okala'
    WHERE UPPER(TRIM(nom_agent_inventaire)) LIKE 'OLOLO%'
      AND DATE(created_at) >= '2024-10-24'
      AND DATE(created_at) <= '2024-10-29'
      AND (agence IS NULL OR agence != 'Okala');

    GET DIAGNOSTICS updated_count = ROW_COUNT;
    IF updated_count > 0 THEN
        RAISE NOTICE '✓ Okala (24-29 oct - OLOLO variations) : % entrées corrigées', updated_count;
    END IF;

    -- 3. Nzeng-Ayong : >= 30 octobre par OLOLO (toutes variations)
    UPDATE public.inventory
    SET agence = 'Nzeng-Ayong'
    WHERE UPPER(TRIM(nom_agent_inventaire)) LIKE 'OLOLO%'
      AND DATE(created_at) >= '2024-10-30'
      AND (agence IS NULL OR agence != 'Nzeng-Ayong');

    GET DIAGNOSTICS updated_count = ROW_COUNT;
    IF updated_count > 0 THEN
        RAISE NOTICE '✓ Nzeng-Ayong (>= 30 oct - OLOLO variations) : % entrées corrigées', updated_count;
    END IF;

    -- ============================================================
    -- CORRECTION POUR NDONG (toutes variations)
    -- ============================================================

    -- 4. Espace Conseil : avant le 23 octobre (tous agents)
    UPDATE public.inventory
    SET agence = 'Espace Conseil'
    WHERE DATE(created_at) < '2024-10-23'
      AND (agence IS NULL OR agence != 'Espace Conseil');

    GET DIAGNOSTICS updated_count = ROW_COUNT;
    IF updated_count > 0 THEN
        RAISE NOTICE '✓ Espace Conseil (avant 23 oct - tous agents) : % entrées corrigées', updated_count;
    END IF;

    -- 5. Espace Conseil : 93 premières entrées du 29 octobre par Ndong (toutes variations)
    -- IMPORTANT : Cette règle doit être appliquée AVANT la règle Owendo
    WITH first_93_ndong_29oct AS (
        SELECT id
        FROM public.inventory
        WHERE (UPPER(TRIM(nom_agent_inventaire)) LIKE '%NDONG%'
           OR UPPER(TRIM(nom_agent_inventaire)) LIKE '%NELL%'
           OR UPPER(TRIM(nom_agent_inventaire)) LIKE '%DAVY%')
          AND DATE(created_at) = '2024-10-29'
          AND (agence IS NULL OR agence IN ('Owendo', 'Espace Conseil'))
        ORDER BY created_at ASC
        LIMIT 93
    )
    UPDATE public.inventory
    SET agence = 'Espace Conseil'
    WHERE id IN (SELECT id FROM first_93_ndong_29oct);

    GET DIAGNOSTICS updated_count = ROW_COUNT;
    IF updated_count > 0 THEN
        RAISE NOTICE '✓ Espace Conseil (29 oct - Ndong variations - 93 premières) : % entrées corrigées', updated_count;
    END IF;

    -- 6. Owendo : 23-29 octobre par Ndong (toutes variations)
    -- Sauf les 93 premières du 29 octobre déjà assignées à Espace Conseil
    UPDATE public.inventory
    SET agence = 'Owendo'
    WHERE (UPPER(TRIM(nom_agent_inventaire)) LIKE '%NDONG%'
       OR UPPER(TRIM(nom_agent_inventaire)) LIKE '%NELL%'
       OR UPPER(TRIM(nom_agent_inventaire)) LIKE '%DAVY%')
      AND DATE(created_at) >= '2024-10-23'
      AND DATE(created_at) <= '2024-10-29'
      AND agence != 'Espace Conseil'  -- Ne pas toucher aux 93 premières
      AND (agence IS NULL OR agence != 'Owendo');

    GET DIAGNOSTICS updated_count = ROW_COUNT;
    IF updated_count > 0 THEN
        RAISE NOTICE '✓ Owendo (23-29 oct - Ndong variations) : % entrées corrigées', updated_count;
    END IF;

    -- 7. Owendo : Ndong (toutes variations) après le 29 octobre
    UPDATE public.inventory
    SET agence = 'Owendo'
    WHERE (UPPER(TRIM(nom_agent_inventaire)) LIKE '%NDONG%'
       OR UPPER(TRIM(nom_agent_inventaire)) LIKE '%NELL%'
       OR UPPER(TRIM(nom_agent_inventaire)) LIKE '%DAVY%')
      AND DATE(created_at) > '2024-10-29'
      AND (agence IS NULL OR agence != 'Owendo');

    GET DIAGNOSTICS updated_count = ROW_COUNT;
    IF updated_count > 0 THEN
        RAISE NOTICE '✓ Owendo (après 29 oct - Ndong variations) : % entrées corrigées', updated_count;
    END IF;

    -- 8. Nzeng-Ayong : OLOLO (toutes variations) autres dates (par continuité)
    UPDATE public.inventory
    SET agence = 'Nzeng-Ayong'
    WHERE UPPER(TRIM(nom_agent_inventaire)) LIKE 'OLOLO%'
      AND (agence IS NULL OR agence = 'Espace Conseil')
      AND NOT (
          DATE(created_at) = '2024-10-23' OR
          (DATE(created_at) >= '2024-10-24' AND DATE(created_at) <= '2024-10-29') OR
          DATE(created_at) >= '2024-10-30'
      );

    GET DIAGNOSTICS updated_count = ROW_COUNT;
    IF updated_count > 0 THEN
        RAISE NOTICE '→ Nzeng-Ayong (OLOLO variations - autres dates) : % entrées corrigées', updated_count;
    END IF;

    -- 9. Espace Conseil : Toutes les autres entrées restantes
    UPDATE public.inventory
    SET agence = 'Espace Conseil'
    WHERE agence IS NULL;

    GET DIAGNOSTICS updated_count = ROW_COUNT;
    IF updated_count > 0 THEN
        RAISE NOTICE '→ Espace Conseil (par défaut) : % entrées corrigées', updated_count;
    END IF;

    -- Compter après correction
    SELECT COUNT(*) INTO total_after FROM public.inventory;

    -- Résumé final
    RAISE NOTICE '========================================';
    RAISE NOTICE 'RÉSUMÉ :';
    RAISE NOTICE 'Total d''entrées : %', total_after;
    
    -- Afficher la répartition par agence
    FOR updated_count IN 
        SELECT COUNT(*) 
        FROM public.inventory 
        GROUP BY agence
        ORDER BY COUNT(*) DESC
    LOOP
        -- Cette boucle compte les groupes, pas très utile
        NULL;
    END LOOP;
    
    RAISE NOTICE '========================================';

END $$;

-- Afficher la répartition finale par agence
SELECT 
    agence,
    COUNT(*) as nombre_entrees,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as pourcentage
FROM public.inventory
GROUP BY agence
ORDER BY nombre_entrees DESC;
