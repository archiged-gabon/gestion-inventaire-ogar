-- Script pour vérifier les variations de noms d'agents
-- Détecte les agents similaires et vérifie si les règles s'appliquent correctement

-- ============================================================
-- 1. LISTE TOUS LES NOMS D'AGENTS DISTINCTS
-- ============================================================
SELECT 
    '=== TOUS LES NOMS D''AGENTS (distincts) ===' as section;

SELECT 
    nom_agent_inventaire as nom_complet,
    TRIM(nom_agent_inventaire) as nom_trie,
    COUNT(*) as nombre_entrees,
    MIN(DATE(created_at)) as premiere_entree,
    MAX(DATE(created_at)) as derniere_entree,
    STRING_AGG(DISTINCT agence, ', ' ORDER BY agence) as agences_associees
FROM public.inventory
GROUP BY nom_agent_inventaire
ORDER BY nombre_entrees DESC;

-- ============================================================
-- 2. DÉTECTION DES VARIATIONS POSSIBLES
-- ============================================================
SELECT 
    '=== VARIATIONS DÉTECTÉES (agents similaires) ===' as section;

-- Détecte les noms qui commencent par "OLOLO"
SELECT 
    'Variations de OLOLO' as type_variation,
    nom_agent_inventaire as nom_complet,
    COUNT(*) as nombre_entrees,
    STRING_AGG(DISTINCT agence, ', ' ORDER BY agence) as agences
FROM public.inventory
WHERE UPPER(TRIM(nom_agent_inventaire)) LIKE 'OLOLO%'
GROUP BY nom_agent_inventaire
ORDER BY nombre_entrees DESC;

-- Détecte les noms qui contiennent "Ndong" ou "Nell" ou "Davy"
SELECT 
    'Variations de Ndong' as type_variation,
    nom_agent_inventaire as nom_complet,
    COUNT(*) as nombre_entrees,
    STRING_AGG(DISTINCT agence, ', ' ORDER BY agence) as agences
FROM public.inventory
WHERE UPPER(TRIM(nom_agent_inventaire)) LIKE '%NDONG%'
   OR UPPER(TRIM(nom_agent_inventaire)) LIKE '%NELL%'
   OR UPPER(TRIM(nom_agent_inventaire)) LIKE '%DAVY%'
GROUP BY nom_agent_inventaire
ORDER BY nombre_entrees DESC;

-- ============================================================
-- 3. VÉRIFICATION DES RÈGLES AVEC CORRESPONDANCE FLEXIBLE
-- ============================================================
SELECT 
    '=== VÉRIFICATION AVEC CORRESPONDANCE FLEXIBLE ===' as section;

-- 3.1. OLOLO (toutes variations) - 23 octobre -> devrait être PK9
SELECT 
    'OLOLO (variations) - 23 oct -> PK9' as regle,
    nom_agent_inventaire,
    COUNT(*) as total,
    COUNT(CASE WHEN agence = 'PK9' THEN 1 END) as correct_pk9,
    COUNT(CASE WHEN agence != 'PK9' THEN 1 END) as incorrect,
    STRING_AGG(DISTINCT agence, ', ') as agences_incorrectes
FROM public.inventory
WHERE UPPER(TRIM(nom_agent_inventaire)) LIKE 'OLOLO%'
  AND DATE(created_at) = '2024-10-23'
GROUP BY nom_agent_inventaire
HAVING COUNT(CASE WHEN agence != 'PK9' THEN 1 END) > 0
ORDER BY nom_agent_inventaire;

-- 3.2. OLOLO (toutes variations) - 24-29 octobre -> devrait être Okala
SELECT 
    'OLOLO (variations) - 24-29 oct -> Okala' as regle,
    nom_agent_inventaire,
    COUNT(*) as total,
    COUNT(CASE WHEN agence = 'Okala' THEN 1 END) as correct_okala,
    COUNT(CASE WHEN agence != 'Okala' THEN 1 END) as incorrect,
    STRING_AGG(DISTINCT agence, ', ') as agences_incorrectes
FROM public.inventory
WHERE UPPER(TRIM(nom_agent_inventaire)) LIKE 'OLOLO%'
  AND DATE(created_at) >= '2024-10-24'
  AND DATE(created_at) <= '2024-10-29'
GROUP BY nom_agent_inventaire
HAVING COUNT(CASE WHEN agence != 'Okala' THEN 1 END) > 0
ORDER BY nom_agent_inventaire;

-- 3.3. OLOLO (toutes variations) - >= 30 octobre -> devrait être Nzeng-Ayong
SELECT 
    'OLOLO (variations) - >= 30 oct -> Nzeng-Ayong' as regle,
    nom_agent_inventaire,
    COUNT(*) as total,
    COUNT(CASE WHEN agence = 'Nzeng-Ayong' THEN 1 END) as correct_nzeng,
    COUNT(CASE WHEN agence != 'Nzeng-Ayong' THEN 1 END) as incorrect,
    STRING_AGG(DISTINCT agence, ', ') as agences_incorrectes
FROM public.inventory
WHERE UPPER(TRIM(nom_agent_inventaire)) LIKE 'OLOLO%'
  AND DATE(created_at) >= '2024-10-30'
GROUP BY nom_agent_inventaire
HAVING COUNT(CASE WHEN agence != 'Nzeng-Ayong' THEN 1 END) > 0
ORDER BY nom_agent_inventaire;

-- 3.4. Ndong (toutes variations) - 23-29 octobre -> devrait être Owendo ou Espace Conseil
SELECT 
    'Ndong (variations) - 23-29 oct -> Owendo/Espace Conseil' as regle,
    nom_agent_inventaire,
    COUNT(*) as total,
    COUNT(CASE WHEN agence IN ('Owendo', 'Espace Conseil') THEN 1 END) as correct,
    COUNT(CASE WHEN agence NOT IN ('Owendo', 'Espace Conseil') THEN 1 END) as incorrect,
    STRING_AGG(DISTINCT agence, ', ') as agences_incorrectes
FROM public.inventory
WHERE (UPPER(TRIM(nom_agent_inventaire)) LIKE '%NDONG%'
   OR UPPER(TRIM(nom_agent_inventaire)) LIKE '%NELL%'
   OR UPPER(TRIM(nom_agent_inventaire)) LIKE '%DAVY%')
  AND DATE(created_at) >= '2024-10-23'
  AND DATE(created_at) <= '2024-10-29'
GROUP BY nom_agent_inventaire
HAVING COUNT(CASE WHEN agence NOT IN ('Owendo', 'Espace Conseil') THEN 1 END) > 0
ORDER BY nom_agent_inventaire;

-- ============================================================
-- 4. STATISTIQUES PAR VARIATION DE NOM
-- ============================================================
SELECT 
    '=== STATISTIQUES PAR VARIATION ===' as section;

-- OLOLO variations
SELECT 
    CASE 
        WHEN UPPER(TRIM(nom_agent_inventaire)) LIKE 'OLOLO%' THEN 'Groupe OLOLO'
        WHEN UPPER(TRIM(nom_agent_inventaire)) LIKE '%NDONG%' 
          OR UPPER(TRIM(nom_agent_inventaire)) LIKE '%NELL%'
          OR UPPER(TRIM(nom_agent_inventaire)) LIKE '%DAVY%' THEN 'Groupe Ndong'
        ELSE 'Autres agents'
    END as groupe_agent,
    COUNT(*) as nombre_entrees,
    COUNT(DISTINCT nom_agent_inventaire) as variations_noms,
    STRING_AGG(DISTINCT agence, ', ' ORDER BY agence) as agences_utilisees
FROM public.inventory
GROUP BY groupe_agent
ORDER BY nombre_entrees DESC;

-- ============================================================
-- 5. DÉTAIL DES ENTITÉS QUI NE CORRESPONDENT PAS AUX RÈGLES
-- ============================================================
SELECT 
    '=== ENTITÉS AVEC AGENCE POTENTIELLEMENT INCORRECTE ===' as section;

-- OLOLO avec agence incorrecte selon la date
SELECT 
    nom_agent_inventaire,
    DATE(created_at) as date_creation,
    agence as agence_actuelle,
    CASE 
        WHEN DATE(created_at) = '2024-10-23' THEN 'PK9'
        WHEN DATE(created_at) >= '2024-10-24' AND DATE(created_at) <= '2024-10-29' THEN 'Okala'
        WHEN DATE(created_at) >= '2024-10-30' THEN 'Nzeng-Ayong'
    END as agence_attendue,
    COUNT(*) as nombre
FROM public.inventory
WHERE UPPER(TRIM(nom_agent_inventaire)) LIKE 'OLOLO%'
  AND DATE(created_at) >= '2024-10-23'
  AND (
      (DATE(created_at) = '2024-10-23' AND agence != 'PK9') OR
      (DATE(created_at) >= '2024-10-24' AND DATE(created_at) <= '2024-10-29' AND agence != 'Okala') OR
      (DATE(created_at) >= '2024-10-30' AND agence != 'Nzeng-Ayong')
  )
GROUP BY nom_agent_inventaire, DATE(created_at), agence
ORDER BY date_creation, nom_agent_inventaire;

-- Ndong avec agence incorrecte pour la période 23-29 octobre
SELECT 
    nom_agent_inventaire,
    DATE(created_at) as date_creation,
    agence as agence_actuelle,
    CASE 
        WHEN DATE(created_at) = '2024-10-29' THEN 'Espace Conseil (93 premières) ou Owendo'
        ELSE 'Owendo'
    END as agence_attendue,
    COUNT(*) as nombre
FROM public.inventory
WHERE (UPPER(TRIM(nom_agent_inventaire)) LIKE '%NDONG%'
   OR UPPER(TRIM(nom_agent_inventaire)) LIKE '%NELL%'
   OR UPPER(TRIM(nom_agent_inventaire)) LIKE '%DAVY%')
  AND DATE(created_at) >= '2024-10-23'
  AND DATE(created_at) <= '2024-10-29'
  AND agence NOT IN ('Owendo', 'Espace Conseil')
GROUP BY nom_agent_inventaire, DATE(created_at), agence
ORDER BY date_creation, nom_agent_inventaire;
