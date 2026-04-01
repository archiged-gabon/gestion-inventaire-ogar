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

// Type pour les filtres
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
  site_okala_total: number;
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
  // Statistiques journalières par agence
  okala_total_jour: number;
  site_okala_total_jour: number;
  nzeng_ayong_total_jour: number;
  pk9_total_jour: number;
  owendo_total_jour: number;
  espace_conseil_total_jour: number;
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

// Type pour les statistiques filtrées
export type FilteredStats = {
  total: number;
  vie: number;
  iard: number;
  production: number;
};

export const useInventory = () => {
  const [allEntries, setAllEntries] = useState<InventoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [agents, setAgents] = useState<string[]>([]);
  const [agentStats, setAgentStats] = useState<AgentStats[]>([]);
  const [agentDailyStats, setAgentDailyStats] = useState<AgentDailyStats[]>([]);
  const [isLoadingAgents, setIsLoadingAgents] = useState(true);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingDailyStats, setIsLoadingDailyStats] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [sort, setSort] = useState<InventorySort>({ column: 'created_at', direction: 'desc' });
  const [filters, setFilters] = useState<InventoryFilters>({});

  // Référence pour empêcher les soumissions multiples
  const submissionLockRef = useRef<boolean>(false);
  const submissionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Filtrage instantané côté client
  const filteredEntries = useMemo(() => {
    let filtered = [...allEntries];
    const kw = filters.keyword?.trim().toLowerCase();
    if (kw) {
      filtered = filtered.filter(e =>
        (e.intermediaire_orass || '').toLowerCase().includes(kw) ||
        (e.police_orass || '').toLowerCase().includes(kw) ||
        (e.nom_assure || '').toLowerCase().includes(kw) ||
        (e.ancien_numero || '').toLowerCase().includes(kw)
      );
    }
    if (filters.societe_concernee) {
      filtered = filtered.filter(e => e.societe_concernee === filters.societe_concernee);
    }
    if (filters.type_document) {
      filtered = filtered.filter(e => (e.type_document || '').toLowerCase().includes(filters.type_document!.toLowerCase()));
    }
    if (filters.date_effet_from) {
      filtered = filtered.filter(e => e.date_effet >= filters.date_effet_from!);
    }
    if (filters.date_effet_to) {
      filtered = filtered.filter(e => e.date_effet <= filters.date_effet_to!);
    }
    // Tri
    const { column, direction } = sort;
    filtered.sort((a, b) => {
      let av: any = a[column];
      let bv: any = b[column];
      if (av instanceof Date) av = av.getTime();
      if (bv instanceof Date) bv = bv.getTime();
      if (typeof av === 'string') av = av.toLowerCase();
      if (typeof bv === 'string') bv = bv.toLowerCase();
      if (av < bv) return direction === 'asc' ? -1 : 1;
      if (av > bv) return direction === 'asc' ? 1 : -1;
      return 0;
    });
    return filtered;
  }, [allEntries, filters, sort]);

  // Pagination côté client
  const entries = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredEntries.slice(start, start + pageSize);
  }, [filteredEntries, page, pageSize]);

  const totalCount = useMemo(() => filteredEntries.length, [filteredEntries.length]);
  const totalPages = useMemo(() => Math.max(1, Math.ceil(totalCount / pageSize)), [totalCount, pageSize]);

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

  const resolveAgenceId = async (code: string): Promise<string | null> => {
    const client = supabase as unknown as {
      from: (table: string) => {
        select: (columns: string) => {
          eq: (column: string, value: string) => {
            maybeSingle: () => Promise<{ data: { id?: string } | null; error: unknown }>
          }
        }
      }
    };

    const { data, error } = await client
      .from('agences')
      .select('id')
      .eq('code', code)
      .maybeSingle();

    if (error) {
      logger.warn('useInventory', 'Resolve agence_id failed', { error: String(error), agence: code });
    }

    return data?.id ?? null;
  };

  type FilteredStatsRow = {
    total: number | null;
    vie: number | null;
    iard: number | null;
    production: number | null;
  };
  type AgentStatsRPCRow = {
    nom_agent_inventaire: string;
    total: number;
    derniere_activite: string;
    total_actifs?: number | null;
    total_resilies?: number | null;
    okala_total?: number | null;
    site_okala_total?: number | null;
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
    okala_total_jour?: number | null;
    site_okala_total_jour?: number | null;
    nzeng_ayong_total_jour?: number | null;
    pk9_total_jour?: number | null;
    owendo_total_jour?: number | null;
    espace_conseil_total_jour?: number | null;
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

  const fetchAllEntries = async () => {
    setIsLoading(true);
    logger.info('useInventory', 'Fetching all entries for client-side filtering');
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setAllEntries(data || []);
      logger.info('useInventory', 'Fetch all entries success', { count: data?.length });
    } catch (error) {
      console.error('Error fetching all entries:', error);
      logger.error('useInventory', 'Fetch all entries failed', { error: String(error) });
      setError('Impossible de charger les entrées.');
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

      // Résoudre agence_id à partir du code agence sélectionné (mode mixte: texte + id)
      let agenceId: string | null = null;
      if (agence) {
        agenceId = await resolveAgenceId(agence);
      }

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
        agence_id: agenceId,
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

      await fetchAllEntries();
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
      const err = error as unknown as {
        code?: string;
        message?: string;
        details?: string;
        hint?: string;
      };

      const message = (err?.message || (error instanceof Error ? error.message : '') || '').toLowerCase();
      const details = (err?.details || '').toLowerCase();
      const hint = (err?.hint || '').toLowerCase();

      const isUniqueViolation = err?.code === '23505';
      const isDuplicateTriggerMessage =
        message.includes('doublon') ||
        details.includes('doublon') ||
        hint.includes('doublon') ||
        message.includes('existe déjà') ||
        message.includes('existe deja');

      if (isUniqueViolation || isDuplicateTriggerMessage) {
        toast({
          title: 'Doublon détecté',
          description: 'Ce dossier est déjà enregistré.',
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
    fetchAllEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Charger toutes les entrées une seule fois au montage

  // Fonction utilitaire pour normaliser les chaînes de recherche
  const normalizeSearchTerm = (term: string): string => {
    return term
      .trim()
      .toLowerCase()
      .normalize('NFD') // Décompose les caractères accentués
      .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
      .replace(/\s+/g, ' '); // Normalise les espaces multiples
  };

  // Aides pagination
  const nextPage = () => setPage((p) => Math.min(totalPages, p + 1));
  const prevPage = () => setPage((p) => Math.max(1, p - 1));
  const updatePage = (p: number) => setPage(() => Math.min(Math.max(1, p), totalPages));

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
      await fetchAllEntries();
      
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

  const applyFilters = (next: InventoryFilters) => {
    setPage(1);
    setFilters(next);
  };
  const resetFilters = () => {
    setPage(1);
    setFilters({});
  };
  const refreshEntries = () => {
    fetchAllEntries();
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
        site_okala_total: Number(item.site_okala_total || 0),
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
        okala_total_jour: Number(item.okala_total_jour || 0),
        site_okala_total_jour: Number(item.site_okala_total_jour || 0),
        nzeng_ayong_total_jour: Number(item.nzeng_ayong_total_jour || 0),
        pk9_total_jour: Number(item.pk9_total_jour || 0),
        owendo_total_jour: Number(item.owendo_total_jour || 0),
        espace_conseil_total_jour: Number(item.espace_conseil_total_jour || 0),
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

  // Hook pour récupérer les statistiques basées sur les filtres appliqués
  const getFilteredStats = React.useCallback(async () => {
    try {
      logger.info('useInventory', 'Fetching filtered stats via RPC', { filters });
      const { data, error } = await rpc<FilteredStatsRow>('get_filtered_stats', {
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
        production: 0
      };

      // Si des données sont retournées, les utiliser
      if (data) {
        stats.total = Number(data.total) || 0;
        stats.vie = Number(data.vie) || 0;
        stats.iard = Number(data.iard) || 0;
        stats.production = Number(data.production) || 0;
      }

      logger.info('useInventory', 'Fetch filtered stats success', stats);
      return stats;
    } catch (error) {
      console.error('Error fetching filtered stats:', error);
      logger.error('useInventory', 'Fetch filtered stats failed', { error: String(error) });
      // Retourner des valeurs par défaut en cas d'erreur
      return {
        total: 0,
        vie: 0,
        iard: 0,
        production: 0
      };
    }
  }, [rpc, filters]);

  // Charger la liste des agents et leurs statistiques au montage
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
    refreshEntries: fetchAllEntries,
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