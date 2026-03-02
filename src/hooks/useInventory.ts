import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { InventoryEntry } from '@/components/InventoryTable';
import { InventoryFormData } from '@/components/InventoryForm';
import { logger } from '@/lib/logger';
import { checkPotentialDuplicate } from '@/utils/duplicateDetection';
import type { TablesInsert } from '@/integrations/supabase/types';

// Types de tri et filtres exposés par le hook pour un usage réutilisable
export type InventorySortColumn = 'no' | 'date_effet' | 'date_echeance' | 'created_at';
export type InventorySortDirection = 'asc' | 'desc';

export type InventorySort = {
  column: InventorySortColumn;
  direction: InventorySortDirection;
};


export type InventoryFilters = {
  keyword?: string; // Recherche plein texte simple sur quelques colonnes clés
  societe_concernee?: 'Vie' | 'IARD (Sinistre)' | 'Production';
  type_document?: string;
  date_effet_from?: string; // format YYYY-MM-DD
  date_effet_to?: string;   // format YYYY-MM-DD
  etat_contrat?: 'Actif' | 'Résilié';
};

// Type pour les statistiques d'agents
export type AgentStats = {
  nom_agent_inventaire: string;
  total: number;
  derniere_activite: string;
  total_actifs: number;
  total_resilies: number;
  // Statistiques par agence
  okala_total: number;
  nzeng_ayong_total: number;
  pk9_total: number;
  owendo_total: number;
  espace_conseil_total: number;
  // Statistiques par type de société
  vie_total: number;
  vie_actifs: number;
  vie_resilies: number;
  iard_total: number;
  iard_actifs: number;
  iard_resilies: number;
  production_total: number;
  production_actifs: number;
  production_resilies: number;
};

// Type pour les statistiques journalières des agents
export type AgentDailyStats = {
  date_jour: string;
  nom_agent_inventaire: string;
  total_jour: number;
  total_jour_actifs: number;
  total_jour_resilies: number;
  // Statistiques journalières par type de société
  vie_total_jour: number;
  vie_actifs_jour: number;
  vie_resilies_jour: number;
  iard_total_jour: number;
  iard_actifs_jour: number;
  iard_resilies_jour: number;
  production_total_jour: number;
  production_actifs_jour: number;
  production_resilies_jour: number;
};

export const useInventory = () => {
  const [entries, setEntries] = useState<InventoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [agents, setAgents] = useState<string[]>([]);
  const [agentStats, setAgentStats] = useState<AgentStats[]>([]);
  const [agentDailyStats, setAgentDailyStats] = useState<AgentDailyStats[]>([]);
  const [isLoadingAgents, setIsLoadingAgents] = useState(true);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingDailyStats, setIsLoadingDailyStats] = useState(true);
  
  // Référence pour empêcher les soumissions multiples
  const submissionLockRef = useRef<boolean>(false);
  const submissionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // État pagination/tri/filtres
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [totalCount, setTotalCount] = useState<number>(0);
  const totalPages = useMemo(() => Math.max(1, Math.ceil(totalCount / pageSize)), [totalCount, pageSize]);

  const [sort, setSort] = useState<InventorySort>({ column: 'created_at', direction: 'desc' });
  const [filters, setFilters] = useState<InventoryFilters>({});

  type RpcReturn<T> = Promise<{ data: T | null; error: unknown }>;
  const rpc = React.useCallback(<T>(fn: string, args?: Record<string, unknown>): RpcReturn<T> => {
    const client = supabase as unknown as {
      rpc: (fn: string, args?: Record<string, unknown>) => Promise<{ data: T | null; error: unknown }>
    };
    return client.rpc(fn, args);
  }, []);

  type AgentsRow = { id: string; normalized_name?: string };
  type AgentsFrom = {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        maybeSingle: () => Promise<{ data: AgentsRow | null; error: unknown }>
      }
    };
    insert: (row: { display_name: string; normalized_name: string }) => {
      select: (columns: string) => {
        single: () => Promise<{ data: { id: string } | null; error: unknown }>
      }
    };
  };
  const fromAgents = (): AgentsFrom => {
    const client = supabase as unknown as { from: (table: 'agents') => AgentsFrom };
    return client.from('agents');
  };

  type FilteredStatsRow = {
    societe_type: string;
    total: number;
    total_actifs?: number | null;
    total_resilies?: number | null;
  };
  type AgentStatsRPCRow = {
    nom_agent_inventaire: string;
    total: number;
    derniere_activite: string;
    total_actifs?: number | null;
    total_resilies?: number | null;
    okala_total?: number | null;
    nzeng_ayong_total?: number | null;
    pk9_total?: number | null;
    owendo_total?: number | null;
    espace_conseil_total?: number | null;
    vie_total?: number | null;
    vie_actifs?: number | null;
    vie_resilies?: number | null;
    iard_total?: number | null;
    iard_actifs?: number | null;
    iard_resilies?: number | null;
    production_total?: number | null;
    production_actifs?: number | null;
    production_resilies?: number | null;
  };
  type AgentDailyStatsRPCRow = {
    date_jour: string;
    nom_agent_inventaire: string;
    total_jour: number;
    total_jour_actifs?: number | null;
    total_jour_resilies?: number | null;
    vie_total_jour?: number | null;
    vie_actifs_jour?: number | null;
    vie_resilies_jour?: number | null;
    iard_total_jour?: number | null;
    iard_actifs_jour?: number | null;
    iard_resilies_jour?: number | null;
    production_total_jour?: number | null;
    production_actifs_jour?: number | null;
    production_resilies_jour?: number | null;
  };

  // Fonction utilitaire pour normaliser les chaînes de recherche
  const normalizeSearchTerm = (term: string): string => {
    return term
      .trim()
      .toLowerCase()
      .normalize('NFD') // Décompose les caractères accentués
      .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
      .replace(/\s+/g, ' '); // Normalise les espaces multiples
  };

  const buildQuery = () => {
    // Sélecteur avec comptage exact pour calculer le total côté serveur
    let query = supabase.from('inventory').select('*', { count: 'exact' });

    // Filtres avec nettoyage et validation
    if (filters.keyword) {
      const kw = normalizeSearchTerm(filters.keyword);
      if (kw.length > 0) {
        // Recherche case-insensitive et sans accents sur plusieurs colonnes via OR
        query = query.or(
          `intermediaire_orass.ilike.%${kw}%,police_orass.ilike.%${kw}%,nom_assure.ilike.%${kw}%,ancien_numero.ilike.%${kw}%`,
        );
      }
    }
    
    if (filters.societe_concernee) {
      query = query.eq('societe_concernee', filters.societe_concernee);
    }
    
    if (filters.type_document) {
      const typeDoc = filters.type_document.trim();
      if (typeDoc.length > 0) {
        query = query.ilike('type_document', `%${typeDoc}%`);
      }
    }
    
    if (filters.date_effet_from) {
      query = query.gte('date_effet', filters.date_effet_from);
    }
    
    if (filters.date_effet_to) {
      query = query.lte('date_effet', filters.date_effet_to);
    }
    
    if (filters.etat_contrat) {
      query = query.eq('etat_contrat', filters.etat_contrat);
    }

    // Tri
    query = query.order(sort.column, { ascending: sort.direction === 'asc' });

    // Pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    return query;
  };

  const fetchEntries = async () => {
    setIsLoading(true);
    logger.info('useInventory', 'Fetching entries', { page, pageSize, sort, filters });
    try {
      const query = buildQuery();
      const { data, error, count } = await query;
      if (error) throw error;
      setEntries(data || []);
      setTotalCount(count || 0);
      logger.info('useInventory', 'Fetch success', { returned: data?.length ?? 0, totalCount: count });
    } catch (error) {
      console.error('Error fetching entries:', error);
      logger.error('useInventory', 'Fetch failed', { error: String(error) });
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les entrées.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addEntry = async (data: InventoryFormData, agentName: string, agence: string | null) => {
    // Vérifier si une soumission est déjà en cours
    if (submissionLockRef.current) {
      logger.warn('useInventory', 'Submission blocked - already in progress');
      toast({
        title: 'Information',
        description: 'Une soumission est déjà en cours. Veuillez patienter.',
        variant: 'destructive',
      });
      return;
    }
    
    // Vérifier les doublons potentiels avant soumission
    const duplicateCheck = checkPotentialDuplicate(data, entries);
    if (duplicateCheck.isDuplicate && duplicateCheck.existingEntry) {
      logger.warn('useInventory', 'Duplicate detected', { 
        police_orass: data.police_orass,
        existingEntry: duplicateCheck.existingEntry.id 
      });
      toast({
        title: 'Doublon détecté',
        description: `Une entrée avec ces données existe déjà (N° ${duplicateCheck.existingEntry.no}). Veuillez vérifier les informations.`,
        variant: 'destructive',
      });
      return;
    }
    
    // Activer le verrou de soumission
    submissionLockRef.current = true;
    setIsSubmitting(true);
    setSubmissionSuccess(false);
    
    // Nettoyer le timeout précédent s'il existe
    if (submissionTimeoutRef.current) {
      clearTimeout(submissionTimeoutRef.current);
    }
    
    try {
      logger.info('useInventory', 'Adding entry', { agentName, agence, police_orass: data.police_orass });
      
      // Résoudre ou créer l'agent pour obtenir agent_id
      const normalizedAgent = normalizeSearchTerm(agentName);
      let agentId: string | null = null;

      // Tenter de trouver l'agent par normalized_name
      const { data: existingAgent, error: findAgentError } = await fromAgents()
        .select('id, normalized_name')
        .eq('normalized_name', normalizedAgent)
        .maybeSingle();

      if (findAgentError) {
        logger.warn('useInventory', 'Find agent failed, will attempt create', { error: String(findAgentError) });
      }

      if (existingAgent && existingAgent.id) {
        agentId = existingAgent.id;
      } else {
        // Créer l'agent s'il n'existe pas
        const { data: newAgent, error: createAgentError } = await fromAgents()
          .insert({ display_name: agentName, normalized_name: normalizedAgent })
          .select('id')
          .single();
        if (createAgentError) {
          // Conflit possible sur unique(normalized_name): réessayer un select
          logger.warn('useInventory', 'Create agent failed, retrying select', { error: String(createAgentError) });
          const { data: retryAgent } = await fromAgents()
            .select('id')
            .eq('normalized_name', normalizedAgent)
            .maybeSingle();
          agentId = retryAgent?.id ?? null;
        } else {
          agentId = newAgent?.id ?? null;
        }
      }

      if (!agentId) {
        throw new Error('Impossible de résoudre agent_id pour l\'agent sélectionné');
      }

      const insertData = {
        intermediaire_orass: data.intermediaire_orass,
        police_orass: data.police_orass,
        ancien_numero: data.ancien_numero || null,
        date_effet: data.date_effet.toISOString().split('T')[0],
        date_echeance: data.date_echeance.toISOString().split('T')[0],
        nom_assure: data.nom_assure,
        societe_concernee: data.societe_concernee,
        type_document: data.type_document,
        nom_agent_inventaire: agentName,
        etat_contrat: data.etat_contrat,
        agence: agence,
        agent_id: agentId,
      } as unknown as TablesInsert<'inventory'>;

      const { error } = await supabase
        .from('inventory')
        .insert(insertData);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Entrée ajoutée avec succès.',
      });

      await fetchEntries();
      setSubmissionSuccess(true);
      logger.info('useInventory', 'Add entry success');
      
      // Réinitialiser l'état de succès après un délai pour permettre au formulaire de se réinitialiser
      setTimeout(() => {
        setSubmissionSuccess(false);
        logger.info('useInventory', 'Reset submission success state');
      }, 1000);
      
    } catch (error) {
      console.error('Error adding entry:', error);
      logger.error('useInventory', 'Add entry failed', { error: String(error) });
      
      // Vérifier si c'est une erreur de doublon côté serveur
      if (error instanceof Error && error.message.includes('doublon')) {
        toast({
          title: 'Doublon détecté',
          description: 'Cette entrée existe déjà dans la base de données.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Erreur',
          description: 'Erreur lors de l\'ajout de l\'entrée.',
          variant: 'destructive',
        });
      }
      
      setSubmissionSuccess(false);
    } finally {
      setIsSubmitting(false);
      
      // Libérer le verrou après un délai pour éviter les clics multiples rapides
      submissionTimeoutRef.current = setTimeout(() => {
        submissionLockRef.current = false;
        logger.info('useInventory', 'Submission lock released');
      }, 2000); // 2 secondes de délai
    }
  };

  useEffect(() => {
    fetchEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, JSON.stringify(filters), sort.column, sort.direction]);

  // Aides pagination
  const nextPage = () => setPage((p) => Math.min(totalPages, p + 1));
  const prevPage = () => setPage((p) => Math.max(1, p - 1));
  const updatePage = (p: number) => setPage(() => Math.min(Math.max(1, p), totalPages));

// Hook pour récupérer les statistiques basées sur les filtres appliqués
const getFilteredStats = React.useCallback(async () => {
  try {
    logger.info('useInventory', 'Fetching filtered stats via RPC', { filters });

    // Utiliser la nouvelle fonction RPC pour obtenir des statistiques filtrées
    const { data, error } = await rpc<FilteredStatsRow[]>('get_filtered_stats', {
      keyword: filters.keyword ? normalizeSearchTerm(filters.keyword) : null,
      societe_concernee: filters.societe_concernee || null,
      type_document: filters.type_document ? filters.type_document.trim() : null,
      date_effet_from: filters.date_effet_from || null,
      date_effet_to: filters.date_effet_to || null,
      etat_contrat: filters.etat_contrat || null
    });

    if (error) throw error;

    // Initialiser les valeurs par défaut
    const stats = {
      total: 0,
      vie: 0,
      iard: 0,
      production: 0,
      actifs: 0,
      resilies: 0
    };

    // Calculer les totaux à partir des résultats agrégés
    if (data && data.length > 0) {
      // Calculer le total d'entrées, actifs et résiliés
      stats.total = data.reduce((sum, item) => sum + Number(item.total), 0);
      stats.actifs = data.reduce((sum, item) => sum + Number(item.total_actifs || 0), 0);
      stats.resilies = data.reduce((sum, item) => sum + Number(item.total_resilies || 0), 0);
      
      // Répartir par type de société
      data.forEach(item => {
        if (item.societe_type === 'Vie') {
          stats.vie = Number(item.total);
        } else if (item.societe_type === 'IARD (Sinistre)') {
          stats.iard = Number(item.total);
        } else if (item.societe_type === 'Production') {
          stats.production = Number(item.total);
        }
      });
    }

    logger.info('useInventory', 'Filtered stats success', { 
      stats, 
      filterCount: Object.keys(filters).filter(k => !!filters[k as keyof InventoryFilters]).length 
    });
    
    // Pour maintenir la compatibilité avec le code existant qui attend un format précis
    // On ne retourne que les statistiques utilisées par l'interface actuelle
    return {
      total: stats.total,
      vie: stats.vie,
      iard: stats.iard,
      production: stats.production
    };
  } catch (error) {
    console.error('Error fetching filtered stats:', error);
    logger.error('useInventory', 'Filtered stats failed', { error: String(error) });
    return { total: 0, vie: 0, iard: 0, production: 0 };
  }
}, [filters, rpc]);

  // Fonction pour supprimer une entrée
  const deleteEntry = async (entryId: string) => {
    try {
      logger.info('useInventory', 'Deleting entry', { entryId });
      
      const { error } = await supabase
        .from('inventory')
        .delete()
        .eq('id', entryId);
      
      if (error) throw error;
      
      toast({
        title: 'Succès',
        description: 'Entrée supprimée avec succès.',
      });
      
      // Rafraîchir la liste des entrées
      await fetchEntries();
      
      logger.info('useInventory', 'Entry deleted successfully', { entryId });
    } catch (error) {
      console.error('Error deleting entry:', error);
      logger.error('useInventory', 'Delete failed', { error: String(error) });
      toast({
        title: 'Erreur',
        description: 'Erreur lors de la suppression de l\'entrée.',
        variant: 'destructive',
      });
      throw error; // Re-throw pour que le composant puisse gérer l'erreur
    }
  };

  // Gestion filtres: réinitialiser la page à 1
  const applyFilters = (next: InventoryFilters) => {
    setPage(1);
    setFilters(next);
  };
  const resetFilters = () => {
    setPage(1);
    setFilters({});
  };

  // Fonction pour récupérer la liste des agents distincts
  const fetchAgents = async () => {
    setIsLoadingAgents(true);
    logger.info('useInventory', 'Fetching agents');
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('nom_agent_inventaire')
        .not('nom_agent_inventaire', 'eq', '')
        .order('nom_agent_inventaire');

      if (error) throw error;
      
      // Extraire les noms d'agents uniques
      const uniqueAgents = [...new Set(data?.map(item => item.nom_agent_inventaire) || [])];
      setAgents(uniqueAgents);
      logger.info('useInventory', 'Fetch agents success', { count: uniqueAgents.length });
    } catch (error) {
      console.error('Error fetching agents:', error);
      logger.error('useInventory', 'Fetch agents failed', { error: String(error) });
      toast({
        title: 'Erreur',
        description: 'Impossible de charger la liste des agents.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingAgents(false);
    }
  };

// Fonction pour récupérer les statistiques des agents avec la fonction RPC
const fetchAgentStats = React.useCallback(async () => {
  setIsLoadingStats(true);
  logger.info('useInventory', 'Fetching agent stats via RPC');
  try {
    const { data, error } = await rpc<AgentStatsRPCRow[]>('get_agent_stats_by_agence');

    if (error) throw error;

    const formattedStats: AgentStats[] = (data || []).map((item: AgentStatsRPCRow) => ({
      nom_agent_inventaire: item.nom_agent_inventaire,
      total: Number(item.total),
      derniere_activite: item.derniere_activite,
      total_actifs: Number(item.total_actifs || 0),
      total_resilies: Number(item.total_resilies || 0),
      okala_total: Number(item.okala_total || 0),
      nzeng_ayong_total: Number(item.nzeng_ayong_total || 0),
      pk9_total: Number(item.pk9_total || 0),
      owendo_total: Number(item.owendo_total || 0),
      espace_conseil_total: Number(item.espace_conseil_total || 0),
      vie_total: Number(item.vie_total || 0),
      vie_actifs: Number(item.vie_actifs || 0),
      vie_resilies: Number(item.vie_resilies || 0),
      iard_total: Number(item.iard_total || 0),
      iard_actifs: Number(item.iard_actifs || 0),
      iard_resilies: Number(item.iard_resilies || 0),
      production_total: Number(item.production_total || 0),
      production_actifs: Number(item.production_actifs || 0),
      production_resilies: Number(item.production_resilies || 0)
    }));
    
    setAgentStats(formattedStats);
    logger.info('useInventory', 'Fetch agent stats success', { 
      count: formattedStats.length,
      totalEntriesAcrossAgents: formattedStats.reduce((sum, stat) => sum + stat.total, 0)
    });
  } catch (error) {
    console.error('Error fetching agent stats:', error);
    logger.error('useInventory', 'Fetch agent stats failed', { error: String(error) });
    toast({
      title: 'Erreur',
      description: 'Impossible de charger les statistiques des agents.',
      variant: 'destructive',
    });
  } finally {
    setIsLoadingStats(false);
  }
}, [rpc]);

// Fonction pour récupérer les statistiques journalières des agents
const fetchAgentDailyStats = React.useCallback(async (daysLimit: number = 30) => {
  setIsLoadingDailyStats(true);
  logger.info('useInventory', 'Fetching agent daily stats via RPC', { daysLimit });
  try {
    const { data, error } = await rpc<AgentDailyStatsRPCRow[]>('get_agent_daily_stats_by_societe_type', {
      days_limit: daysLimit
    });

    if (error) throw error;

    const formattedStats: AgentDailyStats[] = (data || []).map((item: AgentDailyStatsRPCRow) => ({
      date_jour: item.date_jour,
      nom_agent_inventaire: item.nom_agent_inventaire,
      total_jour: Number(item.total_jour),
      total_jour_actifs: Number(item.total_jour_actifs || 0),
      total_jour_resilies: Number(item.total_jour_resilies || 0),
      vie_total_jour: Number(item.vie_total_jour || 0),
      vie_actifs_jour: Number(item.vie_actifs_jour || 0),
      vie_resilies_jour: Number(item.vie_resilies_jour || 0),
      iard_total_jour: Number(item.iard_total_jour || 0),
      iard_actifs_jour: Number(item.iard_actifs_jour || 0),
      iard_resilies_jour: Number(item.iard_resilies_jour || 0),
      production_total_jour: Number(item.production_total_jour || 0),
      production_actifs_jour: Number(item.production_actifs_jour || 0),
      production_resilies_jour: Number(item.production_resilies_jour || 0)
    }));
    
    setAgentDailyStats(formattedStats);
    logger.info('useInventory', 'Fetch agent daily stats success', { 
      count: formattedStats.length,
      daysCount: [...new Set(formattedStats.map(item => item.date_jour))].length
    });
  } catch (error) {
    console.error('Error fetching agent daily stats:', error);
    logger.error('useInventory', 'Fetch agent daily stats failed', { error: String(error) });
    toast({
      title: 'Erreur',
      description: 'Impossible de charger les statistiques journalières des agents.',
      variant: 'destructive',
    });
  } finally {
    setIsLoadingDailyStats(false);
  }
}, [rpc]);

// Charger la liste des agents et leurs statistiques au montage du composant
  useEffect(() => {
    fetchAgents();
    fetchAgentStats();
    fetchAgentDailyStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchAgentStats, fetchAgentDailyStats]);

  // Actualiser les agents et leurs statistiques après chaque ajout/suppression
  // Utiliser un ref pour éviter les appels multiples
  const statsRefreshRef = useRef<boolean>(false);
  
  useEffect(() => {
    if (submissionSuccess && !statsRefreshRef.current) {
      statsRefreshRef.current = true;
      
      // Actualiser les statistiques des agents une seule fois
      Promise.all([
        fetchAgents(),
        fetchAgentStats(),
        fetchAgentDailyStats()
      ]).then(() => {
        logger.info('useInventory', 'All agent stats refreshed after submission');
        // Réinitialiser le flag après un délai pour permettre un nouveau cycle
        setTimeout(() => {
          statsRefreshRef.current = false;
        }, 1000);
      }).catch((error) => {
        logger.error('useInventory', 'Error refreshing agent stats', { error });
        statsRefreshRef.current = false;
      });
    }
  }, [submissionSuccess]);

  return {
    entries,
    isLoading,
    isSubmitting,
    submissionSuccess,
    addEntry,
    deleteEntry,
    refreshEntries: fetchEntries,
    // Pagination/tri/filtres
    page,
    pageSize,
    setPage: updatePage,
    setPageSize,
    totalCount,
    totalPages,
    nextPage,
    prevPage,
    sort,
    setSort,
    filters,
    setFilters: applyFilters,
    resetFilters,
    // Statistiques filtrées
    getFilteredStats,
    // Agents
    agents,
    isLoadingAgents,
    fetchAgents,
    // Statistiques des agents
    agentStats,
    isLoadingStats,
    fetchAgentStats,
    // Statistiques journalières des agents
    agentDailyStats,
    isLoadingDailyStats,
    fetchAgentDailyStats,
  };
};