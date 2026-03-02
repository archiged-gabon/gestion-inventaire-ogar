-- Script de diagnostic : Comparaison entre les résultats attendus et actuels
-- Identifie pourquoi Okala et PK9 sont à 0

-- ============================================================
-- 1. VÉRIFICATION DES DATES DES ENTRÉES
-- ============================================================
SELECT 
    '=== RÉPARTITION PAR DATE DE CRÉATION ===' as section;

SELECT 
    DATE(created_at) as date_creation,
    COUNT(*) as nombre_entrees,
    COUNT(DISTINCT TRIM(nom_agent_inventaire)) as nombre_agents
FROM public.inventory
GROUP BY DATE(created_at)
ORDER BY date_creation;

-- Focus sur les dates critiques (23 octobre, 24-29 octobre)
SELECT 
    '=== FOCUS SUR LES DATES CRITIQUES ===' as section;

-- 23 octobre (devrait être PK9 pour OLOLO)
SELECT 
    DATE(created_at) as date_creation,
    TRIM(nom_agent_inventaire) as agent,
    agence,
    COUNT(*) as nombre
FROM public.inventory
WHERE DATE(created_at) = '2024-10-23'
GROUP BY DATE(created_at), TRIM(nom_agent_inventaire), agence
ORDER BY agent, agence;

-- 24-29 octobre (devrait être Okala pour OLOLO)
SELECT 
    DATE(created_at) as date_creation,
    TRIM(nom_agent_inventaire) as agent,
    agence,
    COUNT(*) as nombre
FROM public.inventory
WHERE DATE(created_at) >= '2024-10-24'
  AND DATE(created_at) <= '2024-10-29'
GROUP BY DATE(created_at), TRIM(nom_agent_inventaire), agence
ORDER BY date_creation, agent, agence;

-- ============================================================
-- 2. VÉRIFICATION DES NOMS D'AGENTS POUR LES PÉRIODES CRITIQUES
-- ============================================================
SELECT 
    '=== AGENTS POUR LA PÉRIODE 23 OCTOBRE ===' as section;

SELECT 
    TRIM(nom_agent_inventaire) as agent,
    agence,
    COUNT(*) as nombre
FROM public.inventory
WHERE DATE(created_at) = '2024-10-23'
GROUP BY TRIM(nom_agent_inventaire), agence
ORDER BY nombre DESC;

SELECT 
    '=== AGENTS POUR LA PÉRIODE 24-29 OCTOBRE ===' as section;

SELECT 
    TRIM(nom_agent_inventaire) as agent,
    agence,
    COUNT(*) as nombre
FROM public.inventory
WHERE DATE(created_at) >= '2024-10-24'
  AND DATE(created_at) <= '2024-10-29'
GROUP BY TRIM(nom_agent_inventaire), agence
ORDER BY nombre DESC;

-- ============================================================
-- 3. DÉTECTION DES ENTITÉS QUI DEVRAIENT ÊTRE À OKALA OU PK9
-- ============================================================
SELECT 
    '=== ENTITÉS QUI DEVRAIENT ÊTRE PK9 (23 oct - OLOLO) ===' as section;

SELECT 
    TRIM(nom_agent_inventaire) as agent,
    DATE(created_at) as date_creation,
    agence as agence_actuelle,
    'PK9' as agence_attendue,
    COUNT(*) as nombre
FROM public.inventory
WHERE UPPER(TRIM(nom_agent_inventaire)) LIKE 'OLOLO%'
  AND DATE(created_at) = '2024-10-23'
  AND agence != 'PK9'
GROUP BY TRIM(nom_agent_inventaire), DATE(created_at), agence
ORDER BY nombre DESC;

SELECT 
    '=== ENTITÉS QUI DEVRAIENT ÊTRE OKALA (24-29 oct - OLOLO) ===' as section;

SELECT 
    TRIM(nom_agent_inventaire) as agent,
    DATE(created_at) as date_creation,
    agence as agence_actuelle,
    'Okala' as agence_attendue,
    COUNT(*) as nombre
FROM public.inventory
WHERE UPPER(TRIM(nom_agent_inventaire)) LIKE 'OLOLO%'
  AND DATE(created_at) >= '2024-10-24'
  AND DATE(created_at) <= '2024-10-29'
  AND agence != 'Okala'
GROUP BY TRIM(nom_agent_inventaire), DATE(created_at), agence
ORDER BY date_creation, nombre DESC;

-- ============================================================
-- 4. ANALYSE : Pourquoi Okala et PK9 sont à 0 ?
-- ============================================================
SELECT 
    '=== ANALYSE : POURQUOI OKALA ET PK9 SONT À 0 ? ===' as section;

-- Vérifier s'il y a des entrées OLOLO pour ces périodes
SELECT 
    'Période 23 octobre - OLOLO' as periode,
    COUNT(*) as total_entrees_ololo,
    COUNT(CASE WHEN agence = 'PK9' THEN 1 END) as avec_pk9,
    COUNT(CASE WHEN agence != 'PK9' THEN 1 END) as sans_pk9,
    STRING_AGG(DISTINCT agence, ', ') as agences_actuelles
FROM public.inventory
WHERE UPPER(TRIM(nom_agent_inventaire)) LIKE 'OLOLO%'
  AND DATE(created_at) = '2024-10-23'

UNION ALL

SELECT 
    'Période 24-29 octobre - OLOLO' as periode,
    COUNT(*) as total_entrees_ololo,
    COUNT(CASE WHEN agence = 'Okala' THEN 1 END) as avec_okala,
    COUNT(CASE WHEN agence != 'Okala' THEN 1 END) as sans_okala,
    STRING_AGG(DISTINCT agence, ', ') as agences_actuelles
FROM public.inventory
WHERE UPPER(TRIM(nom_agent_inventaire)) LIKE 'OLOLO%'
  AND DATE(created_at) >= '2024-10-24'
  AND DATE(created_at) <= '2024-10-29';

-- ============================================================
-- 5. TOUS LES NOMS D'AGENTS POUR LES PÉRIODES CRITIQUES
-- ============================================================
SELECT 
    '=== TOUS LES NOMS D''AGENTS POUR LA PÉRIODE 23-29 OCTOBRE ===' as section;

SELECT 
    TRIM(nom_agent_inventaire) as agent,
    DATE(created_at) as date_creation,
    agence,
    COUNT(*) as nombre
FROM public.inventory
WHERE DATE(created_at) >= '2024-10-23'
  AND DATE(created_at) <= '2024-10-29'
GROUP BY TRIM(nom_agent_inventaire), DATE(created_at), agence
ORDER BY date_creation, agent, agence;
