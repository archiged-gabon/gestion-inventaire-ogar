-- Vérification des entrées OLOLO en octobre 2025

-- Entrées OLOLO en octobre 2025
SELECT 
    TRIM(nom_agent_inventaire) as agent,
    DATE(created_at) as date_creation,
    EXTRACT(DAY FROM created_at) as jour,
    COUNT(*) as nombre_entrees,
    STRING_AGG(DISTINCT agence, ', ' ORDER BY agence) as agences
FROM public.inventory
WHERE UPPER(TRIM(nom_agent_inventaire)) LIKE 'OLOLO%'
  AND EXTRACT(YEAR FROM created_at) = 2025
  AND EXTRACT(MONTH FROM created_at) = 10
GROUP BY TRIM(nom_agent_inventaire), DATE(created_at), EXTRACT(DAY FROM created_at)
ORDER BY date_creation DESC;

-- Résumé par jour pour OLOLO en octobre 2025
SELECT 
    EXTRACT(DAY FROM created_at) as jour_octobre,
    COUNT(*) as nombre_entrees,
    STRING_AGG(DISTINCT agence, ', ' ORDER BY agence) as agences
FROM public.inventory
WHERE UPPER(TRIM(nom_agent_inventaire)) LIKE 'OLOLO%'
  AND EXTRACT(YEAR FROM created_at) = 2025
  AND EXTRACT(MONTH FROM created_at) = 10
GROUP BY EXTRACT(DAY FROM created_at)
ORDER BY jour_octobre;
