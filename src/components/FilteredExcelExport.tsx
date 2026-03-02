import React from 'react';
import { Button } from '@/components/ui';
import { Download } from 'lucide-react';
import { exportToExcel } from '@/utils/excelExport';
import { InventoryFilters } from '@/hooks/useInventory';

interface FilteredExcelExportProps {
  filters: InventoryFilters;
}

export const FilteredExcelExport: React.FC<FilteredExcelExportProps> = ({ filters }) => {
  const handleExport = async () => {
    await exportToExcel(
      undefined, 
      filters.societe_concernee,
      filters.keyword ? `Inventaire_${filters.keyword.replace(/[^a-zA-Z0-9]/g, '_')}` : undefined,
      filters.etat_contrat
    );
  };

  return (
    <Button 
      onClick={handleExport}
      className="flex items-center gap-2 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md"
    >
      <Download className="h-4 w-4" />
      <span>Export filtré</span>
    </Button>
  );
};
