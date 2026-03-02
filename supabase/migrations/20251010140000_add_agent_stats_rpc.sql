-- Migration pour ajouter une fonction RPC qui calcule les statistiques des agents
-- Cette fonction résout le problème de limitation à 1000 entrées en effectuant l'agrégation côté serveur

-- Création de la fonction get_agent_stats pour calculer les statistiques par agent
CREATE OR REPLACE FUNCTION public.get_agent_stats()
RETURNS TABLE (
  nom_agent_inventaire TEXT,
  total BIGINT,
  derniere_activite TIMESTAMPTZ
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
    MAX(i.created_at) as derniere_activite
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
COMMENT ON FUNCTION public.get_agent_stats() IS 'Calcule les statistiques agrégées par agent d''inventaire (nombre total et dernière activité)';

-- Création d'une fonction supplémentaire pour les statistiques filtrées
CREATE OR REPLACE FUNCTION public.get_filtered_stats(
  keyword TEXT DEFAULT NULL,
  societe_concernee TEXT DEFAULT NULL,
  type_document TEXT DEFAULT NULL,
  date_effet_from DATE DEFAULT NULL,
  date_effet_to DATE DEFAULT NULL
)
RETURNS TABLE (
  societe_type TEXT,
  total BIGINT
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
  
  -- Enlever le "AND" initial si des conditions existent
  IF conditions != '' THEN
    conditions := 'WHERE ' || substring(conditions FROM 5);
  END IF;
  
  -- Construire et exécuter la requête
  query_text := format('
    SELECT 
      COALESCE(societe_concernee, ''Autre'') as societe_type,
      COUNT(*) as total
    FROM inventory
    %s
    GROUP BY societe_concernee
  ', conditions);
  
  -- Exécuter la requête dynamique
  RETURN QUERY EXECUTE query_text;
END;
$$;

-- Ajout de commentaire explicatif pour la documentation
COMMENT ON FUNCTION public.get_filtered_stats(TEXT, TEXT, TEXT, DATE, DATE) IS 'Calcule les statistiques filtrées par critères (mot-clé, société, type document, dates)';
