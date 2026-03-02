-- Script pour identifier les dates réelles dans la base de données
-- Vérifie quelle année et quelles plages de dates existent réellement

-- ============================================================
-- 1. PLAGE DE DATES TOTALE
-- ============================================================
SELECT 
    '=== PLAGE DE DATES TOTALE ===' as section;

SELECT 
    MIN(DATE(created_at)) as date_min,
    MAX(DATE(created_at)) as date_max,
    COUNT(DISTINCT DATE(created_at)) as nombre_jours_differents,
    COUNT(*) as total_entrees
FROM public.inventory;

-- ============================================================
-- 2. DISTRIBUTION PAR ANNÉE
-- ============================================================
SELECT 
    '=== DISTRIBUTION PAR ANNÉE ===' as section;

SELECT 
    EXTRACT(YEAR FROM created_at) as annee,
    COUNT(*) as nombre_entrees,
    MIN(DATE(created_at)) as premiere_date,
    MAX(DATE(created_at)) as derniere_date
FROM public.inventory
GROUP BY EXTRACT(YEAR FROM created_at)
ORDER BY annee DESC;

-- ============================================================
-- 3. DISTRIBUTION PAR MOIS (dernières années)
-- ============================================================
SELECT 
    '=== DISTRIBUTION PAR MOIS ===' as section;

SELECT 
    DATE_TRUNC('month', created_at)::DATE as mois,
    COUNT(*) as nombre_entrees,
    COUNT(DISTINCT DATE(created_at)) as nombre_jours
FROM public.inventory
WHERE created_at >= CURRENT_DATE - INTERVAL '2 years'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY mois DESC;

-- ============================================================
-- 4. RÉPARTITION PAR JOUR (derniers mois)
-- ============================================================
SELECT 
    '=== RÉPARTITION PAR JOUR (60 derniers jours) ===' as section;

SELECT 
    DATE(created_at) as date_creation,
    COUNT(*) as nombre_entrees,
    COUNT(DISTINCT TRIM(nom_agent_inventaire)) as nombre_agents,
    STRING_AGG(DISTINCT agence, ', ' ORDER BY agence) as agences
FROM public.inventory
WHERE created_at >= CURRENT_DATE - INTERVAL '60 days'
GROUP BY DATE(created_at)
ORDER BY date_creation DESC;

-- ============================================================
-- 5. VÉRIFICATION DES DATES OCTOBRE (toutes années)
-- ============================================================
SELECT 
    '=== TOUTES LES DATES D''OCTOBRE ===' as section;

SELECT 
    DATE(created_at) as date_creation,
    EXTRACT(YEAR FROM created_at) as annee,
    COUNT(*) as nombre_entrees,
    COUNT(DISTINCT TRIM(nom_agent_inventaire)) as nombre_agents,
    STRING_AGG(DISTINCT agence, ', ' ORDER BY agence) as agences
FROM public.inventory
WHERE EXTRACT(MONTH FROM created_at) = 10
GROUP BY DATE(created_at), EXTRACT(YEAR FROM created_at)
ORDER BY date_creation DESC
LIMIT 50;

-- ============================================================
-- 6. VÉRIFICATION SPÉCIFIQUE : 23-29 OCTOBRE (toutes années)
-- ============================================================
SELECT 
    '=== 23-29 OCTOBRE (TOUTES ANNÉES) ===' as section;

SELECT 
    DATE(created_at) as date_creation,
    EXTRACT(YEAR FROM created_at) as annee,
    EXTRACT(DAY FROM created_at) as jour,
    COUNT(*) as nombre_entrees,
    COUNT(DISTINCT TRIM(nom_agent_inventaire)) as nombre_agents,
    STRING_AGG(DISTINCT agence, ', ' ORDER BY agence) as agences
FROM public.inventory
WHERE EXTRACT(MONTH FROM created_at) = 10
  AND EXTRACT(DAY FROM created_at) >= 23
  AND EXTRACT(DAY FROM created_at) <= 29
GROUP BY DATE(created_at), EXTRACT(YEAR FROM created_at), EXTRACT(DAY FROM created_at)
ORDER BY date_creation DESC;

-- ============================================================
-- 7. AGENTS ET LEURS PÉRIODES D'ACTIVITÉ
-- ============================================================
SELECT 
    '=== PÉRIODES D''ACTIVITÉ PAR AGENT ===' as section;

SELECT 
    TRIM(nom_agent_inventaire) as agent,
    MIN(DATE(created_at)) as premiere_entree,
    MAX(DATE(created_at)) as derniere_entree,
    COUNT(*) as total_entrees,
    COUNT(DISTINCT DATE(created_at)) as nombre_jours,
    STRING_AGG(DISTINCT agence, ', ' ORDER BY agence) as agences_utilisees
FROM public.inventory
GROUP BY TRIM(nom_agent_inventaire)
ORDER BY total_entrees DESC;

-- ============================================================
-- 8. VÉRIFICATION SPÉCIFIQUE : Agents OLOLO et leurs dates
-- ============================================================
SELECT 
    '=== AGENTS OLOLO ET LEURS DATES ===' as section;

SELECT 
    TRIM(nom_agent_inventaire) as agent,
    DATE(created_at) as date_creation,
    EXTRACT(YEAR FROM created_at) as annee,
    COUNT(*) as nombre_entrees,
    STRING_AGG(DISTINCT agence, ', ') as agences
FROM public.inventory
WHERE UPPER(TRIM(nom_agent_inventaire)) LIKE 'OLOLO%'
GROUP BY TRIM(nom_agent_inventaire), DATE(created_at), EXTRACT(YEAR FROM created_at)
ORDER BY date_creation DESC
LIMIT 50;

-- ============================================================
-- 9. VÉRIFICATION SPÉCIFIQUE : Agents Ndong et leurs dates
-- ============================================================
SELECT 
    '=== AGENTS NDONG ET LEURS DATES ===' as section;

SELECT 
    TRIM(nom_agent_inventaire) as agent,
    DATE(created_at) as date_creation,
    EXTRACT(YEAR FROM created_at) as annee,
    COUNT(*) as nombre_entrees,
    STRING_AGG(DISTINCT agence, ', ') as agences
FROM public.inventory
WHERE UPPER(TRIM(nom_agent_inventaire)) LIKE '%NDONG%'
   OR UPPER(TRIM(nom_agent_inventaire)) LIKE '%NELL%'
   OR UPPER(TRIM(nom_agent_inventaire)) LIKE '%DAVY%'
GROUP BY TRIM(nom_agent_inventaire), DATE(created_at), EXTRACT(YEAR FROM created_at)
ORDER BY date_creation DESC
LIMIT 50;
