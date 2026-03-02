-- Script SQL pour corriger toutes les entrées avec agence NULL
-- À exécuter directement dans Supabase SQL Editor
-- 
-- Ce script :
-- 1. Applique les règles historiques spécifiques (dates et agents)
-- 2. Réassigne correctement les agences même si elles sont déjà à "Espace Conseil"
-- 3. Peut être exécuté plusieurs fois en toute sécurité (idempotent)
-- 4. Utilise TRIM() pour gérer les espaces dans les noms d'agents

DO $$
DECLARE
    total_entries INTEGER;
    total_null_count INTEGER;
    total_espace_conseil INTEGER;
    updated_count INTEGER;
BEGIN
    -- Statistiques initiales
    SELECT COUNT(*) INTO total_entries FROM public.inventory;
    SELECT COUNT(*) INTO total_null_count FROM public.inventory WHERE agence IS NULL;
    SELECT COUNT(*) INTO total_espace_conseil FROM public.inventory WHERE agence = 'Espace Conseil';
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'CORRECTION DES AGENCES';
    RAISE NOTICE 'Total d''entrées : %', total_entries;
    RAISE NOTICE 'Entrées avec agence NULL : %', total_null_count;
    RAISE NOTICE 'Entrées avec Espace Conseil : %', total_espace_conseil;
    RAISE NOTICE '========================================';

    -- ============================================================
    -- CORRECTION SELON LES RÈGLES HISTORIQUES
    -- ============================================================

    -- IMPORTANT : Réinitialiser toutes les agences à NULL pour recommencer proprement
    -- (Uniquement si vous voulez tout recalculer - commentez cette ligne si vous voulez préserver les agences déjà correctes)
    -- UPDATE public.inventory SET agence = NULL WHERE agence = 'Espace Conseil';

    -- 1. PK9 : 23 octobre 2025 par OLOLO (toutes variations)
    UPDATE public.inventory
    SET agence = 'PK9'
    WHERE UPPER(TRIM(nom_agent_inventaire)) LIKE 'OLOLO%'
      AND DATE(created_at) = '2025-10-23'
      AND (agence IS NULL OR agence != 'PK9');  -- Permet de réassigner

    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RAISE NOTICE 'PK9 (23 oct 2025 - OLOLO variations) : % entrées', updated_count;

    -- 2. Okala : 24-29 octobre 2025 par OLOLO (toutes variations)
    UPDATE public.inventory
    SET agence = 'Okala'
    WHERE UPPER(TRIM(nom_agent_inventaire)) LIKE 'OLOLO%'
      AND DATE(created_at) >= '2025-10-24'
      AND DATE(created_at) <= '2025-10-29'
      AND (agence IS NULL OR agence != 'Okala');

    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RAISE NOTICE 'Okala (24-29 oct 2025 - OLOLO variations) : % entrées', updated_count;

    -- 3. Nzeng-Ayong : à partir du 30 octobre 2025 par OLOLO (toutes variations)
    UPDATE public.inventory
    SET agence = 'Nzeng-Ayong'
    WHERE UPPER(TRIM(nom_agent_inventaire)) LIKE 'OLOLO%'
      AND DATE(created_at) >= '2025-10-30'
      AND (agence IS NULL OR agence != 'Nzeng-Ayong');

    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RAISE NOTICE 'Nzeng-Ayong (>= 30 oct 2025 - OLOLO variations) : % entrées', updated_count;

    -- 4. Espace Conseil : avant le 23 octobre 2025 (tous agents) - GARDER cette règle
    UPDATE public.inventory
    SET agence = 'Espace Conseil'
    WHERE DATE(created_at) < '2025-10-23'
      AND (agence IS NULL OR agence != 'Espace Conseil');  -- Ne pas écraser si déjà correct

    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RAISE NOTICE 'Espace Conseil (avant 23 oct 2025 - tous agents) : % entrées', updated_count;

    -- 5. Espace Conseil : 93 premières entrées du 29 octobre 2025 par Ndong (toutes variations)
    -- IMPORTANT : Cette règle doit être appliquée AVANT la règle Owendo pour le 29 octobre
    WITH first_93_ndong_29oct AS (
        SELECT id
        FROM public.inventory
        WHERE (UPPER(TRIM(nom_agent_inventaire)) LIKE '%NDONG%'
           OR UPPER(TRIM(nom_agent_inventaire)) LIKE '%NELL%'
           OR UPPER(TRIM(nom_agent_inventaire)) LIKE '%DAVY%')
          AND DATE(created_at) = '2025-10-29'
          AND (agence IS NULL OR agence = 'Espace Conseil' OR agence = 'Owendo')
        ORDER BY created_at ASC
        LIMIT 93
    )
    UPDATE public.inventory
    SET agence = 'Espace Conseil'
    WHERE id IN (SELECT id FROM first_93_ndong_29oct);

    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RAISE NOTICE 'Espace Conseil (29 oct 2025 - Ndong variations - 93 premières) : % entrées', updated_count;

    -- 6. Owendo : 23-29 octobre 2025 par Ndong (TOUTES, y compris le 29 octobre après les 93 premières)
    UPDATE public.inventory
    SET agence = 'Owendo'
    WHERE (UPPER(TRIM(nom_agent_inventaire)) LIKE '%NDONG%'
       OR UPPER(TRIM(nom_agent_inventaire)) LIKE '%NELL%'
       OR UPPER(TRIM(nom_agent_inventaire)) LIKE '%DAVY%')
      AND DATE(created_at) >= '2025-10-23'
      AND DATE(created_at) <= '2025-10-29'
      AND agence != 'Espace Conseil'  -- Ne pas toucher aux 93 premières du 29 octobre déjà assignées
      AND (agence IS NULL OR agence != 'Owendo');

    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RAISE NOTICE 'Owendo (23-29 oct 2025 - Ndong variations) : % entrées', updated_count;

    -- ============================================================
    -- CORRECTION PAR DÉFAUT POUR LES ENTITÉS RESTANTES
    -- ============================================================

    -- 7. Ndong (autres dates - après le 29 octobre 2025) -> Owendo par continuité
    UPDATE public.inventory
    SET agence = 'Owendo'
    WHERE (UPPER(TRIM(nom_agent_inventaire)) LIKE '%NDONG%'
       OR UPPER(TRIM(nom_agent_inventaire)) LIKE '%NELL%'
       OR UPPER(TRIM(nom_agent_inventaire)) LIKE '%DAVY%')
      AND DATE(created_at) > '2025-10-29'
      AND (agence IS NULL OR agence = 'Espace Conseil');

    GET DIAGNOSTICS updated_count = ROW_COUNT;
    IF updated_count > 0 THEN
        RAISE NOTICE 'Owendo (Ndong variations après 29 oct 2025) : % entrées', updated_count;
    END IF;

    -- 8. OLOLO (dates avant le 23 octobre 2025 ou autres cas) -> Nzeng-Ayong par continuité
    -- Mais seulement si ce n'est pas déjà une date avec une règle spécifique
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
        RAISE NOTICE 'Nzeng-Ayong (OLOLO variations autres cas) : % entrées', updated_count;
    END IF;

    -- 9. Toutes les autres entrées restantes -> Espace Conseil par défaut
    -- UNIQUEMENT celles qui n'ont toujours pas d'agence
    UPDATE public.inventory
    SET agence = 'Espace Conseil'
    WHERE agence IS NULL;

    GET DIAGNOSTICS updated_count = ROW_COUNT;
    IF updated_count > 0 THEN
        RAISE NOTICE 'Espace Conseil (par défaut - autres agents) : % entrées', updated_count;
    END IF;

    -- ============================================================
    -- RÉSUMÉ FINAL
    -- ============================================================
    RAISE NOTICE '========================================';
    RAISE NOTICE 'RÉSUMÉ FINAL PAR AGENCE :';
    
    -- Vérifier qu'il ne reste plus d'entrées NULL
    SELECT COUNT(*) INTO updated_count
    FROM public.inventory
    WHERE agence IS NULL;

    IF updated_count = 0 THEN
        RAISE NOTICE '✓ Toutes les entrées ont maintenant une agence assignée.';
    ELSE
        RAISE WARNING 'ATTENTION : Il reste % entrées avec agence NULL.', updated_count;
    END IF;
    
    RAISE NOTICE '========================================';

END $$;

-- Vérification finale : afficher la répartition par agence
SELECT 
    agence,
    COUNT(*) as nombre_entrees,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as pourcentage
FROM public.inventory
GROUP BY agence
ORDER BY nombre_entrees DESC;
