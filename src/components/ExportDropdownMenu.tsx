import React, { useEffect, useState } from 'react';
import { 
  Button, 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from '@/components/ui';
import { Download } from 'lucide-react';
import { exportToExcel } from '@/utils/excelExport';
import { supabase } from '@/integrations/supabase/client';
import { AGENCES } from '@/components/AgenceModal';

interface ExportDropdownMenuProps {
  societeConcernee: 'Vie' | 'IARD (Sinistre)' | 'Production';
  color: string;
  agence?: string | null;
}

export const ExportDropdownMenu: React.FC<ExportDropdownMenuProps> = ({ 
  societeConcernee,
  color = 'blue',
  agence
}) => {
  const [open, setOpen] = useState(false);
  const [loadingAgences, setLoadingAgences] = useState(false);
  const [availableAgences, setAvailableAgences] = useState<typeof AGENCES[number][]>([]);

  const handleExport = async (etatContrat?: 'Actif' | 'Résilié' | 'Tout') => {
    await exportToExcel(undefined, societeConcernee, undefined, etatContrat, agence ?? undefined);
  };

  const handleExportAllAgencesMixed = async () => {
    await exportToExcel(undefined, societeConcernee, undefined, 'Tout');
  };

  const handleExportForAgence = async (targetAgence: string) => {
    await exportToExcel(undefined, societeConcernee, undefined, 'Tout', targetAgence);
  };

  const fetchAgencesForSociete = async () => {
    if (loadingAgences) return;
    setLoadingAgences(true);
    try {
      const results = await Promise.all(
        AGENCES.map(async (a) => {
          const { count, error } = await supabase
            .from('inventory')
            .select('*', { count: 'exact', head: true })
            .eq('societe_concernee', societeConcernee)
            .eq('agence', a.value);
          if (error) return null;
          if ((count || 0) > 0) return a;
          return null;
        })
      );
      setAvailableAgences(results.filter((r): r is typeof AGENCES[number] => !!r));
    } finally {
      setLoadingAgences(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchAgencesForSociete();
    }
  }, [open, societeConcernee]);
  
  // Personnalisation du style du bouton en fonction du paramètre "color"
  const buttonColorClass = {
    'blue': 'bg-blue-600 hover:bg-blue-700 text-white',
    'red': 'bg-red-600 hover:bg-red-700 text-white',
    'purple': 'bg-purple-600 hover:bg-purple-700 text-white',
    'green': 'bg-green-600 hover:bg-green-700 text-white',
  }[color] || 'bg-blue-600 hover:bg-blue-700 text-white';

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          className={`flex items-center gap-2 h-12 md:h-14 px-6 ${buttonColorClass} rounded-xl shadow-md`}
          size="lg"
        >
          <Download className="h-4 w-4" />
          <span>Export {societeConcernee}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 bg-white shadow-xl rounded-xl border border-gray-100 p-1">
        <DropdownMenuLabel className="px-3 py-2 text-sm font-apple-text text-gray-500">
          Filtrer par état du contrat
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-gray-100" />
        <DropdownMenuItem 
          className="flex items-center px-3 py-2 cursor-pointer hover:bg-blue-50 rounded-md transition-colors"
          onClick={() => handleExport('Tout')}
        >
          <span className="w-3 h-3 bg-gray-400 rounded-full mr-2"></span>
          <span className="font-apple-text text-sm">Exporter tout</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          className="flex items-center px-3 py-2 cursor-pointer hover:bg-blue-50 rounded-md transition-colors"
          onClick={() => handleExport('Actif')}
        >
          <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
          <span className="font-apple-text text-sm">Exporter contrats actifs</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          className="flex items-center px-3 py-2 cursor-pointer hover:bg-blue-50 rounded-md transition-colors"
          onClick={() => handleExport('Résilié')}
        >
          <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
          <span className="font-apple-text text-sm">Exporter contrats résiliés</span>
        </DropdownMenuItem>

        <>
          <DropdownMenuSeparator className="bg-gray-100" />
          <DropdownMenuLabel className="px-3 py-2 text-sm font-apple-text text-gray-500">
            Agences avec {societeConcernee}
          </DropdownMenuLabel>
          <DropdownMenuItem 
            className="flex items-center px-3 py-2 cursor-pointer hover:bg-purple-50 rounded-md transition-colors"
            onClick={handleExportAllAgencesMixed}
          >
            <span className="w-3 h-3 bg-purple-500 rounded-full mr-2"></span>
            <span className="font-apple-text text-sm">Toutes les agences (mélangées)</span>
          </DropdownMenuItem>
          {loadingAgences && (
            <DropdownMenuItem className="flex items-center px-3 py-2 rounded-md opacity-60">
              <span className="font-apple-text text-sm">Chargement...</span>
            </DropdownMenuItem>
          )}
          {!loadingAgences && availableAgences.length === 0 && (
            <DropdownMenuItem className="flex items-center px-3 py-2 rounded-md opacity-60">
              <span className="font-apple-text text-sm">Aucune agence trouvée</span>
            </DropdownMenuItem>
          )}
          {!loadingAgences && availableAgences.map((a) => (
            <DropdownMenuItem 
              key={a.value}
              className="flex items-center px-3 py-2 cursor-pointer hover:bg-blue-50 rounded-md transition-colors"
              onClick={() => handleExportForAgence(a.value)}
            >
              <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
              <span className="font-apple-text text-sm">{a.label}</span>
            </DropdownMenuItem>
          ))}
        </>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
