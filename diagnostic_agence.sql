-- Script de diagnostic pour comprendre la répartition des données
-- À exécuter AVANT la correction pour voir quelles entrées correspondent à quelles règles

-- 1. Vérifier les agents et leurs dates de création
SELECT 
    nom_agent_inventaire,
    DATE(created_at) as date_creation,
    COUNT(*) as nombre_entrees,
    MIN(created_at) as premiere_entree,
    MAX(created_at) as derniere_entree
FROM public.inventory
GROUP BY nom_agent_inventaire, DATE(created_at)
ORDER BY nom_agent_inventaire, date_creation;

-- 2. Vérifier les entrées par agence actuelle
SELECT 
    agence,
    COUNT(*) as nombre_entrees,
    COUNT(*) * 100.0 / SUM(COUNT(*)) OVER () as pourcentage
FROM public.inventory
GROUP BY agence
ORDER BY nombre_entrees DESC;

-- 3. Analyser les entrées de OLOLO Joel Jesimiel par période
SELECT 
    CASE 
        WHEN DATE(created_at) = '2024-10-23' THEN '23 octobre (PK9)'
        WHEN DATE(created_at) >= '2024-10-24' AND DATE(created_at) <= '2024-10-29' THEN '24-29 octobre (Okala)'
        WHEN DATE(created_at) >= '2024-10-30' THEN 'À partir du 30 octobre (Nzeng-Ayong)'
        ELSE 'Autres dates'
    END as periode,
    COUNT(*) as nombre_entrees,
    MIN(created_at) as premiere_entree,
    MAX(created_at) as derniere_entree
FROM public.inventory
WHERE TRIM(nom_agent_inventaire) = 'OLOLO Joel Jesimiel'
GROUP BY periode
ORDER BY premiere_entree;

-- 4. Analyser les entrées de Ndong Riwanou Nell Davy par période
SELECT 
    CASE 
        WHEN DATE(created_at) >= '2024-10-23' AND DATE(created_at) <= '2024-10-29' THEN '23-29 octobre (Owendo/Espace Conseil)'
        WHEN DATE(created_at) > '2024-10-29' THEN 'Après le 29 octobre'
        ELSE 'Avant le 23 octobre'
    END as periode,
    COUNT(*) as nombre_entrees,
    MIN(created_at) as premiere_entree,
    MAX(created_at) as derniere_entree
FROM public.inventory
WHERE TRIM(nom_agent_inventaire) = 'Ndong Riwanou Nell Davy'
GROUP BY periode
ORDER BY premiere_entree;

-- 5. Détail des entrées du 29 octobre par Ndong Riwanou Nell Davy
SELECT 
    COUNT(*) as total_29_octobre,
    MIN(created_at) as premiere,
    MAX(created_at) as derniere
FROM public.inventory
WHERE TRIM(nom_agent_inventaire) = 'Ndong Riwanou Nell Davy'
  AND DATE(created_at) = '2024-10-29';

-- 6. Vérifier les entrées avant le 23 octobre
SELECT 
    COUNT(*) as total_avant_23_oct,
    COUNT(DISTINCT nom_agent_inventaire) as nombre_agents_differents
FROM public.inventory
WHERE DATE(created_at) < '2024-10-23';

-- 7. Lister tous les agents distincts pour vérifier les noms exacts
SELECT DISTINCT nom_agent_inventaire
FROM public.inventory
ORDER BY nom_agent_inventaire;

-- 8. Vérifier les entrées avec agence NULL (s'il y en a encore)
SELECT COUNT(*) as entrees_sans_agence
FROM public.inventory
WHERE agence IS NULL;
