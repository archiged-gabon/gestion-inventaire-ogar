import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertTriangle, Users, Eye } from 'lucide-react';
import { 
  DuplicateGroup, 
  getDuplicatePriority, 
  getDuplicateBadgeColor, 
  formatDuplicateMessage 
} from '@/utils/duplicateDetection';

interface DuplicateIndicatorProps {
  duplicateGroup: DuplicateGroup;
  onViewDetails?: (group: DuplicateGroup) => void;
  showDetails?: boolean;
}

/**
 * Composant pour afficher un indicateur visuel de doublon
 */
export const DuplicateIndicator: React.FC<DuplicateIndicatorProps> = ({ 
  duplicateGroup, 
  onViewDetails,
  showDetails = true 
}) => {
  const priority = getDuplicatePriority(duplicateGroup.count);
  const badgeColor = getDuplicateBadgeColor(priority);
  const message = formatDuplicateMessage(duplicateGroup.count);
  
  // Icône selon la priorité
  const getIcon = () => {
    switch (priority) {
      case 'critical':
        return <AlertTriangle className="h-3 w-3" />;
      case 'high':
        return <AlertTriangle className="h-3 w-3" />;
      case 'medium':
        return <Users className="h-3 w-3" />;
      case 'low':
        return <Users className="h-3 w-3" />;
      default:
        return <Users className="h-3 w-3" />;
    }
  };
  
  // Contenu du tooltip avec détails
  const tooltipContent = (
    <div className="space-y-2 text-sm">
      <div className="font-semibold">{message}</div>
      <div className="space-y-1">
        <div><strong>Police ORASS:</strong> {duplicateGroup.fields.police_orass}</div>
        <div><strong>Intermédiaire:</strong> {duplicateGroup.fields.intermediaire_orass}</div>
        <div><strong>Assuré:</strong> {duplicateGroup.fields.nom_assure}</div>
        <div><strong>Date effet:</strong> {new Date(duplicateGroup.fields.date_effet).toLocaleDateString('fr-FR')}</div>
      </div>
      {showDetails && onViewDetails && (
        <div className="pt-2 border-t border-gray-200">
          <button
            onClick={() => onViewDetails(duplicateGroup)}
            className="text-blue-600 hover:text-blue-800 text-xs font-medium flex items-center gap-1"
          >
            <Eye className="h-3 w-3" />
            Voir les détails
          </button>
        </div>
      )}
    </div>
  );
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className={`${badgeColor} border font-medium text-xs px-2 py-1 cursor-help`}
          >
            <div className="flex items-center gap-1">
              {getIcon()}
              <span>{duplicateGroup.count}</span>
            </div>
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

/**
 * Composant pour afficher un indicateur simple (sans tooltip)
 */
export const SimpleDuplicateIndicator: React.FC<{ count: number }> = ({ count }) => {
  const priority = getDuplicatePriority(count);
  const badgeColor = getDuplicateBadgeColor(priority);
  const message = formatDuplicateMessage(count);
  
  const getIcon = () => {
    switch (priority) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="h-3 w-3" />;
      case 'medium':
      case 'low':
        return <Users className="h-3 w-3" />;
      default:
        return <Users className="h-3 w-3" />;
    }
  };
  
  return (
    <Badge 
      variant="outline" 
      className={`${badgeColor} border font-medium text-xs px-2 py-1`}
      title={message}
    >
      <div className="flex items-center gap-1">
        {getIcon()}
        <span>{count}</span>
      </div>
    </Badge>
  );
};

/**
 * Composant pour afficher les statistiques globales des doublons
 */
interface DuplicateStatsProps {
  totalGroups: number;
  totalEntries: number;
  criticalGroups: number;
  highGroups: number;
  mediumGroups: number;
  lowGroups: number;
}

export const DuplicateStats: React.FC<DuplicateStatsProps> = ({
  totalGroups,
  totalEntries,
  criticalGroups,
  highGroups,
  mediumGroups,
  lowGroups
}) => {
  if (totalGroups === 0) {
    return null;
  }
  
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-yellow-600" />
        <h3 className="font-semibold text-yellow-800">Doublons détectés</h3>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <div className="space-y-1">
          <div className="text-gray-600">Total groupes</div>
          <div className="font-semibold text-gray-900">{totalGroups}</div>
        </div>
        
        <div className="space-y-1">
          <div className="text-gray-600">Total entrées</div>
          <div className="font-semibold text-gray-900">{totalEntries}</div>
        </div>
        
        {criticalGroups > 0 && (
          <div className="space-y-1">
            <div className="text-red-600">Critiques</div>
            <div className="font-semibold text-red-800">{criticalGroups}</div>
          </div>
        )}
        
        {highGroups > 0 && (
          <div className="space-y-1">
            <div className="text-orange-600">Élevés</div>
            <div className="font-semibold text-orange-800">{highGroups}</div>
          </div>
        )}
      </div>
      
      <div className="text-xs text-yellow-700">
        {criticalGroups > 0 && (
          <div>⚠️ {criticalGroups} groupe(s) critique(s) nécessitent une attention immédiate</div>
        )}
        {highGroups > 0 && criticalGroups === 0 && (
          <div>⚠️ {highGroups} groupe(s) à priorité élevée détecté(s)</div>
        )}
      </div>
    </div>
  );
};
