-- Comparaison entre résultats attendus et résultats actuels
-- Aide à identifier les écarts

-- ============================================================
-- RÉSULTATS ACTUELS (ce que vous avez montré)
-- ============================================================
SELECT 
    '=== RÉSULTATS ACTUELS ===' as titre;

SELECT 
    agence,
    COUNT(*) as total_dossiers,
    COUNT(DISTINCT TRIM(nom_agent_inventaire)) as nombre_agents,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) || '%' as pourcentage
FROM public.inventory
WHERE agence IS NOT NULL
GROUP BY agence
ORDER BY total_dossiers DESC;

-- ============================================================
-- RÉSULTATS ATTENDUS (selon les règles)
-- ============================================================
SELECT 
    '=== RÉSULTATS ATTENDUS (selon les règles) ===' as titre;

-- Calcul des résultats attendus par agence
WITH attendu AS (
    SELECT 
        CASE 
            -- PK9 : 23 octobre par OLOLO
            WHEN UPPER(TRIM(nom_agent_inventaire)) LIKE 'OLOLO%' 
              AND DATE(created_at) = '2024-10-23' THEN 'PK9'
            
            -- Okala : 24-29 octobre par OLOLO
            WHEN UPPER(TRIM(nom_agent_inventaire)) LIKE 'OLOLO%' 
              AND DATE(created_at) >= '2024-10-24'
              AND DATE(created_at) <= '2024-10-29' THEN 'Okala'
            
            -- Nzeng-Ayong : >= 30 octobre par OLOLO
            WHEN UPPER(TRIM(nom_agent_inventaire)) LIKE 'OLOLO%' 
              AND DATE(created_at) >= '2024-10-30' THEN 'Nzeng-Ayong'
            
            -- Espace Conseil : avant 23 octobre
            WHEN DATE(created_at) < '2024-10-23' THEN 'Espace Conseil'
            
            -- Espace Conseil : 93 premières du 29 octobre par Ndong
            WHEN (UPPER(TRIM(nom_agent_inventaire)) LIKE '%NDONG%'
               OR UPPER(TRIM(nom_agent_inventaire)) LIKE '%NELL%'
               OR UPPER(TRIM(nom_agent_inventaire)) LIKE '%DAVY%')
              AND DATE(created_at) = '2024-10-29'
              AND id IN (
                  SELECT id 
                  FROM public.inventory 
                  WHERE (UPPER(TRIM(nom_agent_inventaire)) LIKE '%NDONG%'
                     OR UPPER(TRIM(nom_agent_inventaire)) LIKE '%NELL%'
                     OR UPPER(TRIM(nom_agent_inventaire)) LIKE '%DAVY%')
                    AND DATE(created_at) = '2024-10-29'
                  ORDER BY created_at ASC
                  LIMIT 93
              ) THEN 'Espace Conseil'
            
            -- Owendo : 23-29 octobre par Ndong
            WHEN (UPPER(TRIM(nom_agent_inventaire)) LIKE '%NDONG%'
               OR UPPER(TRIM(nom_agent_inventaire)) LIKE '%NELL%'
               OR UPPER(TRIM(nom_agent_inventaire)) LIKE '%DAVY%')
              AND DATE(created_at) >= '2024-10-23'
              AND DATE(created_at) <= '2024-10-29' THEN 'Owendo'
            
            -- Owendo : Ndong après 29 octobre
            WHEN (UPPER(TRIM(nom_agent_inventaire)) LIKE '%NDONG%'
               OR UPPER(TRIM(nom_agent_inventaire)) LIKE '%NELL%'
               OR UPPER(TRIM(nom_agent_inventaire)) LIKE '%DAVY%')
              AND DATE(created_at) > '2024-10-29' THEN 'Owendo'
            
            -- Par défaut : Espace Conseil
            ELSE 'Espace Conseil'
        END as agence_attendue,
        agence as agence_actuelle
    FROM public.inventory
)
SELECT 
    agence_attendue,
    COUNT(*) as total_attendu,
    COUNT(CASE WHEN agence_actuelle = agence_attendue THEN 1 END) as correct,
    COUNT(CASE WHEN agence_actuelle != agence_attendue THEN 1 END) as incorrect
FROM attendu
GROUP BY agence_attendue
ORDER BY total_attendu DESC;

-- ============================================================
-- COMPARAISON DIRECTE : ACTUEL vs ATTENDU
-- ============================================================
SELECT 
    '=== COMPARAISON ACTUEL vs ATTENDU ===' as titre;

WITH actuel AS (
    SELECT 
        agence,
        COUNT(*) as total
    FROM public.inventory
    WHERE agence IS NOT NULL
    GROUP BY agence
),
attendu AS (
    SELECT 
        CASE 
            WHEN UPPER(TRIM(nom_agent_inventaire)) LIKE 'OLOLO%' 
              AND DATE(created_at) = '2024-10-23' THEN 'PK9'
            WHEN UPPER(TRIM(nom_agent_inventaire)) LIKE 'OLOLO%' 
              AND DATE(created_at) >= '2024-10-24'
              AND DATE(created_at) <= '2024-10-29' THEN 'Okala'
            WHEN UPPER(TRIM(nom_agent_inventaire)) LIKE 'OLOLO%' 
              AND DATE(created_at) >= '2024-10-30' THEN 'Nzeng-Ayong'
            WHEN DATE(created_at) < '2024-10-23' THEN 'Espace Conseil'
            WHEN (UPPER(TRIM(nom_agent_inventaire)) LIKE '%NDONG%'
               OR UPPER(TRIM(nom_agent_inventaire)) LIKE '%NELL%'
               OR UPPER(TRIM(nom_agent_inventaire)) LIKE '%DAVY%')
              AND DATE(created_at) >= '2024-10-23'
              AND DATE(created_at) <= '2024-10-29' THEN 'Owendo'
            WHEN (UPPER(TRIM(nom_agent_inventaire)) LIKE '%NDONG%'
               OR UPPER(TRIM(nom_agent_inventaire)) LIKE '%NELL%'
               OR UPPER(TRIM(nom_agent_inventaire)) LIKE '%DAVY%')
              AND DATE(created_at) > '2024-10-29' THEN 'Owendo'
            ELSE 'Espace Conseil'
        END as agence_attendue,
        COUNT(*) as total
    FROM public.inventory
    GROUP BY agence_attendue
)
SELECT 
    COALESCE(a.agence, b.agence_attendue) as agence,
    COALESCE(a.total, 0) as actuel,
    COALESCE(b.total, 0) as attendu,
    COALESCE(a.total, 0) - COALESCE(b.total, 0) as difference
FROM actuel a
FULL OUTER JOIN attendu b ON a.agence = b.agence_attendue
ORDER BY COALESCE(a.total, b.total) DESC;
