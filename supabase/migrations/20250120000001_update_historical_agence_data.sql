-- Migration pour mettre à jour les données historiques avec les valeurs d'agence
-- selon les règles définies pour rétroactivement corriger les anciennes entrées
-- 
-- RÈGLES D'AFFECTATION :
-- - Agence PK9 : Toutes les entrées du 23 octobre par OLOLO Jesmiel
-- - Agence OKALA : Toutes les entrées du 24 au 29 octobre par OLOLO Jesmiel
-- - Agence Nzeng-Ayong : Toutes les entrées à partir du 30 octobre jusqu'à aujourd'hui par OLOLO Jesmiel
-- - Espace Conseil : Toutes les entrées avant le 23 octobre par tous les agents + 93 entrées faites le 29 octobre par NDONG Nell Davy
-- - Agence OWENDO : Toutes les entrées du 23 au 29 octobre par NDONG Nell Davy

DO $$
BEGIN
    -- Agence PK9 : Toutes les entrées du 23 octobre par OLOLO Joel Jesimiel
    UPDATE public.inventory
    SET agence = 'PK9'
    WHERE TRIM(nom_agent_inventaire) = 'OLOLO Joel Jesimiel'
      AND DATE(created_at) = '2024-10-23'
      AND (agence IS NULL OR agence = '');

    -- Agence OKALA : Toutes les entrées du 24 au 29 octobre par OLOLO Joel Jesimiel
    UPDATE public.inventory
    SET agence = 'Okala'
    WHERE TRIM(nom_agent_inventaire) = 'OLOLO Joel Jesimiel'
      AND DATE(created_at) >= '2024-10-24'
      AND DATE(created_at) <= '2024-10-29'
      AND (agence IS NULL OR agence = '');

    -- Agence Nzeng-Ayong : Toutes les entrées à partir du 30 octobre jusqu'à aujourd'hui par OLOLO Joel Jesimiel
    UPDATE public.inventory
    SET agence = 'Nzeng-Ayong'
    WHERE TRIM(nom_agent_inventaire) = 'OLOLO Joel Jesimiel'
      AND DATE(created_at) >= '2024-10-30'
      AND (agence IS NULL OR agence = '');

    -- Agence OWENDO : Toutes les entrées du 23 au 29 octobre par Ndong Riwanou Nell Davy
    -- (sauf les 93 entrées du 29 octobre qui iront à Espace Conseil)
    UPDATE public.inventory
    SET agence = 'Owendo'
    WHERE TRIM(nom_agent_inventaire) = 'Ndong Riwanou Nell Davy'
      AND DATE(created_at) >= '2024-10-23'
      AND DATE(created_at) <= '2024-10-29'
      AND DATE(created_at) != '2024-10-29' -- Exclure le 29 octobre
      AND (agence IS NULL OR agence = '');

    -- Espace Conseil : Toutes les entrées avant le 23 octobre par tous les agents
    UPDATE public.inventory
    SET agence = 'Espace Conseil'
    WHERE DATE(created_at) < '2024-10-23'
      AND (agence IS NULL OR agence = '');

    -- Espace Conseil : Les 93 entrées du 29 octobre par Ndong Riwanou Nell Davy
    -- Pour cette règle spécifique, on utilise LIMIT avec une sous-requête ordonnée
    -- pour s'assurer d'avoir exactement les 93 premières entrées du 29 octobre
    UPDATE public.inventory
    SET agence = 'Espace Conseil'
    WHERE id IN (
        SELECT id 
        FROM public.inventory
        WHERE TRIM(nom_agent_inventaire) = 'Ndong Riwanou Nell Davy'
          AND DATE(created_at) = '2024-10-29'
          AND (agence IS NULL OR agence = '')
        ORDER BY created_at ASC
        LIMIT 93
    );

    -- Les entrées restantes du 29 octobre par Ndong Riwanou Nell Davy (après les 93) vont à Owendo
    -- On met à jour celles qui n'ont pas encore été affectées
    UPDATE public.inventory
    SET agence = 'Owendo'
    WHERE TRIM(nom_agent_inventaire) = 'Ndong Riwanou Nell Davy'
      AND DATE(created_at) = '2024-10-29'
      AND (agence IS NULL OR agence = '');

    RAISE NOTICE 'Mise à jour des données historiques terminée';
END $$;
