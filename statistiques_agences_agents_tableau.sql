-- Tableau récapitulatif : Agences en colonnes, Agents en lignes
-- Format idéal pour export Excel

SELECT 
    TRIM(nom_agent_inventaire) as "Agent",
    COUNT(CASE WHEN agence = 'Okala' THEN 1 END) as "Okala",
    COUNT(CASE WHEN agence = 'Nzeng-Ayong' THEN 1 END) as "Nzeng-Ayong",
    COUNT(CASE WHEN agence = 'PK9' THEN 1 END) as "PK9",
    COUNT(CASE WHEN agence = 'Owendo' THEN 1 END) as "Owendo",
    COUNT(CASE WHEN agence = 'Espace Conseil' THEN 1 END) as "Espace Conseil",
    COUNT(*) as "TOTAL"
FROM public.inventory
WHERE agence IS NOT NULL
GROUP BY TRIM(nom_agent_inventaire)
ORDER BY "TOTAL" DESC;

-- Ligne de totalisation
SELECT 
    'TOTAL' as "Agent",
    COUNT(CASE WHEN agence = 'Okala' THEN 1 END) as "Okala",
    COUNT(CASE WHEN agence = 'Nzeng-Ayong' THEN 1 END) as "Nzeng-Ayong",
    COUNT(CASE WHEN agence = 'PK9' THEN 1 END) as "PK9",
    COUNT(CASE WHEN agence = 'Owendo' THEN 1 END) as "Owendo",
    COUNT(CASE WHEN agence = 'Espace Conseil' THEN 1 END) as "Espace Conseil",
    COUNT(*) as "TOTAL"
FROM public.inventory
WHERE agence IS NOT NULL;
