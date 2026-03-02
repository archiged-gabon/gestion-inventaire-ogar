import * as XLSX from 'xlsx';
import { InventoryEntry } from '@/components/InventoryTable';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

/**
 * Exporte les données d'inventaire au format Excel
 * 
 * @param entries - Entrées d'inventaire à exporter (pour l'export via le tableau)
 * @param societeConcernee - Optionnel: Société concernée pour filtrer les données (pour l'export direct)
 * @param fileName - Optionnel: Nom personnalisé pour le fichier Excel
 * @returns Promise qui se résout lorsque l'export est terminé
 */
export const exportToExcel = async (
  entries?: InventoryEntry[], 
  societeConcernee?: 'Vie' | 'IARD (Sinistre)' | 'Production',
  fileName?: string,
  etatContrat?: 'Actif' | 'Résilié' | 'Tout',
  agence?: string
) => {
  // Si aucune entrée n'est fournie et qu'une société est spécifiée, chercher les données filtrées
  let dataToExport = entries;

  if (!entries && (societeConcernee || etatContrat || agence)) {
    logger.info('excelExport', 'Fetching filtered data', { societeConcernee, etatContrat, agence });
    
    try {
      // Récupérer toutes les données par lots pour éviter la limite de 1000 de Supabase
      let allData: InventoryEntry[] = [];
      const batchSize = 1000;
      let offset = 0;
      let hasMoreData = true;
      let totalFetched = 0;

      // Afficher un toast de progression
      toast({
        title: "Récupération des données en cours...",
        description: "Cette opération peut prendre quelques instants pour de gros volumes.",
      });

      while (hasMoreData) {
        // Construire la requête avec pagination
        let query = supabase
          .from('inventory')
          .select('*')
          .order('no', { ascending: true });

        // Appliquer le filtre par société concernée
        if (societeConcernee) {
          query = query.eq('societe_concernee', societeConcernee);
        }
        
        // Appliquer le filtre par état du contrat si demandé (et pas "Tout")
        if (etatContrat && etatContrat !== 'Tout') {
          query = query.eq('etat_contrat', etatContrat);
        }

        // Appliquer le filtre par agence si fourni
        if (agence) {
          query = query.eq('agence', agence);
        }

        // Appliquer la pagination
        query = query.range(offset, offset + batchSize - 1);

        // Exécuter la requête
        const { data, error } = await query;

        if (error) throw error;

        // Ajouter les données récupérées au résultat global
        if (data && data.length > 0) {
          allData = [...allData, ...data];
          totalFetched += data.length;
          offset += data.length;
          
          // Continuer si nous avons reçu un lot complet (il y a probablement plus de données)
          hasMoreData = data.length === batchSize;
          
          // Log de progression pour le debugging
          logger.info('excelExport', 'Batch fetched', { 
            batchSize: data.length, 
            totalFetched, 
            hasMoreData 
          });
        } else {
          hasMoreData = false;
        }
      }

      if (allData.length === 0) {
        toast({
          title: "Aucune donnée à exporter pour cette société.",
          variant: "destructive",
        });
        return;
      }

      dataToExport = allData;
      logger.info('excelExport', 'All data fetched successfully', { 
        totalCount: allData.length,
        batchesProcessed: Math.ceil(allData.length / batchSize)
      });

    } catch (error) {
      console.error('Error fetching data for Excel export:', error);
      logger.error('excelExport', 'Fetch failed', { error: String(error) });
      toast({
        title: "Erreur lors de la récupération des données.",
        variant: "destructive",
      });
      return;
    }
  }

  // Vérification finale des données
  if (!dataToExport || dataToExport.length === 0) {
    toast({
      title: "Aucune donnée à exporter.",
      variant: "destructive",
    });
    return;
  }

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  
  // Prepare data for Excel
  const data = dataToExport.map(entry => ({
    'N°': entry.no,
    'INTERMEDIAIRE ORASS': entry.intermediaire_orass,
    'POLICE ORASS': entry.police_orass,
    'ANCIEN NUMERO': entry.ancien_numero || '',
    'DATE EFFET': entry.date_effet,
    'DATE ECHEANCE': entry.date_echeance,
    'NOM ASSURE': entry.nom_assure,
    'Société concernée (Vie/Non Vie)': entry.societe_concernee,
    'TYPE DOCUMENT': entry.type_document,
    'ÉTAT CONTRAT': entry.etat_contrat || 'n/o', // Afficher n/o pour les anciennes entrées sans état
    'AGENT INVENTAIRE': entry.nom_agent_inventaire,
    'CRÉÉ LE': entry.created_at
  }));

  // Create worksheet from data
  const ws = XLSX.utils.json_to_sheet(data);

  // Auto-adjust column widths
  const cols = [
    { wch: 5 },  // N°
    { wch: 20 }, // INTERMEDIAIRE ORASS
    { wch: 15 }, // POLICE ORASS
    { wch: 15 }, // ANCIEN NUMERO
    { wch: 12 }, // DATE EFFET
    { wch: 12 }, // DATE ECHEANCE
    { wch: 25 }, // NOM ASSURE
    { wch: 25 }, // Société concernée
    { wch: 20 }, // TYPE DOCUMENT
    { wch: 12 }, // ÉTAT CONTRAT
    { wch: 20 }, // AGENT INVENTAIRE
    { wch: 20 }, // CRÉÉ LE
  ];
  ws['!cols'] = cols;

  // Add autofilter
  ws['!autofilter'] = { ref: XLSX.utils.encode_range({ 
    s: { c: 0, r: 0 }, 
    e: { c: 10, r: data.length } 
  }) };

  // Freeze header row
  ws['!freeze'] = { xSplit: 0, ySplit: 1 };

  // Style the header row (make it bold)
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:J1');
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const cell_address = XLSX.utils.encode_cell({ r: 0, c: C });
    if (!ws[cell_address]) continue;
    if (!ws[cell_address].s) ws[cell_address].s = {};
    ws[cell_address].s.font = { bold: true };
  }

  // Générer le nom du fichier
  let finalFileName = fileName || 'Inventaire_Policies';
  if (societeConcernee && !fileName) {
    finalFileName += `_${societeConcernee.replace(/[\s()]/g, '_')}`;
  }
  if (agence && !fileName) {
    finalFileName += `_Agence_${String(agence).replace(/[^a-zA-Z0-9_-]/g, '_')}`;
  }
  finalFileName += '.xlsx';

  // Générer le nom de la feuille
  const sheetName = societeConcernee ? `Inventaire ${societeConcernee}` : 'Inventaire';

  // Add the worksheet to the workbook (31 caractères max pour nom feuille)
  XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31));

  // Generate and download the file
  XLSX.writeFile(wb, finalFileName);

  logger.info('excelExport', 'Excel file generated', { 
    fileName: finalFileName, 
    rows: data.length,
    filter: societeConcernee || 'none'
  });

  toast({
    title: `Fichier Excel${societeConcernee ? ` (${societeConcernee})` : ''} téléchargé avec succès.`,
    description: `${data.length} enregistrement${data.length > 1 ? 's' : ''} exporté${data.length > 1 ? 's' : ''}.`,
  });
};