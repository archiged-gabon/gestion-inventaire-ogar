-- Migration pour ajouter une fonction RPC qui calcule les statistiques des agents
-- avec répartition par type de société (Vie, IARD, Production)
-- Cette fonction complète les statistiques existantes avec le détail par société

-- Création de la fonction get_agent_stats_by_societe_type pour calculer les statistiques détaillées par agent et société
CREATE OR REPLACE FUNCTION public.get_agent_stats_by_societe_type()
RETURNS TABLE (
  nom_agent_inventaire TEXT,
  total BIGINT,
  derniere_activite TIMESTAMPTZ,
  total_actifs BIGINT,
  total_resilies BIGINT,
  vie_total BIGINT,
  vie_actifs BIGINT,
  vie_resilies BIGINT,
  iard_total BIGINT,
  iard_actifs BIGINT,
  iard_resilies BIGINT,
  production_total BIGINT,
  production_actifs BIGINT,
  production_resilies BIGINT
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
    COUNT(*) FILTER (WHERE i.etat_contrat = 'Résilié') as total_resilies,
    -- Statistiques Vie
    COUNT(*) FILTER (WHERE i.societe_concernee = 'Vie') as vie_total,
    COUNT(*) FILTER (WHERE i.societe_concernee = 'Vie' AND i.etat_contrat = 'Actif') as vie_actifs,
    COUNT(*) FILTER (WHERE i.societe_concernee = 'Vie' AND i.etat_contrat = 'Résilié') as vie_resilies,
    -- Statistiques IARD
    COUNT(*) FILTER (WHERE i.societe_concernee = 'IARD (Sinistre)') as iard_total,
    COUNT(*) FILTER (WHERE i.societe_concernee = 'IARD (Sinistre)' AND i.etat_contrat = 'Actif') as iard_actifs,
    COUNT(*) FILTER (WHERE i.societe_concernee = 'IARD (Sinistre)' AND i.etat_contrat = 'Résilié') as iard_resilies,
    -- Statistiques Production
    COUNT(*) FILTER (WHERE i.societe_concernee = 'Production') as production_total,
    COUNT(*) FILTER (WHERE i.societe_concernee = 'Production' AND i.etat_contrat = 'Actif') as production_actifs,
    COUNT(*) FILTER (WHERE i.societe_concernee = 'Production' AND i.etat_contrat = 'Résilié') as production_resilies
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
COMMENT ON FUNCTION public.get_agent_stats_by_societe_type() IS 'Calcule les statistiques détaillées par agent d''inventaire avec répartition par type de société (Vie, IARD, Production) et état de contrat';

-- Création d'une fonction similaire pour les statistiques journalières par type de société
CREATE OR REPLACE FUNCTION public.get_agent_daily_stats_by_societe_type(
  days_limit INTEGER DEFAULT 30
)
RETURNS TABLE (
  date_jour DATE,
  nom_agent_inventaire TEXT,
  total_jour BIGINT,
  total_jour_actifs BIGINT,
  total_jour_resilies BIGINT,
  vie_total_jour BIGINT,
  vie_actifs_jour BIGINT,
  vie_resilies_jour BIGINT,
  iard_total_jour BIGINT,
  iard_actifs_jour BIGINT,
  iard_resilies_jour BIGINT,
  production_total_jour BIGINT,
  production_actifs_jour BIGINT,
  production_resilies_jour BIGINT
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
    COUNT(*) FILTER (WHERE i.etat_contrat = 'Résilié') as total_jour_resilies,
    -- Statistiques Vie journalières
    COUNT(*) FILTER (WHERE i.societe_concernee = 'Vie') as vie_total_jour,
    COUNT(*) FILTER (WHERE i.societe_concernee = 'Vie' AND i.etat_contrat = 'Actif') as vie_actifs_jour,
    COUNT(*) FILTER (WHERE i.societe_concernee = 'Vie' AND i.etat_contrat = 'Résilié') as vie_resilies_jour,
    -- Statistiques IARD journalières
    COUNT(*) FILTER (WHERE i.societe_concernee = 'IARD (Sinistre)') as iard_total_jour,
    COUNT(*) FILTER (WHERE i.societe_concernee = 'IARD (Sinistre)' AND i.etat_contrat = 'Actif') as iard_actifs_jour,
    COUNT(*) FILTER (WHERE i.societe_concernee = 'IARD (Sinistre)' AND i.etat_contrat = 'Résilié') as iard_resilies_jour,
    -- Statistiques Production journalières
    COUNT(*) FILTER (WHERE i.societe_concernee = 'Production') as production_total_jour,
    COUNT(*) FILTER (WHERE i.societe_concernee = 'Production' AND i.etat_contrat = 'Actif') as production_actifs_jour,
    COUNT(*) FILTER (WHERE i.societe_concernee = 'Production' AND i.etat_contrat = 'Résilié') as production_resilies_jour
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
COMMENT ON FUNCTION public.get_agent_daily_stats_by_societe_type(INTEGER) IS 'Calcule les statistiques journalières détaillées par agent d''inventaire avec répartition par type de société (Vie, IARD, Production) et état de contrat';
