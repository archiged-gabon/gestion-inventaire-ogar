import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Eye, Trash2, RefreshCw, Download } from 'lucide-react';
import { InventoryEntry } from '@/components/InventoryTable';
import { 
  DuplicateGroup, 
  DuplicateDetectionResult, 
  detectDuplicates, 
  getDuplicateStats 
} from '@/utils/duplicateDetection';
import { DuplicateIndicator } from './DuplicateIndicator';
import { DuplicateStats } from './DuplicateIndicator';
import { DuplicateDeleteModal } from './DuplicateDeleteModal';
import { SimpleDeleteModal } from './DuplicateDeleteModal';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { format } from 'date-fns';

interface DuplicateManagerProps {
  entries: InventoryEntry[];
  onEntriesChange: () => void;
}

/**
 * Composant principal pour gérer les doublons
 */
export const DuplicateManager: React.FC<DuplicateManagerProps> = ({ 
  entries, 
  onEntriesChange 
}) => {
  const [duplicateResult, setDuplicateResult] = useState<DuplicateDetectionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<DuplicateGroup | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<InventoryEntry | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSimpleDeleteModal, setShowSimpleDeleteModal] = useState(false);
  
  // Détecter les doublons quand les entrées changent
  useEffect(() => {
    if (entries.length > 0) {
      const result = detectDuplicates(entries);
      setDuplicateResult(result);
      logger.info('DuplicateManager', 'Duplicates detected', { 
        totalGroups: result.duplicates.length, 
        totalEntries: result.totalDuplicates 
      });
    } else {
      setDuplicateResult(null);
    }
  }, [entries]);
  
  // Fonction pour supprimer une entrée
  const handleDeleteEntry = async (entryId: string) => {
    setIsDeleting(true);
    try {
      logger.info('DuplicateManager', 'Deleting entry', { entryId });
      
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
      onEntriesChange();
      
      logger.info('DuplicateManager', 'Entry deleted successfully', { entryId });
    } catch (error) {
      console.error('Error deleting entry:', error);
      logger.error('DuplicateManager', 'Delete failed', { error: String(error) });
      toast({
        title: 'Erreur',
        description: 'Erreur lors de la suppression de l\'entrée.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Fonction pour ouvrir la modale de suppression de doublon
  const handleViewDuplicateDetails = (group: DuplicateGroup) => {
    setSelectedGroup(group);
    setShowDeleteModal(true);
  };
  
  // Fonction pour ouvrir la modale de suppression simple
  const handleDeleteEntrySimple = (entry: InventoryEntry) => {
    setSelectedEntry(entry);
    setShowSimpleDeleteModal(true);
  };
  
  // Fonction pour exporter les doublons
  const handleExportDuplicates = () => {
    if (!duplicateResult || duplicateResult.duplicates.length === 0) {
      toast({
        title: 'Information',
        description: 'Aucun doublon à exporter.',
      });
      return;
    }
    
    try {
      // Créer un CSV avec les doublons
      const csvContent = generateDuplicateCSV(duplicateResult.duplicates);
      downloadCSV(csvContent, 'doublons_inventaire.csv');
      
      toast({
        title: 'Succès',
        description: 'Export des doublons téléchargé.',
      });
      
      logger.info('DuplicateManager', 'Duplicates exported', { 
        count: duplicateResult.duplicates.length 
      });
    } catch (error) {
      console.error('Error exporting duplicates:', error);
      toast({
        title: 'Erreur',
        description: 'Erreur lors de l\'export des doublons.',
        variant: 'destructive',
      });
    }
  };
  
  // Fonction pour générer le CSV des doublons
  const generateDuplicateCSV = (duplicates: DuplicateGroup[]): string => {
    const headers = [
      'Groupe',
      'Nombre de doublons',
      'Police ORASS',
      'Intermédiaire ORASS',
      'Nom assuré',
      'Date effet',
      'N° entrée',
      'Agent inventaire',
      'Type document',
      'Société concernée',
      'Date création'
    ];
    
    const rows = duplicates.flatMap((group, groupIndex) => 
      group.entries.map((entry, entryIndex) => [
        groupIndex + 1,
        group.count,
        group.fields.police_orass,
        group.fields.intermediaire_orass,
        group.fields.nom_assure,
        group.fields.date_effet,
        entry.no,
        entry.nom_agent_inventaire,
        entry.type_document,
        entry.societe_concernee,
        format(new Date(entry.created_at), 'dd/MM/yyyy HH:mm')
      ])
    );
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    return csvContent;
  };
  
  // Fonction pour télécharger le CSV
  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  if (!duplicateResult || duplicateResult.duplicates.length === 0) {
    return null;
  }
  
  const stats = getDuplicateStats(duplicateResult);
  
  return (
    <div className="space-y-6">
      {/* Statistiques des doublons */}
      <DuplicateStats {...stats} />
      
      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportDuplicates}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Exporter les doublons
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEntriesChange()}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>
      
      {/* Liste des groupes de doublons */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Groupes de doublons ({duplicateResult.duplicates.length})
        </h3>
        
        <div className="grid gap-4">
          {duplicateResult.duplicates.map((group, index) => (
            <Card key={group.key} className="border-l-4 border-l-yellow-400">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-base">
                      Groupe {index + 1}
                    </CardTitle>
                    <DuplicateIndicator 
                      duplicateGroup={group}
                      onViewDetails={handleViewDuplicateDetails}
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {group.entries.length} entrée(s)
                    </Badge>
                  </div>
                </div>
                
                <CardDescription className="text-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div><strong>Police ORASS:</strong> {group.fields.police_orass}</div>
                    <div><strong>Intermédiaire:</strong> {group.fields.intermediaire_orass}</div>
                    <div><strong>Assuré:</strong> {group.fields.nom_assure}</div>
                    <div><strong>Date effet:</strong> {format(new Date(group.fields.date_effet), 'dd/MM/yyyy')}</div>
                  </div>
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {group.entries.map((entry) => (
                    <div 
                      key={entry.id} 
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            N° {entry.no}
                          </Badge>
                          <span className="text-sm text-gray-600">
                            Créé le {format(new Date(entry.created_at), 'dd/MM/yyyy HH:mm')}
                          </span>
                        </div>
                        
                        <div className="text-sm text-gray-700">
                          <span className="font-medium">Agent:</span> {entry.nom_agent_inventaire} • 
                          <span className="font-medium"> Type:</span> {entry.type_document} • 
                          <span className="font-medium"> Société:</span> {entry.societe_concernee}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDuplicateDetails(group)}
                          className="flex items-center gap-1"
                        >
                          <Eye className="h-3 w-3" />
                          Détails
                        </Button>
                        
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteEntrySimple(entry)}
                          disabled={isDeleting}
                          className="flex items-center gap-1"
                        >
                          <Trash2 className="h-3 w-3" />
                          Supprimer
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      
      {/* Modales */}
      <DuplicateDeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteEntry}
        duplicateGroup={selectedGroup}
        isDeleting={isDeleting}
      />
      
      <SimpleDeleteModal
        isOpen={showSimpleDeleteModal}
        onClose={() => setShowSimpleDeleteModal(false)}
        onConfirm={() => selectedEntry ? handleDeleteEntry(selectedEntry.id) : Promise.resolve()}
        entry={selectedEntry}
        isDeleting={isDeleting}
      />
    </div>
  );
};
