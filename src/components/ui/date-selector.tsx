import * as React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface DateSelectorProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

// Génération des options pour les jours (1-31)
const generateDays = () => {
  return Array.from({ length: 31 }, (_, i) => i + 1);
};

// Génération des options pour les mois
const months = [
  { value: 1, label: "Janvier" },
  { value: 2, label: "Février" },
  { value: 3, label: "Mars" },
  { value: 4, label: "Avril" },
  { value: 5, label: "Mai" },
  { value: 6, label: "Juin" },
  { value: 7, label: "Juillet" },
  { value: 8, label: "Août" },
  { value: 9, label: "Septembre" },
  { value: 10, label: "Octobre" },
  { value: 11, label: "Novembre" },
  { value: 12, label: "Décembre" },
];

// Génération des options pour les années (année actuelle ± 50 ans)
const generateYears = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = currentYear - 50; i <= currentYear + 50; i++) {
    years.push(i);
  }
  return years.reverse(); // Années récentes en premier
};

export const DateSelector = React.forwardRef<HTMLDivElement, DateSelectorProps>(({
  value,
  onChange,
  placeholder = "Sélectionner une date",
  disabled = false,
  className,
}, ref) => {
  const [day, setDay] = React.useState<number | undefined>(undefined);
  const [month, setMonth] = React.useState<number | undefined>(undefined);
  const [year, setYear] = React.useState<number | undefined>(undefined);

  const days = generateDays();
  const years = generateYears();

  // Fonction pour valider et créer la date
  const createValidDate = React.useCallback(
    (dayValue: number, monthValue: number, yearValue: number): Date | undefined => {
      try {
        // Créer la date
        const date = new Date(yearValue, monthValue - 1, dayValue);
        
        // Vérifier que la date créée correspond aux valeurs saisies
        if (
          date.getDate() === dayValue &&
          date.getMonth() === monthValue - 1 &&
          date.getFullYear() === yearValue &&
          !isNaN(date.getTime())
        ) {
          return date;
        }
      } catch (error) {
        // Date invalide
        console.warn("Date invalide:", { dayValue, monthValue, yearValue });
      }
      return undefined;
    },
    []
  );

  // Synchroniser les valeurs internes avec la valeur externe
  React.useEffect(() => {
    if (value && value instanceof Date && !isNaN(value.getTime())) {
      setDay(value.getDate());
      setMonth(value.getMonth() + 1);
      setYear(value.getFullYear());
    } else {
      setDay(undefined);
      setMonth(undefined);
      setYear(undefined);
    }
  }, [value]);

  // Mettre à jour la date quand les valeurs internes changent
  React.useEffect(() => {
    if (day && month && year) {
      const validDate = createValidDate(day, month, year);
      onChange?.(validDate);
    } else if (day === undefined && month === undefined && year === undefined && value !== undefined) {
      // Seulement appeler onChange(undefined) si la valeur externe n'est pas déjà undefined
      // Cela évite les appels inutiles lors du reset du formulaire
      onChange?.(undefined);
    }
  }, [day, month, year, onChange, createValidDate, value]);

  const handleDayChange = (dayValue: string) => {
    const dayNum = parseInt(dayValue, 10);
    setDay(dayNum);
  };

  const handleMonthChange = (monthValue: string) => {
    const monthNum = parseInt(monthValue, 10);
    setMonth(monthNum);
  };

  const handleYearChange = (yearValue: string) => {
    const yearNum = parseInt(yearValue, 10);
    setYear(yearNum);
  };

  return (
    <div ref={ref} className={cn("flex gap-3", className)}>
      {/* Sélecteur de jour */}
      <div className="flex-1">
        <Select
          value={day?.toString() || ""}
          onValueChange={handleDayChange}
          disabled={disabled}
        >
          <SelectTrigger className="h-12 px-4 text-base font-apple-text bg-white/90 border-gray-300/60 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 rounded-xl shadow-sm hover:shadow-md focus:shadow-lg">
            <SelectValue placeholder="Jour" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border border-gray-200/60 shadow-lg">
            {days.map((dayNum) => (
              <SelectItem key={dayNum} value={dayNum.toString()} className="h-12 px-4 text-base font-apple-text hover:bg-blue-50 focus:bg-blue-50">
                {dayNum.toString().padStart(2, '0')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Sélecteur de mois */}
      <div className="flex-1">
        <Select
          value={month?.toString() || ""}
          onValueChange={handleMonthChange}
          disabled={disabled}
        >
          <SelectTrigger className="h-12 px-4 text-base font-apple-text bg-white/90 border-gray-300/60 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 rounded-xl shadow-sm hover:shadow-md focus:shadow-lg">
            <SelectValue placeholder="Mois" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border border-gray-200/60 shadow-lg">
            {months.map((monthItem) => (
              <SelectItem key={monthItem.value} value={monthItem.value.toString()} className="h-12 px-4 text-base font-apple-text hover:bg-blue-50 focus:bg-blue-50">
                {monthItem.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Sélecteur d'année */}
      <div className="flex-1">
        <Select
          value={year?.toString() || ""}
          onValueChange={handleYearChange}
          disabled={disabled}
        >
          <SelectTrigger className="h-12 px-4 text-base font-apple-text bg-white/90 border-gray-300/60 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 rounded-xl shadow-sm hover:shadow-md focus:shadow-lg">
            <SelectValue placeholder="Année" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border border-gray-200/60 shadow-lg">
            {years.map((yearNum) => (
              <SelectItem key={yearNum} value={yearNum.toString()} className="h-12 px-4 text-base font-apple-text hover:bg-blue-50 focus:bg-blue-50">
                {yearNum}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
});

DateSelector.displayName = "DateSelector";
