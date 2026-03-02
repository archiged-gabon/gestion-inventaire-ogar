-- Script pour afficher toutes les agences, les agents qui y ont travaillé et le nombre de dossiers
-- Vue détaillée et vue résumée

-- ============================================================
-- 1. VUE DÉTAILLÉE : Agences > Agents > Nombre de dossiers
-- ============================================================
SELECT 
    '=== STATISTIQUES PAR AGENCE ET PAR AGENT ===' as titre;

SELECT 
    agence,
    TRIM(nom_agent_inventaire) as agent,
    COUNT(*) as nombre_dossiers,
    COUNT(CASE WHEN etat_contrat = 'Actif' THEN 1 END) as dossiers_actifs,
    COUNT(CASE WHEN etat_contrat = 'Résilié' THEN 1 END) as dossiers_resilies,
    MIN(DATE(created_at)) as premiere_saisie,
    MAX(DATE(created_at)) as derniere_saisie
FROM public.inventory
WHERE agence IS NOT NULL
GROUP BY agence, TRIM(nom_agent_inventaire)
ORDER BY agence, nombre_dossiers DESC;

-- ============================================================
-- 2. VUE RÉSUMÉE : Total par agence avec sous-totaux par agent
-- ============================================================
SELECT 
    '=== RÉSUMÉ PAR AGENCE ===' as titre;

SELECT 
    agence,
    COUNT(*) as total_dossiers,
    COUNT(DISTINCT TRIM(nom_agent_inventaire)) as nombre_agents,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as pourcentage_total,
    -- Répartition par état de contrat
    COUNT(CASE WHEN etat_contrat = 'Actif' THEN 1 END) as dossiers_actifs,
    COUNT(CASE WHEN etat_contrat = 'Résilié' THEN 1 END) as dossiers_resilies,
    -- Période de saisie
    MIN(DATE(created_at)) as premiere_saisie,
    MAX(DATE(created_at)) as derniere_saisie
FROM public.inventory
WHERE agence IS NOT NULL
GROUP BY agence
ORDER BY total_dossiers DESC;

-- ============================================================
-- 3. DÉTAIL PAR AGENCE : Liste des agents avec leurs statistiques
-- ============================================================
SELECT 
    '=== DÉTAIL PAR AGENCE ===' as titre;

-- Pour chaque agence, afficher les agents
SELECT 
    agence,
    TRIM(nom_agent_inventaire) as agent,
    COUNT(*) as nombre_dossiers,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (PARTITION BY agence), 2) as pourcentage_agence,
    -- Répartition par société
    COUNT(CASE WHEN societe_concernee = 'Vie' THEN 1 END) as vie,
    COUNT(CASE WHEN societe_concernee = 'IARD (Sinistre)' THEN 1 END) as iard,
    COUNT(CASE WHEN societe_concernee = 'Production' THEN 1 END) as production
FROM public.inventory
WHERE agence IS NOT NULL
GROUP BY agence, TRIM(nom_agent_inventaire)
ORDER BY agence, nombre_dossiers DESC;

-- ============================================================
-- 4. TABLEAU CROISÉ : Agences en colonnes, Agents en lignes
-- ============================================================
SELECT 
    '=== TABLEAU CROISÉ : AGENTS PAR AGENCE ===' as titre;

SELECT 
    TRIM(nom_agent_inventaire) as agent,
    COUNT(CASE WHEN agence = 'Okala' THEN 1 END) as "Okala",
    COUNT(CASE WHEN agence = 'Nzeng-Ayong' THEN 1 END) as "Nzeng-Ayong",
    COUNT(CASE WHEN agence = 'PK9' THEN 1 END) as "PK9",
    COUNT(CASE WHEN agence = 'Owendo' THEN 1 END) as "Owendo",
    COUNT(CASE WHEN agence = 'Espace Conseil' THEN 1 END) as "Espace Conseil",
    COUNT(*) as total_agent
FROM public.inventory
WHERE agence IS NOT NULL
GROUP BY TRIM(nom_agent_inventaire)
ORDER BY total_agent DESC;

-- ============================================================
-- 5. STATISTIQUES PAR AGENCE ET PAR TYPE DE SOCIÉTÉ
-- ============================================================
SELECT 
    '=== RÉPARTITION PAR AGENCE ET TYPE DE SOCIÉTÉ ===' as titre;

SELECT 
    agence,
    societe_concernee,
    COUNT(*) as nombre_dossiers,
    COUNT(CASE WHEN etat_contrat = 'Actif' THEN 1 END) as actifs,
    COUNT(CASE WHEN etat_contrat = 'Résilié' THEN 1 END) as resilies
FROM public.inventory
WHERE agence IS NOT NULL
GROUP BY agence, societe_concernee
ORDER BY agence, 
    CASE societe_concernee 
        WHEN 'Vie' THEN 1 
        WHEN 'IARD (Sinistre)' THEN 2 
        WHEN 'Production' THEN 3 
    END;

-- ============================================================
-- 6. TOP 5 DES AGENTS PAR AGENCE
-- ============================================================
SELECT 
    '=== TOP 5 AGENTS PAR AGENCE ===' as titre;

-- Utilisation d'une sous-requête pour le TOP 5 (compatible toutes versions PostgreSQL)
SELECT 
    agence,
    agent,
    nombre_dossiers,
    rang
FROM (
    SELECT 
        agence,
        TRIM(nom_agent_inventaire) as agent,
        COUNT(*) as nombre_dossiers,
        ROW_NUMBER() OVER (PARTITION BY agence ORDER BY COUNT(*) DESC) as rang
    FROM public.inventory
    WHERE agence IS NOT NULL
    GROUP BY agence, TRIM(nom_agent_inventaire)
    HAVING COUNT(*) > 0
) ranked
WHERE rang <= 5
ORDER BY agence, nombre_dossiers DESC;
