import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { AGENCES, AgenceValue } from '@/components/AgenceModal';

interface AgentModalProps {
  isOpen: boolean;
  onAgentSelected: (agentName: string, agence: AgenceValue) => void;
  agents?: string[];
  isLoadingAgents?: boolean;
}

export const AgentModal: React.FC<AgentModalProps> = ({ isOpen, onAgentSelected, agents = [], isLoadingAgents = false }) => {
  const [agentName, setAgentName] = useState('');
  const [newAgent, setNewAgent] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [selectedAgence, setSelectedAgence] = useState<AgenceValue | ''>('');

  // Basculer entre nouvel agent et agent existant
  const toggleAgentMode = () => {
    setNewAgent(!newAgent);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newAgent && agentName.trim() && selectedAgence) {
      onAgentSelected(agentName.trim(), selectedAgence as AgenceValue);
      logger.info('AgentModal', 'New agent submitted', { name: agentName.trim() });
    } else if (!newAgent && selectedAgent && selectedAgence) {
      onAgentSelected(selectedAgent, selectedAgence as AgenceValue);
      logger.info('AgentModal', 'Existing agent selected', { name: selectedAgent });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-xl font-apple-display font-semibold text-gray-900 text-center">
            Identification de l'agent
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Toggle entre nouvel agent et agent existant */}
          <div className="flex items-center justify-center space-x-4 pb-2">
            <button
              type="button"
              onClick={() => setNewAgent(true)}
              className={`px-4 py-2 text-sm rounded-lg transition-colors ${newAgent 
                ? 'bg-blue-600 text-white font-semibold' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Nouvel agent
            </button>
            <button
              type="button"
              onClick={() => setNewAgent(false)}
              className={`px-4 py-2 text-sm rounded-lg transition-colors ${!newAgent 
                ? 'bg-blue-600 text-white font-semibold' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              disabled={agents.length === 0}
            >
              Agent existant
            </button>
          </div>

          {/* Formulaire pour nouvel agent */}
          {newAgent ? (
            <div className="space-y-2">
              <Label htmlFor="agentName" className="text-sm font-apple-text font-medium text-gray-700">
                Nom du nouvel agent
              </Label>
              <Input
                id="agentName"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                placeholder="Saisissez votre nom complet"
                required
                autoFocus
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="existingAgent" className="text-sm font-apple-text font-medium text-gray-700">
                Sélectionner un agent existant
              </Label>
              <Select 
                value={selectedAgent} 
                onValueChange={setSelectedAgent}
                disabled={isLoadingAgents}
              >
                <SelectTrigger className="h-10 text-base font-apple-text bg-white/90 border-gray-300/60 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 rounded-xl shadow-sm hover:shadow-md focus:shadow-lg">
                  <SelectValue placeholder="Choisir un agent" />
                </SelectTrigger>
                <SelectContent className="max-h-80 overflow-y-auto">
                  {isLoadingAgents ? (
                    <div className="p-4 text-center text-gray-500">
                      <div className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-2"></div>
                      Chargement...
                    </div>
                  ) : agents.length > 0 ? (
                    agents.map((agent) => (
                      <SelectItem key={agent} value={agent}>
                        {agent}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-500">
                      Aucun agent disponible
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="agence" className="text-sm font-apple-text font-medium text-gray-700">
              Sélectionner une agence
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
            disabled={(newAgent && !agentName.trim()) || (!newAgent && !selectedAgent) || !selectedAgence}
          >
            Continuer
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};