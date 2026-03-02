-- Script de vérification des agences
-- Vérifie que toutes les entrées ont une agence correctement assignée selon les règles
-- À exécuter dans Supabase SQL Editor après la correction

-- ============================================================
-- 1. VUE D'ENSEMBLE : Répartition totale par agence
-- ============================================================
SELECT 
    '=== RÉPARTITION TOTALE PAR AGENCE ===' as section;

SELECT 
    agence,
    COUNT(*) as nombre_entrees,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as pourcentage
FROM public.inventory
GROUP BY agence
ORDER BY nombre_entrees DESC;

-- ============================================================
-- 2. VÉRIFICATION DES RÈGLES POUR OLOLO Joel Jesimiel
-- ============================================================
SELECT 
    '=== VÉRIFICATION OLOLO Joel Jesimiel ===' as section;

-- 2.1. 23 octobre -> PK9
SELECT 
    '23 octobre (PK9)' as regle,
    COUNT(*) as nombre_entrees,
    COUNT(CASE WHEN agence = 'PK9' THEN 1 END) as avec_pk9,
    COUNT(CASE WHEN agence != 'PK9' OR agence IS NULL THEN 1 END) as erreurs
FROM public.inventory
WHERE TRIM(nom_agent_inventaire) = 'OLOLO Joel Jesimiel'
  AND DATE(created_at) = '2024-10-23';

-- 2.2. 24-29 octobre -> Okala
SELECT 
    '24-29 octobre (Okala)' as regle,
    COUNT(*) as nombre_entrees,
    COUNT(CASE WHEN agence = 'Okala' THEN 1 END) as avec_okala,
    COUNT(CASE WHEN agence != 'Okala' OR agence IS NULL THEN 1 END) as erreurs
FROM public.inventory
WHERE TRIM(nom_agent_inventaire) = 'OLOLO Joel Jesimiel'
  AND DATE(created_at) >= '2024-10-24'
  AND DATE(created_at) <= '2024-10-29';

-- 2.3. >= 30 octobre -> Nzeng-Ayong
SELECT 
    '>= 30 octobre (Nzeng-Ayong)' as regle,
    COUNT(*) as nombre_entrees,
    COUNT(CASE WHEN agence = 'Nzeng-Ayong' THEN 1 END) as avec_nzeng_ayong,
    COUNT(CASE WHEN agence != 'Nzeng-Ayong' OR agence IS NULL THEN 1 END) as erreurs
FROM public.inventory
WHERE TRIM(nom_agent_inventaire) = 'OLOLO Joel Jesimiel'
  AND DATE(created_at) >= '2024-10-30';

-- 2.4. Détail par période pour OLOLO Joel Jesimiel
SELECT 
    CASE 
        WHEN DATE(created_at) = '2024-10-23' THEN '23 octobre (PK9)'
        WHEN DATE(created_at) >= '2024-10-24' AND DATE(created_at) <= '2024-10-29' THEN '24-29 octobre (Okala)'
        WHEN DATE(created_at) >= '2024-10-30' THEN '>= 30 octobre (Nzeng-Ayong)'
        ELSE 'Autres dates'
    END as periode_attendue,
    agence as agence_actuelle,
    COUNT(*) as nombre_entrees
FROM public.inventory
WHERE TRIM(nom_agent_inventaire) = 'OLOLO Joel Jesimiel'
GROUP BY periode_attendue, agence
ORDER BY periode_attendue, agence;

-- ============================================================
-- 3. VÉRIFICATION DES RÈGLES POUR Ndong Riwanou Nell Davy
-- ============================================================
SELECT 
    '=== VÉRIFICATION Ndong Riwanou Nell Davy ===' as section;

-- 3.1. 23-29 octobre (sauf 93 premières du 29 oct) -> Owendo
SELECT 
    '23-29 octobre (Owendo)' as regle,
    COUNT(*) as nombre_entrees,
    COUNT(CASE WHEN agence = 'Owendo' THEN 1 END) as avec_owendo,
    COUNT(CASE WHEN agence != 'Owendo' OR agence IS NULL THEN 1 END) as erreurs
FROM public.inventory
WHERE TRIM(nom_agent_inventaire) = 'Ndong Riwanou Nell Davy'
  AND DATE(created_at) >= '2024-10-23'
  AND DATE(created_at) <= '2024-10-29'
  AND NOT (
      DATE(created_at) = '2024-10-29' 
      AND id IN (
          SELECT id 
          FROM public.inventory 
          WHERE TRIM(nom_agent_inventaire) = 'Ndong Riwanou Nell Davy'
            AND DATE(created_at) = '2024-10-29'
          ORDER BY created_at ASC
          LIMIT 93
      )
  );

-- 3.2. 93 premières du 29 octobre -> Espace Conseil
SELECT 
    '93 premières du 29 octobre (Espace Conseil)' as regle,
    93 as attendu,
    COUNT(*) as nombre_entrees,
    COUNT(CASE WHEN agence = 'Espace Conseil' THEN 1 END) as avec_espace_conseil
FROM public.inventory
WHERE TRIM(nom_agent_inventaire) = 'Ndong Riwanou Nell Davy'
  AND DATE(created_at) = '2024-10-29'
  AND id IN (
      SELECT id 
      FROM public.inventory 
      WHERE TRIM(nom_agent_inventaire) = 'Ndong Riwanou Nell Davy'
        AND DATE(created_at) = '2024-10-29'
      ORDER BY created_at ASC
      LIMIT 93
  );

-- 3.3. Total du 29 octobre pour Ndong Riwanou Nell Davy
SELECT 
    'Total du 29 octobre' as regle,
    COUNT(*) as total_29_octobre,
    COUNT(CASE WHEN agence = 'Espace Conseil' THEN 1 END) as espace_conseil,
    COUNT(CASE WHEN agence = 'Owendo' THEN 1 END) as owendo,
    COUNT(CASE WHEN agence NOT IN ('Espace Conseil', 'Owendo') OR agence IS NULL THEN 1 END) as erreurs
FROM public.inventory
WHERE TRIM(nom_agent_inventaire) = 'Ndong Riwanou Nell Davy'
  AND DATE(created_at) = '2024-10-29';

-- 3.4. Détail par période pour Ndong Riwanou Nell Davy
SELECT 
    CASE 
        WHEN DATE(created_at) >= '2024-10-23' AND DATE(created_at) <= '2024-10-29' THEN '23-29 octobre'
        WHEN DATE(created_at) > '2024-10-29' THEN 'Après 29 octobre'
        ELSE 'Avant 23 octobre'
    END as periode,
    agence,
    COUNT(*) as nombre_entrees
FROM public.inventory
WHERE TRIM(nom_agent_inventaire) = 'Ndong Riwanou Nell Davy'
GROUP BY periode, agence
ORDER BY periode, agence;

-- ============================================================
-- 4. VÉRIFICATION DES RÈGLES GÉNÉRALES
-- ============================================================
SELECT 
    '=== VÉRIFICATION RÈGLES GÉNÉRALES ===' as section;

-- 4.1. Avant le 23 octobre -> Espace Conseil (tous agents)
SELECT 
    'Avant 23 octobre (Espace Conseil - tous agents)' as regle,
    COUNT(*) as nombre_entrees,
    COUNT(CASE WHEN agence = 'Espace Conseil' THEN 1 END) as avec_espace_conseil,
    COUNT(CASE WHEN agence != 'Espace Conseil' OR agence IS NULL THEN 1 END) as erreurs
FROM public.inventory
WHERE DATE(created_at) < '2024-10-23';

-- ============================================================
-- 5. DÉTECTION D'ANOMALIES
-- ============================================================
SELECT 
    '=== ANOMALIES DÉTECTÉES ===' as section;

-- 5.1. Entrées sans agence
SELECT 
    'Entrées sans agence' as type_anomalie,
    COUNT(*) as nombre
FROM public.inventory
WHERE agence IS NULL;

-- 5.2. Entrées avec agence non valide
SELECT 
    'Agences non valides' as type_anomalie,
    agence,
    COUNT(*) as nombre
FROM public.inventory
WHERE agence IS NOT NULL
  AND agence NOT IN ('Okala', 'Nzeng-Ayong', 'PK9', 'Espace Conseil', 'Owendo')
GROUP BY agence;

-- 5.3. Entrées de OLOLO Joel Jesimiel avec agence incorrecte
SELECT 
    'OLOLO Joel Jesimiel - Agence incorrecte' as type_anomalie,
    DATE(created_at) as date_creation,
    agence,
    COUNT(*) as nombre
FROM public.inventory
WHERE TRIM(nom_agent_inventaire) = 'OLOLO Joel Jesimiel'
  AND (
      -- 23 octobre devrait être PK9
      (DATE(created_at) = '2024-10-23' AND agence != 'PK9') OR
      -- 24-29 octobre devrait être Okala
      (DATE(created_at) >= '2024-10-24' AND DATE(created_at) <= '2024-10-29' AND agence != 'Okala') OR
      -- >= 30 octobre devrait être Nzeng-Ayong
      (DATE(created_at) >= '2024-10-30' AND agence != 'Nzeng-Ayong')
  )
GROUP BY DATE(created_at), agence
ORDER BY date_creation;

-- 5.4. Entrées de Ndong Riwanou Nell Davy avec agence incorrecte (23-29 octobre)
SELECT 
    'Ndong Riwanou Nell Davy - Agence incorrecte (23-29 oct)' as type_anomalie,
    DATE(created_at) as date_creation,
    agence,
    COUNT(*) as nombre
FROM public.inventory
WHERE TRIM(nom_agent_inventaire) = 'Ndong Riwanou Nell Davy'
  AND DATE(created_at) >= '2024-10-23'
  AND DATE(created_at) <= '2024-10-29'
  AND agence NOT IN ('Owendo', 'Espace Conseil')
GROUP BY DATE(created_at), agence
ORDER BY date_creation;

-- ============================================================
-- 6. RÉSUMÉ PAR AGENT ET AGENCE
-- ============================================================
SELECT 
    '=== RÉSUMÉ PAR AGENT ET AGENCE ===' as section;

SELECT 
    TRIM(nom_agent_inventaire) as agent,
    agence,
    COUNT(*) as nombre_entrees,
    MIN(DATE(created_at)) as premiere_entree,
    MAX(DATE(created_at)) as derniere_entree
FROM public.inventory
GROUP BY TRIM(nom_agent_inventaire), agence
ORDER BY agent, agence;

-- ============================================================
-- 7. STATISTIQUES FINALES
-- ============================================================
SELECT 
    '=== STATISTIQUES FINALES ===' as section;

SELECT 
    COUNT(*) as total_entrees,
    COUNT(DISTINCT TRIM(nom_agent_inventaire)) as nombre_agents,
    COUNT(DISTINCT agence) as nombre_agences,
    COUNT(CASE WHEN agence IS NULL THEN 1 END) as entrees_sans_agence,
    ROUND(COUNT(CASE WHEN agence IS NOT NULL THEN 1 END) * 100.0 / COUNT(*), 2) as pourcentage_avec_agence
FROM public.inventory;
