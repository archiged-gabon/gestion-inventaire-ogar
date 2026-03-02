-- Script de vérification RAPIDE des agences
-- Version simplifiée pour un aperçu rapide
-- À exécuter dans Supabase SQL Editor

-- 1. Répartition totale par agence
SELECT 
    agence,
    COUNT(*) as nombre,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) || '%' as pourcentage
FROM public.inventory
GROUP BY agence
ORDER BY nombre DESC;

-- 2. Vérification des règles principales
SELECT 
    'OLOLO Joel Jesimiel - 23 oct' as regle,
    COUNT(*) as total,
    COUNT(CASE WHEN agence = 'PK9' THEN 1 END) as correct,
    COUNT(CASE WHEN agence != 'PK9' OR agence IS NULL THEN 1 END) as erreur
FROM public.inventory
WHERE TRIM(nom_agent_inventaire) = 'OLOLO Joel Jesimiel'
  AND DATE(created_at) = '2024-10-23'

UNION ALL

SELECT 
    'OLOLO Joel Jesimiel - 24-29 oct' as regle,
    COUNT(*) as total,
    COUNT(CASE WHEN agence = 'Okala' THEN 1 END) as correct,
    COUNT(CASE WHEN agence != 'Okala' OR agence IS NULL THEN 1 END) as erreur
FROM public.inventory
WHERE TRIM(nom_agent_inventaire) = 'OLOLO Joel Jesimiel'
  AND DATE(created_at) >= '2024-10-24'
  AND DATE(created_at) <= '2024-10-29'

UNION ALL

SELECT 
    'OLOLO Joel Jesimiel - >= 30 oct' as regle,
    COUNT(*) as total,
    COUNT(CASE WHEN agence = 'Nzeng-Ayong' THEN 1 END) as correct,
    COUNT(CASE WHEN agence != 'Nzeng-Ayong' OR agence IS NULL THEN 1 END) as erreur
FROM public.inventory
WHERE TRIM(nom_agent_inventaire) = 'OLOLO Joel Jesimiel'
  AND DATE(created_at) >= '2024-10-30'

UNION ALL

SELECT 
    'Ndong Riwanou Nell Davy - 23-29 oct' as regle,
    COUNT(*) as total,
    COUNT(CASE WHEN agence IN ('Owendo', 'Espace Conseil') THEN 1 END) as correct,
    COUNT(CASE WHEN agence NOT IN ('Owendo', 'Espace Conseil') OR agence IS NULL THEN 1 END) as erreur
FROM public.inventory
WHERE TRIM(nom_agent_inventaire) = 'Ndong Riwanou Nell Davy'
  AND DATE(created_at) >= '2024-10-23'
  AND DATE(created_at) <= '2024-10-29'

UNION ALL

SELECT 
    'Avant 23 oct - Tous agents' as regle,
    COUNT(*) as total,
    COUNT(CASE WHEN agence = 'Espace Conseil' THEN 1 END) as correct,
    COUNT(CASE WHEN agence != 'Espace Conseil' OR agence IS NULL THEN 1 END) as erreur
FROM public.inventory
WHERE DATE(created_at) < '2024-10-23';

-- 3. Anomalies
SELECT 
    '❌ Entrées sans agence' as anomalie,
    COUNT(*) as nombre
FROM public.inventory
WHERE agence IS NULL

UNION ALL

SELECT 
    '⚠️ Agences non valides' as anomalie,
    COUNT(*) as nombre
FROM public.inventory
WHERE agence IS NOT NULL
  AND agence NOT IN ('Okala', 'Nzeng-Ayong', 'PK9', 'Espace Conseil', 'Owendo');
