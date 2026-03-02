import { InventoryEntry } from '@/components/InventoryTable';
import { InventoryFormData } from '@/components/InventoryForm';

/**
 * Interface pour représenter un groupe de doublons
 */
export interface DuplicateGroup {
  key: string; // Clé unique pour identifier le groupe
  entries: InventoryEntry[];
  count: number;
  fields: {
    police_orass: string;
    intermediaire_orass: string;
    nom_assure: string;
    date_effet: string;
  };
}

/**
 * Interface pour les résultats de détection de doublons
 */
export interface DuplicateDetectionResult {
  duplicates: DuplicateGroup[];
  totalDuplicates: number;
  entriesWithDuplicates: Set<string>; // IDs des entrées qui ont des doublons
}

/**
 * Fonction pour normaliser les chaînes de caractères pour la comparaison
 * Supprime les espaces, convertit en minuscules et enlève les accents
 */
export const normalizeString = (str: string): string => {
  return str
    .trim()
    .toLowerCase()
    .normalize('NFD') // Décompose les caractères accentués
    .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
    .replace(/\s+/g, ' '); // Normalise les espaces multiples
};

/**
 * Fonction pour générer une clé unique basée sur les champs métier essentiels
 */
export const generateDuplicateKey = (entry: InventoryEntry | InventoryFormData): string => {
  const police_orass = normalizeString(entry.police_orass);
  const intermediaire_orass = normalizeString(entry.intermediaire_orass);
  const nom_assure = normalizeString(entry.nom_assure);
  
  // Pour les dates, on utilise le format ISO pour la comparaison
  const date_effet = entry.date_effet instanceof Date 
    ? entry.date_effet.toISOString().split('T')[0]
    : entry.date_effet.split('T')[0];
  
  return `${police_orass}|${intermediaire_orass}|${nom_assure}|${date_effet}`;
};

/**
 * Fonction principale pour détecter les doublons dans une liste d'entrées
 */
export const detectDuplicates = (entries: InventoryEntry[]): DuplicateDetectionResult => {
  const duplicateMap = new Map<string, InventoryEntry[]>();
  const entriesWithDuplicates = new Set<string>();
  
  // Grouper les entrées par clé de doublon
  entries.forEach(entry => {
    const key = generateDuplicateKey(entry);
    
    if (!duplicateMap.has(key)) {
      duplicateMap.set(key, []);
    }
    
    duplicateMap.get(key)!.push(entry);
  });
  
  // Filtrer les groupes qui ont plus d'une entrée (doublons)
  const duplicates: DuplicateGroup[] = [];
  
  duplicateMap.forEach((groupEntries, key) => {
    if (groupEntries.length > 1) {
      const firstEntry = groupEntries[0];
      
      duplicates.push({
        key,
        entries: groupEntries.sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        ),
        count: groupEntries.length,
        fields: {
          police_orass: firstEntry.police_orass,
          intermediaire_orass: firstEntry.intermediaire_orass,
          nom_assure: firstEntry.nom_assure,
          date_effet: firstEntry.date_effet,
        }
      });
      
      // Marquer toutes les entrées de ce groupe comme ayant des doublons
      groupEntries.forEach(entry => {
        entriesWithDuplicates.add(entry.id);
      });
    }
  });
  
  // Trier par nombre de doublons décroissant, puis par date de création
  duplicates.sort((a, b) => {
    if (a.count !== b.count) {
      return b.count - a.count;
    }
    return new Date(a.entries[0].created_at).getTime() - new Date(b.entries[0].created_at).getTime();
  });
  
  const totalDuplicates = duplicates.reduce((sum, group) => sum + group.count, 0);
  
  return {
    duplicates,
    totalDuplicates,
    entriesWithDuplicates
  };
};

/**
 * Fonction pour vérifier si une nouvelle entrée serait un doublon
 */
export const checkPotentialDuplicate = (
  newEntry: InventoryFormData, 
  existingEntries: InventoryEntry[]
): { isDuplicate: boolean; existingEntry?: InventoryEntry } => {
  const newKey = generateDuplicateKey(newEntry);
  
  const existingEntry = existingEntries.find(entry => {
    const existingKey = generateDuplicateKey(entry);
    return existingKey === newKey;
  });
  
  return {
    isDuplicate: !!existingEntry,
    existingEntry
  };
};

/**
 * Fonction pour obtenir le niveau de priorité d'un doublon
 * Plus le nombre de doublons est élevé, plus la priorité est haute
 */
export const getDuplicatePriority = (duplicateCount: number): 'low' | 'medium' | 'high' | 'critical' => {
  if (duplicateCount >= 5) return 'critical';
  if (duplicateCount >= 3) return 'high';
  if (duplicateCount >= 2) return 'medium';
  return 'low';
};

/**
 * Fonction pour obtenir la couleur du badge selon la priorité
 */
export const getDuplicateBadgeColor = (priority: 'low' | 'medium' | 'high' | 'critical'): string => {
  switch (priority) {
    case 'critical':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'high':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'low':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

/**
 * Fonction pour formater le message de doublon
 */
export const formatDuplicateMessage = (duplicateCount: number): string => {
  if (duplicateCount === 2) {
    return 'Doublon détecté';
  }
  return `${duplicateCount} doublons détectés`;
};

/**
 * Fonction pour obtenir les statistiques des doublons
 */
export const getDuplicateStats = (result: DuplicateDetectionResult) => {
  const stats = {
    totalGroups: result.duplicates.length,
    totalEntries: result.totalDuplicates,
    criticalGroups: 0,
    highGroups: 0,
    mediumGroups: 0,
    lowGroups: 0,
  };
  
  result.duplicates.forEach(group => {
    const priority = getDuplicatePriority(group.count);
    switch (priority) {
      case 'critical':
        stats.criticalGroups++;
        break;
      case 'high':
        stats.highGroups++;
        break;
      case 'medium':
        stats.mediumGroups++;
        break;
      case 'low':
        stats.lowGroups++;
        break;
    }
  });
  
  return stats;
};
