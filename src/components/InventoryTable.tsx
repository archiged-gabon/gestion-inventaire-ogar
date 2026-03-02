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
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl border-2 border-gray-100 overflow-hidden shadow-lg">
      <Table>
        <TableHeader>
          <TableRow className="border-gray-200 bg-gray-50/50">
            <TableHead className="w-16 font-apple-text font-semibold text-gray-700">N°</TableHead>
            <TableHead className="font-apple-text font-semibold text-gray-700">Intermédiaire ORASS</TableHead>
            <TableHead className="font-apple-text font-semibold text-gray-700">Police ORASS</TableHead>
            <TableHead className="font-apple-text font-semibold text-gray-700">Ancien numéro</TableHead>
            <TableHead className="font-apple-text font-semibold text-gray-700">Date effet</TableHead>
            <TableHead className="font-apple-text font-semibold text-gray-700">Date échéance</TableHead>
            <TableHead className="font-apple-text font-semibold text-gray-700">Nom assuré</TableHead>
            <TableHead className="font-apple-text font-semibold text-gray-700">Type société</TableHead>
            <TableHead className="font-apple-text font-semibold text-gray-700">Type document</TableHead>
            <TableHead className="font-apple-text font-semibold text-gray-700">Agent inventaire</TableHead>
            <TableHead className="font-apple-text font-semibold text-gray-700">Agence</TableHead>
            <TableHead className="font-apple-text font-semibold text-gray-700">Créé le</TableHead>
            <TableHead className="font-apple-text font-semibold text-gray-700 w-20">Doublon</TableHead>
            <TableHead className="font-apple-text font-semibold text-gray-700">État contrat</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry, index) => (
            <TableRow key={entry.id} className="border-gray-100 hover:bg-blue-50/50 transition-colors duration-150">
              <TableCell className="font-apple-text font-medium text-gray-900">{entry.no}</TableCell>
              <TableCell className="font-apple-text text-gray-700">{entry.intermediaire_orass}</TableCell>
              <TableCell className="font-apple-text text-gray-700">{entry.police_orass}</TableCell>
              <TableCell className="font-apple-text text-gray-500">{entry.ancien_numero || '-'}</TableCell>
              <TableCell className="font-apple-text text-gray-700">{format(new Date(entry.date_effet), 'dd/MM/yyyy')}</TableCell>
              <TableCell className="font-apple-text text-gray-700">{format(new Date(entry.date_echeance), 'dd/MM/yyyy')}</TableCell>
              <TableCell className="font-apple-text text-gray-700">{entry.nom_assure}</TableCell>
              <TableCell className="font-apple-text">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  entry.societe_concernee === 'Vie' 
                    ? 'bg-green-100 text-green-800' 
                    : entry.societe_concernee === 'IARD (Sinistre)'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {entry.societe_concernee}
                </span>
              </TableCell>
              <TableCell className="font-apple-text text-gray-700">{entry.type_document}</TableCell>
              <TableCell className="font-apple-text text-gray-700">{entry.nom_agent_inventaire}</TableCell>
              <TableCell className="font-apple-text text-gray-700">{entry.agence || '-'}</TableCell>
              <TableCell className="font-apple-text text-gray-700">
                <div className="flex flex-col">
                  <span className="text-sm">{format(new Date(entry.created_at), 'dd/MM/yyyy')}</span>
                  <span className="text-xs text-gray-500">{format(new Date(entry.created_at), 'HH:mm:ss')}</span>
                </div>
              </TableCell>
              <TableCell className="text-center">
                {duplicateResult && duplicateResult.entriesWithDuplicates.has(entry.id) && (
                  <SimpleDuplicateIndicator 
                    count={duplicateResult.duplicates.find(group => 
                      group.entries.some(e => e.id === entry.id)
                    )?.count || 2} 
                  />
                )}
              </TableCell>
              <TableCell>
                {entry.etat_contrat ? (
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    entry.etat_contrat === 'Actif' 
                      ? 'bg-green-100 text-green-800' 
                      : entry.etat_contrat === 'Résilié'
                      ? 'bg-red-100 text-red-800'
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