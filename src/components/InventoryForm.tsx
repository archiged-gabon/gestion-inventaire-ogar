import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Button, 
  Input, 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue,
  DateInput,
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui';
import { logger } from '@/lib/logger';
import { Plus } from 'lucide-react';

const inventorySchema = z.object({
  intermediaire_orass: z.string().trim().min(1, { message: "INTERMEDIAIRE ORASS est obligatoire" }),
  police_orass: z.string().trim().min(1, { message: "POLICE ORASS est obligatoire" }),
  ancien_numero: z.string().optional(),
  date_effet: z.date({
    required_error: "DATE EFFET est obligatoire",
    invalid_type_error: "DATE EFFET doit être une date valide"
  }).refine((date) => date instanceof Date && !isNaN(date.getTime()), {
    message: "DATE EFFET doit être une date valide"
  }),
  date_echeance: z.date({
    required_error: "DATE ECHEANCE est obligatoire",
    invalid_type_error: "DATE ECHEANCE doit être une date valide"
  }).refine((date) => date instanceof Date && !isNaN(date.getTime()), {
    message: "DATE ECHEANCE doit être une date valide"
  }),
  nom_assure: z.string().trim().min(1, { message: "NOM ASSURE est obligatoire" }),
  societe_concernee: z.enum(["Vie", "IARD (Sinistre)", "Production"], { required_error: "Société concernée est obligatoire" }),
  type_document: z.string().trim().min(1, { message: "TYPE DOCUMENT est obligatoire" }),
  etat_contrat: z.enum(["Actif", "Résilié"], { required_error: "État du contrat est obligatoire" }),
});

export type InventoryFormData = z.infer<typeof inventorySchema>;

interface InventoryFormProps {
  onSubmit: (data: InventoryFormData) => Promise<void>;
  isSubmitting: boolean;
  agentName: string;
  onSuccess?: () => void;
}

export const InventoryForm: React.FC<InventoryFormProps> = ({ onSubmit, isSubmitting, agentName, onSuccess }) => {
  // Plus besoin de forcer le re-render avec une clé artificielle
  const form = useForm<InventoryFormData>({
    resolver: zodResolver(inventorySchema),
    mode: 'onSubmit', // Validation seulement à la soumission
    defaultValues: {
      intermediaire_orass: '',
      police_orass: '',
      ancien_numero: '',
      nom_assure: '',
      type_document: '',
      date_effet: undefined,
      date_echeance: undefined,
      societe_concernee: undefined,
      etat_contrat: 'Actif', // Valeur par défaut : Actif
    },
  });

  // Gestion de la navigation au clavier (amélioré pour compatibilité mobile)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Sur mobile, laisser la gestion par défaut pour permettre au clavier virtuel
    // de fonctionner normalement - ne pas bloquer les comportements par défaut
    
    // Uniquement gérer la touche Enter sur desktop pour la navigation entre champs
    if (e.key === 'Enter' && e.target instanceof HTMLInputElement) {
      // Ne pas appeler e.preventDefault() pour éviter les problèmes avec le clavier virtuel
      // Cela permet au clavier virtuel de se comporter normalement
      
      // Pour éviter la soumission du formulaire sur Enter dans un input
      if (window.innerWidth > 768) { // Uniquement sur desktop
        const form = e.target.closest('form');
        if (form) {
          const inputs = Array.from(form.querySelectorAll('input:not([type=hidden]), select, button')) as HTMLElement[];
          const currentIndex = inputs.indexOf(e.target);
          const nextInput = inputs[currentIndex + 1];
          if (nextInput && nextInput !== e.target) {
            // Focus sur le prochain champ
            nextInput.focus();
            
            // Empêcher la soumission seulement sur desktop
            e.preventDefault();
          }
        }
      }
    }
  };

  // Fonction pour réinitialiser le formulaire de façon douce, en mémorisant pour éviter les recréations
  const resetForm = React.useCallback(() => {
    // Reset complet du formulaire avec suppression des erreurs
    form.reset({
      intermediaire_orass: '',
      police_orass: '',
      ancien_numero: '',
      nom_assure: '',
      type_document: '',
      date_effet: undefined,
      date_echeance: undefined,
      societe_concernee: undefined,
      etat_contrat: 'Actif', // Conserver la valeur par défaut : Actif
    });
    
    // Supprimer toutes les erreurs de validation
    form.clearErrors();
    
    logger.info('InventoryForm', 'Form reset completed');
    // On ne force plus le re-render avec setFormKey, ce qui permet
    // de préserver l'état des claviers virtuels et du focus
  }, [form]);

  const handleSubmit = async (data: InventoryFormData) => {
    // Log for debugging deployment issue: form submit
    logger.info('InventoryForm', 'Submitting form', { police_orass: data.police_orass });
    await onSubmit(data);
  };

  // Gérer la réinitialisation quand onSuccess est fourni
  // et suivre si nous avons déjà réinitialisé pour ce cycle de soumission
  const resetPerformedRef = React.useRef(false);
  
  React.useEffect(() => {
    // Si onSuccess est fourni (soumission réussie) et que nous n'avons pas encore réinitialisé
    if (onSuccess && !resetPerformedRef.current) {
      // Marquer que nous avons effectué la réinitialisation pour ce cycle
      resetPerformedRef.current = true;
      
      // Réinitialiser le formulaire
      resetForm();
      
      // Appeler le callback onSuccess après la réinitialisation
      onSuccess();
      
      // Réinitialiser le flag après un délai pour permettre une nouvelle soumission
      setTimeout(() => {
        resetPerformedRef.current = false;
        logger.info('InventoryForm', 'Reset completed, ready for new submission');
      }, 500);
    }
  }, [onSuccess, resetForm]);

  return (
    <div className="relative overflow-hidden">
      {/* Fond avec gradient subtil */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-slate-50 to-white rounded-3xl"></div>
      
      {/* Contenu principal */}
      <div className="relative space-y-10 p-10 bg-card/90 backdrop-blur-sm rounded-3xl border border-border/70 shadow-2xl shadow-primary/5">
        {/* En-tête élégant */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-primary/75 rounded-2xl shadow-lg shadow-primary/20 mb-4 ring-1 ring-primary/10">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          
          <h2 className="text-3xl font-apple-display font-bold text-gray-900 tracking-tight">
            Nouvelle entrée d'inventaire
          </h2>
          <p className="text-base font-apple-text text-gray-600 max-w-md mx-auto leading-relaxed">
            Remplissez les informations du document avec précision
          </p>
          
          {/* Badge agent avec style amélioré */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/10 to-accent/10 rounded-full border border-border/70 shadow-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-apple-text font-medium text-foreground">Agent:</span>
            <span className="text-sm font-apple-text font-semibold text-primary">{agentName}</span>
          </div>
        </div>
      
        {/* Formulaire avec espacement amélioré */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} onKeyDown={handleKeyDown} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
              <FormField
                control={form.control}
                name="intermediaire_orass"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-sm font-apple-text font-semibold text-gray-800 tracking-wide">
                      Intermédiaire ORASS
                      <span className="text-red-500 ml-1">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="Saisissez l'intermédiaire ORASS" 
                        disabled={isSubmitting}
                        className="h-12 px-4 text-base font-apple-text bg-white/90 border-gray-300/60 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 rounded-xl shadow-sm hover:shadow-md focus:shadow-lg"
                      />
                    </FormControl>
                    <FormMessage className="text-sm font-apple-text text-red-600 mt-2" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="police_orass"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-sm font-apple-text font-semibold text-gray-800 tracking-wide">
                      Police ORASS
                      <span className="text-red-500 ml-1">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="Numéro de police ORASS" 
                        disabled={isSubmitting}
                        className="h-12 px-4 text-base font-apple-text bg-white/90 border-gray-300/60 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 rounded-xl shadow-sm hover:shadow-md focus:shadow-lg"
                      />
                    </FormControl>
                    <FormMessage className="text-sm font-apple-text text-red-600 mt-2" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ancien_numero"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-sm font-apple-text font-semibold text-gray-800 tracking-wide">
                      Ancien numéro
                      <span className="text-gray-400 ml-1 font-normal">(optionnel)</span>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="Ancien numéro de police" 
                        disabled={isSubmitting}
                        className="h-12 px-4 text-base font-apple-text bg-white/90 border-gray-300/60 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 rounded-xl shadow-sm hover:shadow-md focus:shadow-lg"
                      />
                    </FormControl>
                    <FormMessage className="text-sm font-apple-text text-red-600 mt-2" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nom_assure"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-sm font-apple-text font-semibold text-gray-800 tracking-wide">
                      Nom de l'assuré
                      <span className="text-red-500 ml-1">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="Nom complet de l'assuré" 
                        disabled={isSubmitting}
                        className="h-12 px-4 text-base font-apple-text bg-white/90 border-gray-300/60 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 rounded-xl shadow-sm hover:shadow-md focus:shadow-lg"
                      />
                    </FormControl>
                    <FormMessage className="text-sm font-apple-text text-red-600 mt-2" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type_document"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-sm font-apple-text font-semibold text-gray-800 tracking-wide">
                      Type de document
                      <span className="text-red-500 ml-1">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="Type de document (ex: Police, Contrat, etc.)" 
                        disabled={isSubmitting}
                        className="h-12 px-4 text-base font-apple-text bg-white/90 border-gray-300/60 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 rounded-xl shadow-sm hover:shadow-md focus:shadow-lg"
                      />
                    </FormControl>
                    <FormMessage className="text-sm font-apple-text text-red-600 mt-2" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date_effet"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-sm font-apple-text font-semibold text-gray-800 tracking-wide">
                      Date d'effet
                      <span className="text-red-500 ml-1">*</span>
                    </FormLabel>
                    <FormControl>
                      <DateInput
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Sélectionner la date d'effet"
                        disabled={isSubmitting}
                        className="h-12"
                      />
                    </FormControl>
                    <FormMessage className="text-sm font-apple-text text-red-600 mt-2" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date_echeance"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-sm font-apple-text font-semibold text-gray-800 tracking-wide">
                      Date d'échéance
                      <span className="text-red-500 ml-1">*</span>
                    </FormLabel>
                    <FormControl>
                      <DateInput
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Sélectionner la date d'échéance"
                        disabled={isSubmitting}
                        className="h-12"
                      />
                    </FormControl>
                    <FormMessage className="text-sm font-apple-text text-red-600 mt-2" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="societe_concernee"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-sm font-apple-text font-semibold text-gray-800 tracking-wide">
                      Type de société
                      <span className="text-red-500 ml-1">*</span>
                    </FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger className="h-12 px-4 text-base font-apple-text bg-white/90 border-gray-300/60 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 rounded-xl shadow-sm hover:shadow-md focus:shadow-lg">
                          <SelectValue placeholder="Choisir le type de société" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-xl border border-gray-200/60 shadow-lg">
                        <SelectItem value="Vie" className="h-12 px-4 text-base font-apple-text hover:bg-blue-50 focus:bg-blue-50">Vie</SelectItem>
                        <SelectItem value="IARD (Sinistre)" className="h-12 px-4 text-base font-apple-text hover:bg-blue-50 focus:bg-blue-50">IARD (Sinistre)</SelectItem>
                        <SelectItem value="Production" className="h-12 px-4 text-base font-apple-text hover:bg-blue-50 focus:bg-blue-50">Production</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-sm font-apple-text text-red-600 mt-2" />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="etat_contrat"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-sm font-apple-text font-semibold text-gray-800 tracking-wide">
                      État du contrat
                      <span className="text-red-500 ml-1">*</span>
                    </FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger className="h-12 px-4 text-base font-apple-text bg-white/90 border-gray-300/60 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 rounded-xl shadow-sm hover:shadow-md focus:shadow-lg">
                          <SelectValue placeholder="Choisir l'état du contrat" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-xl border border-gray-200/60 shadow-lg">
                        <SelectItem value="Actif" className="h-12 px-4 text-base font-apple-text hover:bg-blue-50 focus:bg-blue-50">
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                            <span>Actif</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="Résilié" className="h-12 px-4 text-base font-apple-text hover:bg-blue-50 focus:bg-blue-50">
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                            <span>Résilié</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-sm font-apple-text text-red-600 mt-2" />
                  </FormItem>
                )}
              />
          </div>

            {/* Bouton de soumission élégant */}
            <div className="col-span-full flex justify-center pt-4">
              <Button 
                type="submit" 
                disabled={isSubmitting} 
                className="h-14 px-10 text-lg font-apple-text font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-lg"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Ajout en cours...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Plus className="w-10 h-10" />
                    <span>Ajouter à l'inventaire</span>
                  </div>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};