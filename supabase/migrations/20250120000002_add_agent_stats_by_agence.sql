-- Migration pour ajouter des fonctions RPC qui calculent les statistiques des agents par agence
-- Ces fonctions permettent d'afficher les statistiques détaillées avec répartition par agence

-- Fonction pour obtenir les statistiques des agents par agence
CREATE OR REPLACE FUNCTION public.get_agent_stats_by_agence()
RETURNS TABLE (
  nom_agent_inventaire TEXT,
  total BIGINT,
  derniere_activite TIMESTAMPTZ,
  total_actifs BIGINT,
  total_resilies BIGINT,
  -- Statistiques par agence
  okala_total BIGINT,
  nzeng_ayong_total BIGINT,
  pk9_total BIGINT,
  owendo_total BIGINT,
  espace_conseil_total BIGINT,
  -- Statistiques par type de société (conservées pour compatibilité)
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
    -- Statistiques par agence
    COUNT(*) FILTER (WHERE i.agence = 'Okala') as okala_total,
    COUNT(*) FILTER (WHERE i.agence = 'Nzeng-Ayong') as nzeng_ayong_total,
    COUNT(*) FILTER (WHERE i.agence = 'PK9') as pk9_total,
    COUNT(*) FILTER (WHERE i.agence = 'Owendo') as owendo_total,
    COUNT(*) FILTER (WHERE i.agence = 'Espace Conseil') as espace_conseil_total,
    -- Statistiques par type de société
    COUNT(*) FILTER (WHERE i.societe_concernee = 'Vie') as vie_total,
    COUNT(*) FILTER (WHERE i.societe_concernee = 'Vie' AND i.etat_contrat = 'Actif') as vie_actifs,
    COUNT(*) FILTER (WHERE i.societe_concernee = 'Vie' AND i.etat_contrat = 'Résilié') as vie_resilies,
    COUNT(*) FILTER (WHERE i.societe_concernee = 'IARD (Sinistre)') as iard_total,
    COUNT(*) FILTER (WHERE i.societe_concernee = 'IARD (Sinistre)' AND i.etat_contrat = 'Actif') as iard_actifs,
    COUNT(*) FILTER (WHERE i.societe_concernee = 'IARD (Sinistre)' AND i.etat_contrat = 'Résilié') as iard_resilies,
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
COMMENT ON FUNCTION public.get_agent_stats_by_agence() IS 'Calcule les statistiques détaillées par agent d''inventaire avec répartition par agence (Okala, Nzeng-Ayong, PK9, Owendo, Espace Conseil) et par type de société';
