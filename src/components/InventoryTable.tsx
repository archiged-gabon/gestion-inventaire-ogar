import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui';
import { format } from 'date-fns';
import { logger } from '@/lib/logger';
import { SimpleDuplicateIndicator } from './DuplicateIndicator';
import { detectDuplicates } from '@/utils/duplicateDetection';

export interface InventoryEntry {
  id: string;
  no: number;
  intermediaire_orass: string;
  police_orass: string;
  ancien_numero: string | null;
  date_effet: string;
  date_echeance: string;
  nom_assure: string;
  societe_concernee: string;
  type_document: string;
  nom_agent_inventaire: string;
  created_at: string;
  etat_contrat: string;
  agence: string | null;
}

interface InventoryTableProps {
  entries: InventoryEntry[];
}

export const InventoryTable: React.FC<InventoryTableProps> = ({ entries }) => {
  // Log for debugging deployment issue: render table
  logger.debug('InventoryTable', 'Rendering table', { rows: entries.length });
  
  // Détecter les doublons pour afficher les indicateurs
  const duplicateResult = React.useMemo(() => {
    if (entries.length === 0) return null;
    return detectDuplicates(entries);
  }, [entries]);
  if (entries.length === 0) {
    return (
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl border-2 border-gray-100 p-12 text-center shadow-lg">
        <div className="space-y-4">
          <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-apple-display font-semibold text-gray-900">
            Aucune entrée pour le moment
          </h3>
          <p className="text-sm font-apple-text text-gray-600 max-w-md mx-auto">
            Commencez par ajouter votre premier document en utilisant le formulaire ci-dessus.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border/70 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
      <Table>
        <TableHeader>
          <TableRow className="border-border/70 bg-primary/5">
            <TableHead className="w-16 font-apple-text font-semibold text-foreground">N°</TableHead>
            <TableHead className="font-apple-text font-semibold text-foreground">Intermédiaire ORASS</TableHead>
            <TableHead className="font-apple-text font-semibold text-foreground">Police ORASS</TableHead>
            <TableHead className="font-apple-text font-semibold text-foreground">Ancien numéro</TableHead>
            <TableHead className="font-apple-text font-semibold text-foreground">Date effet</TableHead>
            <TableHead className="font-apple-text font-semibold text-foreground">Date échéance</TableHead>
            <TableHead className="font-apple-text font-semibold text-foreground">Nom assuré</TableHead>
            <TableHead className="font-apple-text font-semibold text-foreground">Type société</TableHead>
            <TableHead className="font-apple-text font-semibold text-foreground">Type document</TableHead>
            <TableHead className="font-apple-text font-semibold text-foreground">Agent inventaire</TableHead>
            <TableHead className="font-apple-text font-semibold text-foreground">Agence</TableHead>
            <TableHead className="font-apple-text font-semibold text-foreground">Créé le</TableHead>
            <TableHead className="font-apple-text font-semibold text-foreground">État contrat</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry, index) => (
            <TableRow key={entry.id} className="border-border/40 hover:bg-accent/5 transition-colors duration-150">
              <TableCell className="font-apple-text font-medium text-foreground">{entry.no}</TableCell>
              <TableCell className="font-apple-text text-foreground/80">{entry.intermediaire_orass}</TableCell>
              <TableCell className="font-apple-text text-foreground/80">{entry.police_orass}</TableCell>
              <TableCell className="font-apple-text text-muted-foreground">{entry.ancien_numero || '-'}</TableCell>
              <TableCell className="font-apple-text text-foreground/80">{format(new Date(entry.date_effet), 'dd/MM/yyyy')}</TableCell>
              <TableCell className="font-apple-text text-foreground/80">{format(new Date(entry.date_echeance), 'dd/MM/yyyy')}</TableCell>
              <TableCell className="font-apple-text text-foreground/80">{entry.nom_assure}</TableCell>
              <TableCell className="font-apple-text">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  entry.societe_concernee === 'Vie' 
                    ? 'bg-primary/10 text-primary' 
                    : entry.societe_concernee === 'IARD (Sinistre)'
                    ? 'bg-red-500/10 text-red-700'
                    : 'bg-accent/15 text-accent-foreground'
                }`}>
                  {entry.societe_concernee}
                </span>
              </TableCell>
              <TableCell className="font-apple-text text-foreground/80">{entry.type_document}</TableCell>
              <TableCell className="font-apple-text text-foreground/80">{entry.nom_agent_inventaire}</TableCell>
              <TableCell className="font-apple-text text-foreground/80">{entry.agence || '-'}</TableCell>
              <TableCell className="font-apple-text text-foreground/80">
                <div className="flex flex-col">
                  <span className="text-sm">{format(new Date(entry.created_at), 'dd/MM/yyyy')}</span>
                  <span className="text-xs text-muted-foreground">{format(new Date(entry.created_at), 'HH:mm:ss')}</span>
                </div>
              </TableCell>
              <TableCell>
                {entry.etat_contrat ? (
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    entry.etat_contrat === 'Actif' 
                      ? 'bg-primary/10 text-primary' 
                      : entry.etat_contrat === 'Résilié'
                      ? 'bg-red-500/10 text-red-700'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {entry.etat_contrat === 'Actif' && (
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-1.5"></div>
                    )}
                    {entry.etat_contrat === 'Résilié' && (
                      <div className="w-2 h-2 bg-red-500 rounded-full mr-1.5"></div>
                    )}
                    {entry.etat_contrat}
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                    <div className="w-2 h-2 bg-gray-400 rounded-full mr-1.5"></div>
                    n/o
                  </span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};