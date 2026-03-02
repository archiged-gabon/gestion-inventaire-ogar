import React from 'react';
import { AGENCES, AgenceValue } from './AgenceModal';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Settings2 } from 'lucide-react';
import { logger } from '@/lib/logger';

interface AgenceBannerProps {
  currentAgence: AgenceValue | null;
  onAgenceChange: (agence: AgenceValue) => void;
}

export const AgenceBanner: React.FC<AgenceBannerProps> = ({ currentAgence, onAgenceChange }) => {
  if (!currentAgence) {
    return null;
  }

  const agenceLabel = AGENCES.find(a => a.value === currentAgence)?.label || currentAgence;

  const handleAgenceChange = (newAgence: AgenceValue) => {
    logger.info('AgenceBanner', 'Changing agence', { from: currentAgence, to: newAgence });
    onAgenceChange(newAgence);
  };

  return (
    <div className="bg-gradient-to-r from-blue-100 via-indigo-100 to-blue-100 border-b border-blue-200/50 shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-apple-text text-gray-700">
              Agence actuelle :
            </span>
            <span className="text-base font-apple-display font-semibold text-blue-900">
              {agenceLabel}
            </span>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-600 hover:text-blue-700 hover:bg-blue-50/50"
                title="Changer d'agence"
              >
                <Settings2 className="w-4 h-4 mr-2" />
                <span className="text-sm">Changer</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {AGENCES.map((agence) => (
                <DropdownMenuItem
                  key={agence.value}
                  onClick={() => handleAgenceChange(agence.value)}
                  className={currentAgence === agence.value ? 'bg-blue-50 font-semibold' : ''}
                >
                  {agence.label}
                  {currentAgence === agence.value && (
                    <span className="ml-auto text-blue-600">✓</span>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};
