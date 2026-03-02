-- Migration pour mettre à jour les fonctions RPC de statistiques des agents
-- en incluant la distinction entre contrats actifs et résiliés

-- Supprimer les fonctions existantes avant de les recréer
DROP FUNCTION IF EXISTS public.get_agent_stats();
DROP FUNCTION IF EXISTS public.get_agent_daily_stats(INTEGER);
DROP FUNCTION IF EXISTS public.get_filtered_stats(TEXT, TEXT, TEXT, DATE, DATE);

-- Recréation de la fonction get_agent_stats pour inclure les contrats actifs et résiliés
CREATE FUNCTION public.get_agent_stats()
RETURNS TABLE (
  nom_agent_inventaire TEXT,
  total BIGINT,
  derniere_activite TIMESTAMPTZ,
  total_actifs BIGINT,
  total_resilies BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.nom_agent_inventaire,
    COUNT(*) as total,
    MAX(i.created_at) as derniere_activite,
    COUNT(*) FILTER (WHERE i.etat_contrat = 'Actif') as total_actifs,
    COUNT(*) FILTER (WHERE i.etat_contrat = 'Résilié') as total_resilies
  FROM 
    inventory i
  WHERE 
    i.nom_agent_inventaire != ''
  GROUP BY 
    i.nom_agent_inventaire
  ORDER BY 
    total DESC;
END;
$$;

-- Ajout de commentaire explicatif pour la documentation
COMMENT ON FUNCTION public.get_agent_stats() IS 'Calcule les statistiques agrégées par agent d''inventaire, incluant le nombre de contrats actifs et résiliés';

-- Recréation de la fonction get_agent_daily_stats pour inclure les contrats actifs et résiliés
CREATE FUNCTION public.get_agent_daily_stats(
  days_limit INTEGER DEFAULT 30
)
RETURNS TABLE (
  date_jour DATE,
  nom_agent_inventaire TEXT,
  total_jour BIGINT,
  total_jour_actifs BIGINT,
  total_jour_resilies BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE(i.created_at) as date_jour,
    i.nom_agent_inventaire,
    COUNT(*) as total_jour,
    COUNT(*) FILTER (WHERE i.etat_contrat = 'Actif') as total_jour_actifs,
    COUNT(*) FILTER (WHERE i.etat_contrat = 'Résilié') as total_jour_resilies
  FROM 
    inventory i
  WHERE 
    i.nom_agent_inventaire != '' 
    AND i.created_at >= CURRENT_DATE - days_limit
  GROUP BY 
    DATE(i.created_at),
    i.nom_agent_inventaire
  ORDER BY 
    date_jour DESC,
    total_jour DESC;
END;
$$;

-- Ajout de commentaire explicatif pour la documentation
COMMENT ON FUNCTION public.get_agent_daily_stats(INTEGER) IS 'Calcule les statistiques journalières par agent d''inventaire, incluant le nombre de contrats actifs et résiliés';

-- Recréation de la fonction get_filtered_stats pour inclure les contrats actifs et résiliés
CREATE FUNCTION public.get_filtered_stats(
  keyword TEXT DEFAULT NULL,
  societe_concernee TEXT DEFAULT NULL,
  type_document TEXT DEFAULT NULL,
  date_effet_from DATE DEFAULT NULL,
  date_effet_to DATE DEFAULT NULL,
  etat_contrat TEXT DEFAULT NULL
)
RETURNS TABLE (
  societe_type TEXT,
  total BIGINT,
  total_actifs BIGINT,
  total_resilies BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  query_text TEXT;
  conditions TEXT := '';
BEGIN
  -- Construction dynamique de la requête avec filtres
  IF keyword IS NOT NULL AND keyword != '' THEN
    conditions := conditions || 
      format(' AND (intermediaire_orass ILIKE %L OR police_orass ILIKE %L OR nom_assure ILIKE %L OR ancien_numero ILIKE %L)',
        '%' || keyword || '%', '%' || keyword || '%', '%' || keyword || '%', '%' || keyword || '%');
  END IF;
  
  IF societe_concernee IS NOT NULL AND societe_concernee != '' THEN
    conditions := conditions || format(' AND societe_concernee = %L', societe_concernee);
  END IF;
  
  IF type_document IS NOT NULL AND type_document != '' THEN
    conditions := conditions || format(' AND type_document ILIKE %L', '%' || type_document || '%');
  END IF;
  
  IF date_effet_from IS NOT NULL THEN
    conditions := conditions || format(' AND date_effet >= %L', date_effet_from);
  END IF;
  
  IF date_effet_to IS NOT NULL THEN
    conditions := conditions || format(' AND date_effet <= %L', date_effet_to);
  END IF;
  
  IF etat_contrat IS NOT NULL AND etat_contrat != '' THEN
    conditions := conditions || format(' AND etat_contrat = %L', etat_contrat);
  END IF;
  
  -- Enlever le "AND" initial si des conditions existent
  IF conditions != '' THEN
    conditions := 'WHERE ' || substring(conditions FROM 5);
  END IF;
  
  -- Construire et exécuter la requête
  query_text := format('
    SELECT 
      COALESCE(societe_concernee, ''Autre'') as societe_type,
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE etat_contrat = ''Actif'') as total_actifs,
      COUNT(*) FILTER (WHERE etat_contrat = ''Résilié'') as total_resilies
    FROM inventory
    %s
    GROUP BY societe_concernee
  ', conditions);
  
  -- Exécuter la requête dynamique
  RETURN QUERY EXECUTE query_text;
END;
$$;

-- Ajout de commentaire explicatif pour la documentation
COMMENT ON FUNCTION public.get_filtered_stats(TEXT, TEXT, TEXT, DATE, DATE, TEXT) IS 'Calcule les statistiques filtrées par critères, incluant le nombre de contrats actifs et résiliés';