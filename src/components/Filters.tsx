import React, { useState, useEffect, useCallback } from 'react';
import { Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Button, DateInput } from '@/components/ui';

export interface FiltersState {
  keyword?: string;
  societe_concernee?: 'Vie' | 'IARD (Sinistre)' | 'Production';
  type_document?: string;
  date_effet_from?: string; // YYYY-MM-DD
  date_effet_to?: string;   // YYYY-MM-DD
}

interface FiltersProps {
  value: FiltersState;
  onChange: (next: FiltersState) => void;
  onReset: () => void;
  // Tri
  sort?: { column: 'no' | 'date_effet' | 'date_echeance' | 'created_at'; direction: 'asc' | 'desc' };
  onSortChange?: (sort: { column: 'no' | 'date_effet' | 'date_echeance' | 'created_at'; direction: 'asc' | 'desc' }) => void;
}

// Composant de filtres réutilisable et discret
export const Filters: React.FC<FiltersProps> = ({ value, onChange, onReset, sort, onSortChange }) => {
  const [local, setLocal] = useState<FiltersState>(value);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  // Debounce pour la recherche par mot-clé (500ms de délai)
  const debouncedKeywordChange = useCallback((keyword: string) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    
    const timer = setTimeout(() => {
      setLocal(prev => ({ ...prev, keyword }));
      onChange({ ...local, keyword });
    }, 500);
    
    setDebounceTimer(timer);
  }, [debounceTimer, local, onChange]);

  // Nettoyage du timer au démontage
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  const apply = () => onChange(local);
  const reset = () => onReset();

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border-2 border-gray-200 shadow-lg p-4 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        {/* Ligne 1: Recherche (6) + Type document (6) */}
        <div className="md:col-span-6 min-w-0">
          <Input
            placeholder="Rechercher (intermédiaire, police, assuré, ancien n°)"
            value={local.keyword || ''}
            onChange={(e) => {
              const value = e.target.value;
              setLocal((s) => ({ ...s, keyword: value }));
              // Applique le debounce pour la recherche automatique
              debouncedKeywordChange(value);
            }}
          />
        </div>
        <div className="md:col-span-6 min-w-0">
          <Input
            placeholder="Type de document"
            value={local.type_document || ''}
            onChange={(e) => setLocal((s) => ({ ...s, type_document: e.target.value }))}
          />
        </div>

        {/* Ligne 2: Société (4) + Trier par (5) + Ordre (3) */}
        <div className="md:col-span-4 min-w-0">
          <Select
            value={local.societe_concernee ?? 'all'}
            onValueChange={(v) =>
              setLocal((s) => ({
                ...s,
                societe_concernee: v === 'all' ? undefined : (v as FiltersState['societe_concernee']),
              }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Type de société" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes</SelectItem>
              <SelectItem value="Vie">Vie</SelectItem>
              <SelectItem value="IARD (Sinistre)">IARD (Sinistre)</SelectItem>
              <SelectItem value="Production">Production</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-5 min-w-0">
          <Select
            value={sort?.column || 'no'}
            onValueChange={(v) => onSortChange && onSortChange({ column: v as any, direction: sort?.direction || 'asc' })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Trier par" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="no">Numéro</SelectItem>
              <SelectItem value="date_effet">Date d'effet</SelectItem>
              <SelectItem value="date_echeance">Date d'échéance</SelectItem>
              <SelectItem value="created_at">Création</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-3 min-w-0">
          <Select
            value={sort?.direction || 'asc'}
            onValueChange={(v) => onSortChange && onSortChange({ column: sort?.column || 'no', direction: v as any })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Ordre" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">Croissant</SelectItem>
              <SelectItem value="desc">Décroissant</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Ligne 3: Période (6 + 6) avec min-w-0 */}
        <div className="md:col-span-6 min-w-0">
          <DateInput
            value={local.date_effet_from ? new Date(local.date_effet_from) : undefined}
            onChange={(d) => setLocal((s) => ({ ...s, date_effet_from: d ? d.toISOString().split('T')[0] : undefined }))}
            placeholder="Date d'effet - de"
            className="w-full"
          />
        </div>
        <div className="md:col-span-6 min-w-0">
          <DateInput
            value={local.date_effet_to ? new Date(local.date_effet_to) : undefined}
            onChange={(d) => setLocal((s) => ({ ...s, date_effet_to: d ? d.toISOString().split('T')[0] : undefined }))}
            placeholder="Date d'effet - à"
            className="w-full"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        <Button variant="ghost" onClick={reset} className="rounded-xl">Réinitialiser</Button>
        <Button onClick={apply} className="rounded-xl">Appliquer les filtres</Button>
      </div>
    </div>
  );
};

export default Filters;


