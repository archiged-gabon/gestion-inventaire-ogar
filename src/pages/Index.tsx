import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui';
import { InventoryForm } from '@/components/InventoryForm';
import { InventoryTable } from '@/components/InventoryTable';
import { AgentModal } from '@/components/AgentModal';
import { AgentStats } from '@/components/AgentStats';
import { useInventory } from '@/hooks/useInventory';
import { exportToExcel } from '@/utils/excelExport';
import { Download } from 'lucide-react';
import PaginationControls from '@/components/PaginationControls';
import Filters, { FiltersState } from '@/components/Filters';
import { DuplicateManager } from '@/components/DuplicateManager';
import { ExportDropdownMenu } from '@/components/ExportDropdownMenu';
import { logger } from '@/lib/logger';
import { toast } from '@/hooks/use-toast';
import { AgenceValue } from '@/components/AgenceModal';

const Index = () => {
  const { 
    entries, isLoading, isSubmitting, submissionSuccess, addEntry, deleteEntry,
    page, totalPages, setPage, totalCount, pageSize,
    filters, setFilters, resetFilters,
    sort, setSort, getFilteredStats, refreshEntries,
    // Nouvelles propriétés pour les agents et leurs statistiques
    agents, isLoadingAgents, agentStats, isLoadingStats, fetchAgentStats,
    // Propriétés pour les statistiques journalières
    agentDailyStats, isLoadingDailyStats, fetchAgentDailyStats
  } = useInventory();
  const [agentName, setAgentName] = useState<string>('');
  const [agence, setAgence] = useState<AgenceValue | null>(null);
  const [showAgentModal, setShowAgentModal] = useState<boolean>(true);
  const [filteredStats, setFilteredStats] = useState<{
    total: number;
    vie: number;
    iard: number;
    production: number;
  }>({ total: 0, vie: 0, iard: 0, production: 0 });

  // Check if agent is already identified from localStorage
  useEffect(() => {
    const savedAgent = localStorage.getItem('inventoryAgent');
    const savedAgence = localStorage.getItem('inventoryAgence') as AgenceValue | null;
    if (savedAgent) {
      setAgentName(savedAgent);
    }
    if (savedAgent && savedAgence) {
      setAgence(savedAgence as AgenceValue);
      setShowAgentModal(false);
    }
    logger.info('Index', 'Index page mounted');
  }, []);

  // Mise à jour des statistiques filtrées quand les filtres changent
  useEffect(() => {
    const updateStats = async () => {
      if (getFilteredStats) {
        const stats = await getFilteredStats();
        setFilteredStats(stats);
        logger.info('Index', 'Updated filtered stats', stats);
      }
    };
    updateStats();
  }, [filters, getFilteredStats]);

  const handleAgentSelected = (name: string, selectedAgence: AgenceValue) => {
    setAgentName(name);
    setAgence(selectedAgence);
    localStorage.setItem('inventoryAgent', name);
    localStorage.setItem('inventoryAgence', selectedAgence);
    setShowAgentModal(false);
    logger.info('Index', 'Agent selected', { name, agence: selectedAgence });
    
    // Actualiser les statistiques des agents après sélection d'un nouvel agent
    fetchAgentStats();
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSubmit = async (data: any) => {
    logger.info('Index', 'Submit inventory form');
    await addEntry(data, agentName, agence || null);
  };

  const handleExport = async (societeConcernee?: 'Vie' | 'IARD (Sinistre)' | 'Production') => {
    if (entries.length === 0 && !societeConcernee) {
      toast({
        title: "Aucune donnée à exporter.",
        variant: "destructive",
      });
      return;
    }
    
    if (societeConcernee) {
      logger.info('Index', 'Export to Excel clicked with filter', { 
        societeConcernee,
        isFilteredExport: true
      });
      await exportToExcel(undefined, societeConcernee);
    } else {
      logger.info('Index', 'Export to Excel clicked', { count: entries.length });
      await exportToExcel(entries);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <AgentModal 
        isOpen={showAgentModal} 
        onAgentSelected={handleAgentSelected} 
        agents={agents} 
        isLoadingAgents={isLoadingAgents} 
      />
      
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="container mx-auto px-4 py-8 md:py-12 space-y-8 md:space-y-12">
        {/* Header Section */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-apple-display font-bold text-gray-900 mb-4 tracking-tight">
            Bordereau d'Inventaire
          </h1>
          <p className="text-base md:text-lg font-apple-text text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Gérez efficacement votre inventaire documentaire avec une interface moderne et intuitive
          </p>
        </div>

        {/* Form Section */}
        <InventoryForm 
          onSubmit={handleSubmit} 
          isSubmitting={isSubmitting} 
          agentName={agentName}
          onSuccess={submissionSuccess ? () => {
            // Callback simplifié - pas besoin de refreshEntries() car déjà fait dans addEntry()
            logger.info('Index', 'Form submission success callback');
          } : undefined}
        />

        {/* Stats Section - Utilise les statistiques filtrées */}
        {filteredStats.total > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200/60 p-4 md:p-6 text-center shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="text-2xl md:text-3xl font-apple-display font-bold text-blue-600 mb-2">
                {filteredStats.total}
              </div>
              <div className="text-xs md:text-sm font-apple-text text-gray-600">
                {filteredStats.total === 1 ? 'Entrée filtrée' : 'Entrées filtrées'}
              </div>
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200/60 p-4 md:p-6 text-center shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="text-2xl md:text-3xl font-apple-display font-bold text-green-600 mb-2">
                {filteredStats.vie}
              </div>
              <div className="text-xs md:text-sm font-apple-text text-gray-600">Polices Vie</div>
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200/60 p-4 md:p-6 text-center shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="text-2xl md:text-3xl font-apple-display font-bold text-red-600 mb-2">
                {filteredStats.iard}
              </div>
              <div className="text-xs md:text-sm font-apple-text text-gray-600">IARD (Sinistre)</div>
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200/60 p-4 md:p-6 text-center shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="text-2xl md:text-3xl font-apple-display font-bold text-blue-600 mb-2">
                {filteredStats.production}
              </div>
              <div className="text-xs md:text-sm font-apple-text text-gray-600">Production</div>
            </div>
          </div>
        )}

        {/* Table Section */}
        <div className="space-y-6">
          <h2 className="text-xl md:text-2xl font-apple-display font-semibold text-gray-900">
            Entrées existantes
          </h2>
          {/* Filtres */}
          <Filters 
            value={filters as FiltersState}
            onChange={setFilters}
            onReset={resetFilters}
            sort={sort}
            onSortChange={setSort}
          />

          <InventoryTable entries={entries} />

          {/* Gestionnaire de doublons */}
          <DuplicateManager 
            entries={entries} 
            onEntriesChange={refreshEntries}
          />

          {/* Pagination */}
          <div className="flex justify-center">
            <PaginationControls 
              page={page}
              totalPages={totalPages}
              onPageChange={(p) => setPage(p)}
            />
          </div>
        </div>

        {/* Agent Stats Section */}
        <div className="space-y-6">
          <h2 className="text-xl md:text-2xl font-apple-display font-semibold text-gray-900">
            Statistiques des agents
          </h2>
          <AgentStats 
            stats={agentStats} 
            dailyStats={agentDailyStats}
            isLoading={isLoadingStats} 
            isLoadingDailyStats={isLoadingDailyStats}
          />
        </div>
        
        {/* Export Section */}
        <div className="flex justify-center">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Bouton d'export global */}
            <Button 
              onClick={() => handleExport()}
              disabled={entries.length === 0}
              className="flex items-center justify-center gap-3 h-12 md:h-14 px-6 md:px-8 text-sm md:text-base font-apple-text bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl shadow-lg shadow-green-500/25 hover:shadow-xl hover:shadow-green-500/30 transition-all duration-300"
              size="lg"
            >
              <Download className="h-4 w-4 md:h-5 md:w-5" />
              <span className="hidden sm:inline">Exporter toutes les données</span>
              <span className="sm:hidden">Export complet</span>
            </Button>

            {/* Boutons d'export par société avec menus déroulants */}
            <div className="flex flex-wrap justify-center gap-3">
              <ExportDropdownMenu societeConcernee="Vie" color="blue" agence={agence || null} />
              <ExportDropdownMenu societeConcernee="IARD (Sinistre)" color="red" agence={agence || null} />
              <ExportDropdownMenu societeConcernee="Production" color="purple" agence={agence || null} />
            </div>
          </div>
        </div>
        </div>
      </div>
    </>
  );
};

export default Index;
