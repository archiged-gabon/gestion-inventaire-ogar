import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { logger } from '@/lib/logger';

// Liste des agences disponibles
export const AGENCES = [
  { value: 'Okala', label: 'Agence Okala' },
  { value: 'Site Okala', label: 'Site Okala' },
  { value: 'Nzeng-Ayong', label: 'Agence Nzeng-Ayong' },
  { value: 'PK9', label: 'Agence PK9' },
  { value: 'Espace Conseil', label: 'Espace Conseil' },
  { value: 'Owendo', label: 'Agence Owendo' },
] as const;

export type AgenceValue = typeof AGENCES[number]['value'];

interface AgenceModalProps {
  isOpen: boolean;
  onAgenceSelected: (agence: AgenceValue) => void;
  currentAgence?: AgenceValue | null;
}

export const AgenceModal: React.FC<AgenceModalProps> = ({ 
  isOpen, 
  onAgenceSelected,
  currentAgence 
}) => {
  const [selectedAgence, setSelectedAgence] = useState<AgenceValue | ''>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedAgence) {
      onAgenceSelected(selectedAgence as AgenceValue);
      logger.info('AgenceModal', 'Agence selected', { agence: selectedAgence });
    }
  };

  // Préremplir avec l'agence actuelle si disponible
  React.useEffect(() => {
    if (currentAgence && !selectedAgence) {
      setSelectedAgence(currentAgence);
    }
  }, [currentAgence, selectedAgence]);

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-xl font-apple-display font-semibold text-gray-900 text-center">
            Sélection de l'agence
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="agence" className="text-sm font-apple-text font-medium text-gray-700">
              Veuillez sélectionner votre agence actuelle
            </Label>
            <Select 
              value={selectedAgence} 
              onValueChange={(value) => setSelectedAgence(value as AgenceValue)}
            >
              <SelectTrigger className="h-10 text-base font-apple-text bg-white/90 border-gray-300/60 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 rounded-xl shadow-sm hover:shadow-md focus:shadow-lg">
                <SelectValue placeholder="Choisir une agence" />
              </SelectTrigger>
              <SelectContent className="max-h-80 overflow-y-auto">
                {AGENCES.map((agence) => (
                  <SelectItem key={agence.value} value={agence.value}>
                    {agence.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button 
            type="submit" 
            className="w-full h-12 text-base font-apple-text"
            disabled={!selectedAgence}
          >
            Continuer
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
