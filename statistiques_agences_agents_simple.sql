-- Script simplifié : Vue principale des agences, agents et nombre de dossiers
-- Format simple et lisible

-- ============================================================
-- VUE PRINCIPALE : Agences > Agents > Nombre de dossiers
-- ============================================================
SELECT 
    agence,
    TRIM(nom_agent_inventaire) as agent,
    COUNT(*) as nombre_dossiers,
    -- Répartition par état
    COUNT(CASE WHEN etat_contrat = 'Actif' THEN 1 END) as actifs,
    COUNT(CASE WHEN etat_contrat = 'Résilié' THEN 1 END) as resilies,
    -- Répartition par société
    COUNT(CASE WHEN societe_concernee = 'Vie' THEN 1 END) as vie,
    COUNT(CASE WHEN societe_concernee = 'IARD (Sinistre)' THEN 1 END) as iard,
    COUNT(CASE WHEN societe_concernee = 'Production' THEN 1 END) as production
FROM public.inventory
WHERE agence IS NOT NULL
GROUP BY agence, TRIM(nom_agent_inventaire)
ORDER BY agence, nombre_dossiers DESC;

-- ============================================================
-- RÉSUMÉ PAR AGENCE (totaux)
-- ============================================================
SELECT 
    '--- RÉSUMÉ PAR AGENCE ---' as separateur;

SELECT 
    agence,
    COUNT(*) as total_dossiers,
    COUNT(DISTINCT TRIM(nom_agent_inventaire)) as nombre_agents,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) || '%' as pourcentage
FROM public.inventory
WHERE agence IS NOT NULL
GROUP BY agence
ORDER BY total_dossiers DESC;
