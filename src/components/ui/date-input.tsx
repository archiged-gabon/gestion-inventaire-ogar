import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface DateInputProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const DateInput = React.forwardRef<HTMLDivElement, DateInputProps>(({
  value,
  onChange,
  placeholder = "Sélectionner une date",
  disabled = false,
  className,
}, ref) => {
  // Références pour les inputs
  const dayRef = React.useRef<HTMLInputElement>(null);
  const monthRef = React.useRef<HTMLInputElement>(null);
  const yearRef = React.useRef<HTMLInputElement>(null);
  
  const [day, setDay] = React.useState<string>("");
  const [month, setMonth] = React.useState<string>("");
  const [year, setYear] = React.useState<string>("");
  const [error, setError] = React.useState<string | null>(null);
  
  // Flag pour suivre si nous sommes en train d'effacer
  const isDeletingRef = React.useRef(false);

  // Synchroniser les valeurs internes avec la valeur externe
  React.useEffect(() => {
    if (value && value instanceof Date && !isNaN(value.getTime())) {
      setDay(value.getDate().toString().padStart(2, '0'));
      setMonth((value.getMonth() + 1).toString().padStart(2, '0'));
      setYear(value.getFullYear().toString());
      setError(null);
    } else if (value === undefined) {
      setDay("");
      setMonth("");
      setYear("");
      setError(null);
    }
  }, [value]);

  // Fonction pour valider et créer la date
  const createValidDate = React.useCallback(
    (dayValue: string, monthValue: string, yearValue: string): Date | undefined => {
      try {
        // Vérifier que tous les champs sont remplis
        if (!dayValue || !monthValue || !yearValue) {
          return undefined;
        }
        
        // Convertir en nombres
        const dayNum = parseInt(dayValue, 10);
        const monthNum = parseInt(monthValue, 10);
        const yearNum = parseInt(yearValue, 10);
        
        // Validation des valeurs (uniquement si les trois champs sont remplis)
        if (isNaN(dayNum) || isNaN(monthNum) || isNaN(yearNum)) {
          setError("La date doit contenir uniquement des chiffres");
          return undefined;
        }
        
        if (dayNum < 1 || dayNum > 31) {
          setError("Le jour doit être entre 1 et 31");
          return undefined;
        }
        
        if (monthNum < 1 || monthNum > 12) {
          setError("Le mois doit être entre 1 et 12");
          return undefined;
        }
        
        if (yearNum < 1900 || yearNum > 2100) {
          setError("L'année doit être entre 1900 et 2100");
          return undefined;
        }
        
        // Créer la date
        const date = new Date(yearNum, monthNum - 1, dayNum);
        
        // Vérifier que la date créée correspond aux valeurs saisies (détection des dates invalides comme 31/02/2024)
        if (
          date.getDate() === dayNum &&
          date.getMonth() === monthNum - 1 &&
          date.getFullYear() === yearNum &&
          !isNaN(date.getTime())
        ) {
          setError(null);
          return date;
        } else {
          setError("Date invalide pour ce mois");
          return undefined;
        }
      } catch (error) {
        setError("Format de date incorrect");
        return undefined;
      }
    },
    []
  );

  // Mettre à jour la date quand les valeurs changent (avec délai)
  const debouncedUpdateRef = React.useRef<NodeJS.Timeout | null>(null);
  
  // Fonction pour déclencher la mise à jour avec délai
  const triggerUpdate = React.useCallback(() => {
    // Annuler tout délai précédent
    if (debouncedUpdateRef.current) {
      clearTimeout(debouncedUpdateRef.current);
    }
    
    // Si nous sommes en train d'effacer, ne pas valider immédiatement
    if (isDeletingRef.current) {
      // Réinitialiser le flag de suppression
      isDeletingRef.current = false;
      
      // Si tous les champs sont vides, reset la date
      if (!day && !month && !year && value !== undefined) {
        onChange?.(undefined);
      }
      return;
    }
    
    // Créer un nouveau délai pour la mise à jour
    debouncedUpdateRef.current = setTimeout(() => {
      if (day && month && year) {
        const validDate = createValidDate(day, month, year);
        if (validDate) {
          onChange?.(validDate);
        }
      } else if (!day && !month && !year && value !== undefined) {
        onChange?.(undefined);
      }
    }, 300); // Délai court pour ne pas gêner l'utilisateur
  }, [day, month, year, onChange, createValidDate, value]);
  
  // Effet pour déclencher l'update quand les valeurs changent
  React.useEffect(() => {
    triggerUpdate();
    return () => {
      if (debouncedUpdateRef.current) {
        clearTimeout(debouncedUpdateRef.current);
      }
    };
  }, [day, month, year, triggerUpdate]);

  // Handlers pour les changements de valeurs avec filtrage minimal
  const handleDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    
    // Si la valeur est vide ou ne contient que des chiffres (pas de filtrage agressif)
    if (rawValue === '' || /^\d{1,2}$/.test(rawValue)) {
      setDay(rawValue);
    }
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    
    // Si la valeur est vide ou ne contient que des chiffres (pas de filtrage agressif)
    if (rawValue === '' || /^\d{1,2}$/.test(rawValue)) {
      setMonth(rawValue);
    }
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    
    // Si la valeur est vide ou ne contient que des chiffres (pas de filtrage agressif)
    if (rawValue === '' || /^\d{1,4}$/.test(rawValue)) {
      setYear(rawValue);
    }
  };

  // Gestion des touches spécifiques (comme Backspace, Delete)
  const handleKeyDown = (
    field: 'day' | 'month' | 'year',
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    // Marquer l'état de suppression pour les touches Backspace et Delete
    if (e.key === 'Backspace' || e.key === 'Delete') {
      isDeletingRef.current = true;
    }
    
    // Éviter de prévenir les événements par défaut pour assurer la compatibilité avec les claviers mobiles
    // Navigation avec Tab (comportement standard) et Enter (pour mobile)
    if (e.key === 'Enter') {
      if (field === 'day' && dayRef.current) {
        monthRef.current?.focus();
      } else if (field === 'month' && monthRef.current) {
        yearRef.current?.focus();
      }
    }
    
    // Ne pas empêcher l'événement par défaut - important pour la compatibilité mobile
  };

  // Gestion auto-complétion et focus suivant
  const handleDayBlur = () => {
    // Auto-complétion du jour si nécessaire (1 -> 01)
    if (day.length === 1) {
      setDay(day.padStart(2, '0'));
    }
  };
  
  const handleMonthBlur = () => {
    // Auto-complétion du mois si nécessaire (1 -> 01)
    if (month.length === 1) {
      setMonth(month.padStart(2, '0'));
    }
  };

  return (
    <div ref={ref} className={cn("flex flex-col", className)}>
      <div className="flex gap-2">
        {/* Input jour */}
        <div className="flex-1">
          <Input
            ref={dayRef}
            value={day}
            onChange={handleDayChange}
            onKeyDown={(e) => handleKeyDown('day', e)}
            onBlur={handleDayBlur}
            placeholder="JJ"
            disabled={disabled}
            className="h-12 px-4 text-base font-apple-text text-center bg-white/90 border-gray-300/60 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 rounded-xl shadow-sm hover:shadow-md focus:shadow-lg"
            maxLength={2}
            inputMode="numeric"
            pattern="[0-9]*" /* Aide à afficher le clavier numérique sur mobile */
          />
        </div>
        
        <span className="flex items-center text-gray-400">/</span>
        
        {/* Input mois */}
        <div className="flex-1">
          <Input
            ref={monthRef}
            value={month}
            onChange={handleMonthChange}
            onKeyDown={(e) => handleKeyDown('month', e)}
            onBlur={handleMonthBlur}
            placeholder="MM"
            disabled={disabled}
            className="h-12 px-4 text-base font-apple-text text-center bg-white/90 border-gray-300/60 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 rounded-xl shadow-sm hover:shadow-md focus:shadow-lg"
            maxLength={2}
            inputMode="numeric"
            pattern="[0-9]*" /* Aide à afficher le clavier numérique sur mobile */
          />
        </div>
        
        <span className="flex items-center text-gray-400">/</span>
        
        {/* Input année */}
        <div className="flex-1">
          <Input
            ref={yearRef}
            value={year}
            onChange={handleYearChange}
            onKeyDown={(e) => handleKeyDown('year', e)}
            placeholder="AAAA"
            disabled={disabled}
            className="h-12 px-4 text-base font-apple-text text-center bg-white/90 border-gray-300/60 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 rounded-xl shadow-sm hover:shadow-md focus:shadow-lg"
            maxLength={4}
            inputMode="numeric"
            pattern="[0-9]*" /* Aide à afficher le clavier numérique sur mobile */
          />
        </div>
      </div>
      
      {/* Message d'erreur */}
      {error && (
        <div className="text-sm font-apple-text text-red-600 mt-2">
          {error}
        </div>
      )}
    </div>
  );
});

DateInput.displayName = "DateInput";
