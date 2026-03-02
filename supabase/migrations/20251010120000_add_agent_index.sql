-- Ajouter un index sur nom_agent_inventaire pour accélérer les requêtes statistiques

-- Créer l'index sur nom_agent_inventaire
CREATE INDEX IF NOT EXISTS idx_inventory_agent ON public.inventory (nom_agent_inventaire);

-- Ajouter un commentaire explicatif sur l'index
COMMENT ON INDEX idx_inventory_agent IS 'Index pour accélérer les recherches et statistiques par agent d''inventaire';
