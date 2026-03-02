-- Migration de correction pour mettre à jour toutes les entrées avec agence NULL
-- Cette migration peut être exécutée plusieurs fois en toute sécurité (idempotente)

DO $$
DECLARE
    total_null_count INTEGER;
    updated_count INTEGER;
BEGIN
    -- Compter le nombre d'entrées avec agence NULL
    SELECT COUNT(*) INTO total_null_count
    FROM public.inventory
    WHERE agence IS NULL;

    RAISE NOTICE 'Nombre d''entrées avec agence NULL : %', total_null_count;

    -- Si aucune entrée n'a besoin d'être mise à jour, on sort
    IF total_null_count = 0 THEN
        RAISE NOTICE 'Aucune entrée à mettre à jour.';
        RETURN;
    END IF;

    -- 1. Agence PK9 : Toutes les entrées du 23 octobre par OLOLO Jesmiel
    UPDATE public.inventory
    SET agence = 'PK9'
    WHERE nom_agent_inventaire = 'OLOLO Jesmiel'
      AND DATE(created_at) = '2024-10-23'
      AND agence IS NULL;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RAISE NOTICE 'Entrées mises à jour pour PK9 (23 oct OLOLO Jesmiel) : %', updated_count;

    -- 2. Agence OKALA : Toutes les entrées du 24 au 29 octobre par OLOLO Jesmiel
    UPDATE public.inventory
    SET agence = 'Okala'
    WHERE nom_agent_inventaire = 'OLOLO Jesmiel'
      AND DATE(created_at) >= '2024-10-24'
      AND DATE(created_at) <= '2024-10-29'
      AND agence IS NULL;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RAISE NOTICE 'Entrées mises à jour pour Okala (24-29 oct OLOLO Jesmiel) : %', updated_count;

    -- 3. Agence Nzeng-Ayong : Toutes les entrées à partir du 30 octobre jusqu'à aujourd'hui par OLOLO Jesmiel
    UPDATE public.inventory
    SET agence = 'Nzeng-Ayong'
    WHERE nom_agent_inventaire = 'OLOLO Jesmiel'
      AND DATE(created_at) >= '2024-10-30'
      AND agence IS NULL;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RAISE NOTICE 'Entrées mises à jour pour Nzeng-Ayong (>= 30 oct OLOLO Jesmiel) : %', updated_count;

    -- 4. Espace Conseil : Toutes les entrées avant le 23 octobre par tous les agents
    UPDATE public.inventory
    SET agence = 'Espace Conseil'
    WHERE DATE(created_at) < '2024-10-23'
      AND agence IS NULL;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RAISE NOTICE 'Entrées mises à jour pour Espace Conseil (avant 23 oct) : %', updated_count;

    -- 5. Espace Conseil : Les 93 premières entrées du 29 octobre par NDONG Nell Davy
    -- Utiliser une transaction pour s'assurer que les 93 premières sont bien sélectionnées
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
    RAISE NOTICE 'Entrées mises à jour pour Espace Conseil (29 oct NDONG - 93 premières) : %', updated_count;

    -- 6. Agence OWENDO : Toutes les entrées du 23 au 29 octobre par NDONG Nell Davy
    -- (sauf les 93 premières du 29 octobre déjà mises à jour)
    UPDATE public.inventory
    SET agence = 'Owendo'
    WHERE nom_agent_inventaire = 'NDONG Nell Davy'
      AND DATE(created_at) >= '2024-10-23'
      AND DATE(created_at) <= '2024-10-29'
      AND (DATE(created_at) != '2024-10-29' OR agence IS NULL) -- Inclure toutes les entrées du 29 oct non encore mises à jour
      AND agence IS NULL;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RAISE NOTICE 'Entrées mises à jour pour Owendo (23-29 oct NDONG) : %', updated_count;

    -- 7. Pour les entrées récentes (après le 30 octobre) qui n'ont pas encore d'agence
    -- Par défaut, on les assigne à Nzeng-Ayong pour OLOLO Jesmiel (continuité)
    UPDATE public.inventory
    SET agence = 'Nzeng-Ayong'
    WHERE nom_agent_inventaire = 'OLOLO Jesmiel'
      AND DATE(created_at) >= '2024-10-30'
      AND agence IS NULL;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RAISE NOTICE 'Entrées récentes mises à jour pour Nzeng-Ayong (OLOLO Jesmiel après 30 oct) : %', updated_count;

    -- 8. Pour toutes les autres entrées restantes (qui ne correspondent à aucune règle),
    -- on les met à "Espace Conseil" par défaut
    UPDATE public.inventory
    SET agence = 'Espace Conseil'
    WHERE agence IS NULL;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RAISE NOTICE 'Entrées restantes mises à jour pour Espace Conseil (par défaut) : %', updated_count;

    -- Vérification finale
    SELECT COUNT(*) INTO total_null_count
    FROM public.inventory
    WHERE agence IS NULL;

    IF total_null_count = 0 THEN
        RAISE NOTICE '✓ Toutes les entrées ont maintenant une agence assignée.';
    ELSE
        RAISE WARNING 'Il reste % entrées avec agence NULL.', total_null_count;
    END IF;

END $$;
