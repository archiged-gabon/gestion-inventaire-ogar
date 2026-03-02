-- Migration pour ajouter une fonction RPC qui calcule les statistiques journalières des agents
-- Cette fonction regroupe les données par jour et par agent en utilisant le champ created_at

-- Création de la fonction get_agent_daily_stats
CREATE OR REPLACE FUNCTION public.get_agent_daily_stats(
  days_limit INTEGER DEFAULT 30  -- Limite le nombre de jours à analyser, par défaut 30 jours
)
RETURNS TABLE (
  date_jour DATE,
  nom_agent_inventaire TEXT,
  total_jour BIGINT
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
    COUNT(*) as total_jour
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
COMMENT ON FUNCTION public.get_agent_daily_stats(INTEGER) IS 'Calcule les statistiques journalières par agent d''inventaire en utilisant le champ created_at';
