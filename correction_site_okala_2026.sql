DO $$
DECLARE
    updated_count INTEGER;
    total_entries INTEGER;
    site_okala_id UUID;
    has_agences_table BOOLEAN;
    has_agence_id_column BOOLEAN;
BEGIN
    has_agences_table := EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'agences'
    );

    has_agence_id_column := EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'inventory'
          AND column_name = 'agence_id'
    );

    site_okala_id := NULL;
    IF has_agences_table THEN
        SELECT id INTO site_okala_id
        FROM public.agences
        WHERE code = 'Site Okala'
        LIMIT 1;
    END IF;

    SELECT COUNT(*) INTO total_entries
    FROM public.inventory
    WHERE DATE(created_at) >= '2026-03-12';

    IF total_entries > 0 THEN
        UPDATE public.inventory
        SET agence = 'Site Okala',
            agence_id = CASE
                WHEN has_agence_id_column AND site_okala_id IS NOT NULL THEN site_okala_id
                ELSE agence_id
            END
        WHERE DATE(created_at) >= '2026-03-12'
          AND (
            agence IS DISTINCT FROM 'Site Okala'
            OR (has_agence_id_column AND site_okala_id IS NOT NULL AND agence_id IS DISTINCT FROM site_okala_id)
          );

        GET DIAGNOSTICS updated_count = ROW_COUNT;
        RAISE NOTICE 'Site Okala (>= 2026-03-12): % entrées mises à jour sur % total', updated_count, total_entries;
    ELSE
        RAISE NOTICE 'Aucune entrée trouvée à basculer (>= 2026-03-12)';
    END IF;
END $$;

SELECT
    agence,
    agence_id,
    COUNT(*) as nombre_dossiers
FROM public.inventory
WHERE DATE(created_at) >= '2026-03-12'
GROUP BY agence, agence_id
ORDER BY nombre_dossiers DESC;

SELECT
    agence,
    COUNT(*) as nombre_dossiers,
    COUNT(DISTINCT TRIM(nom_agent_inventaire)) as nombre_agents
FROM public.inventory
WHERE DATE(created_at) >= '2026-03-12'
GROUP BY agence
ORDER BY nombre_dossiers DESC;
