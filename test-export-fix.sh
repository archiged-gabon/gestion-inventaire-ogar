#!/bin/bash

# Script de test pour valider la correction de l'export Excel
# Ce script teste l'export avec différents volumes de données

echo "🧪 Test de validation de l'export Excel - Correction limitation 1000 enregistrements"
echo "=================================================================================="

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages colorés
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Vérifier que l'application est démarrée
print_status "Vérification que l'application est démarrée..."
if ! curl -s http://localhost:5173 > /dev/null; then
    print_error "L'application n'est pas démarrée sur http://localhost:5173"
    print_status "Veuillez démarrer l'application avec: npm run dev"
    exit 1
fi
print_success "Application détectée sur http://localhost:5173"

# Instructions pour les tests manuels
echo ""
print_status "📋 INSTRUCTIONS POUR LES TESTS MANUELS"
echo "=============================================="
echo ""
echo "1. Ouvrez votre navigateur sur http://localhost:5173"
echo "2. Ouvrez la console développeur (F12)"
echo "3. Effectuez les tests suivants :"
echo ""

echo "🔍 TEST 1: Export avec dataset petit (< 1000 enregistrements)"
echo "------------------------------------------------------------"
echo "• Sélectionnez une société avec peu d'enregistrements"
echo "• Cliquez sur 'Export [Société]' > 'Exporter tout'"
echo "• Vérifiez dans la console les logs :"
echo "  - 'Batch fetched' avec batchSize < 1000"
echo "  - 'All data fetched successfully' avec le total"
echo "  - 'Excel file generated' avec le nombre de lignes"
echo "• Ouvrez le fichier Excel et comptez les lignes (hors en-tête)"
echo "• ✅ Le nombre doit correspondre aux logs"
echo ""

echo "🔍 TEST 2: Export avec dataset moyen (1000-5000 enregistrements)"
echo "---------------------------------------------------------------"
echo "• Sélectionnez une société avec un volume moyen"
echo "• Cliquez sur 'Export [Société]' > 'Exporter tout'"
echo "• Vérifiez dans la console :"
echo "  - Plusieurs logs 'Batch fetched' avec batchSize = 1000"
echo "  - 'All data fetched successfully' avec le total"
echo "• Ouvrez le fichier Excel et comptez les lignes"
echo "• ✅ Le nombre doit être > 1000 et correspondre aux logs"
echo ""

echo "🔍 TEST 3: Export avec dataset volumineux (> 7000 enregistrements)"
echo "----------------------------------------------------------------"
echo "• Sélectionnez une société avec beaucoup d'enregistrements"
echo "• Cliquez sur 'Export [Société]' > 'Exporter tout'"
echo "• Vérifiez dans la console :"
echo "  - Plusieurs logs 'Batch fetched' avec batchSize = 1000"
echo "  - 'All data fetched successfully' avec totalCount > 7000"
echo "• Ouvrez le fichier Excel et comptez les lignes"
echo "• ✅ Le nombre doit être > 7000 et correspondre aux logs"
echo ""

echo "🔍 TEST 4: Export avec filtres par état de contrat"
echo "-------------------------------------------------"
echo "• Sélectionnez une société"
echo "• Testez 'Exporter contrats actifs' et 'Exporter contrats résiliés'"
echo "• Vérifiez que les exports contiennent uniquement les contrats du bon état"
echo "• ✅ Les filtres doivent fonctionner correctement"
echo ""

echo "🔍 TEST 5: Vérification des performances"
echo "---------------------------------------"
echo "• Chronométrez le temps d'export pour différents volumes"
echo "• Surveillez l'utilisation mémoire dans les outils développeur"
echo "• ✅ L'export doit se terminer dans un délai raisonnable"
echo "• ✅ Pas d'explosion de la mémoire du navigateur"
echo ""

echo "📊 CRITÈRES DE VALIDATION"
echo "========================="
echo ""
echo "✅ Export complet : Tous les enregistrements sont exportés"
echo "✅ Performance : Temps d'export acceptable"
echo "✅ Mémoire : Pas d'explosion de la mémoire"
echo "✅ Feedback : Toast de progression et message de succès"
echo "✅ Logging : Traces détaillées dans la console"
echo "✅ Compatibilité : Fonctionne avec tous les filtres"
echo ""

echo "🚨 POINTS D'ATTENTION"
echo "====================="
echo ""
echo "• Vérifiez que le toast 'Récupération des données en cours...' s'affiche"
echo "• Vérifiez que le message de succès indique le bon nombre d'enregistrements"
echo "• Surveillez les logs pour détecter d'éventuelles erreurs"
echo "• Testez avec différents navigateurs si possible"
echo ""

echo "📝 RAPPORT DE TEST"
echo "=================="
echo ""
echo "Après avoir effectué les tests, documentez :"
echo "• Nombre d'enregistrements testés par société"
echo "• Temps d'export observé"
echo "• Problèmes rencontrés (le cas échéant)"
echo "• Validation des critères d'acceptation"
echo ""

print_success "Script de test terminé. Suivez les instructions ci-dessus pour valider la correction."
echo ""
print_status "Pour plus d'informations, consultez :"
echo "• docs/DIAGNOSIS_export_limit.md - Diagnostic du problème"
echo "• docs/IMPLEMENTATION_export_fix.md - Documentation technique"
echo "• src/utils/excelExport.ts - Code modifié"
echo ""
