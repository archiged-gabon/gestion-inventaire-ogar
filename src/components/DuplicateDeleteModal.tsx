import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Trash2, Eye, Calendar, User, Building, FileText } from 'lucide-react';
import { InventoryEntry } from '@/components/InventoryTable';
import { DuplicateGroup } from '@/utils/duplicateDetection';
import { format } from 'date-fns';

interface DuplicateDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (entryId: string) => Promise<void>;
  duplicateGroup: DuplicateGroup | null;
  isDeleting: boolean;
}

/**
 * Composant modal pour confirmer la suppression d'une entrée en doublon
 */
export const DuplicateDeleteModal: React.FC<DuplicateDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  duplicateGroup,
  isDeleting
}) => {
  if (!duplicateGroup) return null;
  
  const handleConfirm = async (entryId: string) => {
    try {
      await onConfirm(entryId);
      onClose();
    } catch (error) {
      // L'erreur est gérée par le parent
      console.error('Erreur lors de la suppression:', error);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Confirmation de suppression - Doublon détecté
          </DialogTitle>
          <DialogDescription>
            Vous êtes sur le point de supprimer une entrée qui fait partie d'un groupe de doublons. 
            Cette action est irréversible.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Informations sur le groupe de doublons */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                {duplicateGroup.count} doublon(s) détecté(s)
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">Police ORASS:</span>
                </div>
                <div className="pl-6 text-gray-700">{duplicateGroup.fields.police_orass}</div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">Intermédiaire:</span>
                </div>
                <div className="pl-6 text-gray-700">{duplicateGroup.fields.intermediaire_orass}</div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">Assuré:</span>
                </div>
                <div className="pl-6 text-gray-700">{duplicateGroup.fields.nom_assure}</div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">Date effet:</span>
                </div>
                <div className="pl-6 text-gray-700">
                  {format(new Date(duplicateGroup.fields.date_effet), 'dd/MM/yyyy')}
                </div>
              </div>
            </div>
          </div>
          
          {/* Liste des entrées en doublon */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Entrées en doublon ({duplicateGroup.entries.length})
            </h3>
            
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {duplicateGroup.entries.map((entry, index) => (
                <div 
                  key={entry.id} 
                  className="border border-gray-200 rounded-lg p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          N° {entry.no}
                        </Badge>
                        {index === 0 && (
                          <Badge variant="outline" className="bg-green-100 text-green-800 text-xs">
                            Plus ancien
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                        <div>
                          <span className="font-medium">Agent:</span> {entry.nom_agent_inventaire}
                        </div>
                        <div>
                          <span className="font-medium">Créé le:</span> {format(new Date(entry.created_at), 'dd/MM/yyyy HH:mm')}
                        </div>
                        <div>
                          <span className="font-medium">Type document:</span> {entry.type_document}
                        </div>
                        <div>
                          <span className="font-medium">Société:</span> {entry.societe_concernee}
                        </div>
                      </div>
                    </div>
                    
                    <div className="ml-4">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleConfirm(entry.id)}
                        disabled={isDeleting}
                        className="flex items-center gap-1"
                      >
                        <Trash2 className="h-3 w-3" />
                        Supprimer le dossier
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Avertissement */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <div className="text-sm text-red-800">
                <div className="font-semibold mb-1">Attention !</div>
                <ul className="space-y-1 text-xs">
                  <li>• Cette action est irréversible</li>
                  <li>• L'entrée sera définitivement supprimée de la base de données</li>
                  <li>• Vérifiez bien que vous supprimez la bonne entrée</li>
                  <li>• Il est recommandé de garder l'entrée la plus ancienne</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isDeleting}
          >
            Annuler
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/**
 * Composant modal simplifié pour confirmer la suppression d'une seule entrée
 */
interface SimpleDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  entry: InventoryEntry | null;
  isDeleting: boolean;
}

export const SimpleDeleteModal: React.FC<SimpleDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  entry,
  isDeleting
}) => {
  if (!entry) return null;
  
  const handleConfirm = async () => {
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Confirmation de suppression
          </DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir supprimer cette entrée ? Cette action est irréversible.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Détails de l'entrée */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  N° {entry.no}
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 gap-2 text-xs text-gray-600">
                <div>
                  <span className="font-medium">Police ORASS:</span> {entry.police_orass}
                </div>
                <div>
                  <span className="font-medium">Intermédiaire:</span> {entry.intermediaire_orass}
                </div>
                <div>
                  <span className="font-medium">Assuré:</span> {entry.nom_assure}
                </div>
                <div>
                  <span className="font-medium">Agent:</span> {entry.nom_agent_inventaire}
                </div>
                <div>
                  <span className="font-medium">Créé le:</span> {format(new Date(entry.created_at), 'dd/MM/yyyy HH:mm')}
                </div>
              </div>
            </div>
          </div>
          
          {/* Avertissement */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
              <div className="text-xs text-red-800">
                <div className="font-semibold mb-1">Attention !</div>
                <div>Cette action est irréversible. L'entrée sera définitivement supprimée.</div>
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isDeleting}
          >
            Annuler
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleConfirm}
            disabled={isDeleting}
            className="flex items-center gap-1"
          >
            <Trash2 className="h-3 w-3" />
            {isDeleting ? 'Suppression...' : 'Supprimer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
