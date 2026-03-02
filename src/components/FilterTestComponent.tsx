/**
 * Composant de test pour valider le fonctionnement des filtres
 * Ce composant peut être temporairement ajouté à l'application pour tester les corrections
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui';
import { runFilterValidationTests, testFilterPerformance } from '@/utils/filterValidation';

export const FilterTestComponent: React.FC = () => {
  const [testResults, setTestResults] = useState<any>(null);
  const [performanceResults, setPerformanceResults] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);

  const runTests = async () => {
    setIsRunning(true);
    try {
      console.log('🧪 Exécution des tests de validation...');
      const results = runFilterValidationTests();
      setTestResults(results);
      console.log('✅ Tests de validation terminés:', results);
    } catch (error) {
      console.error('❌ Erreur lors des tests:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const runPerformanceTest = async () => {
    setIsRunning(true);
    try {
      console.log('🚀 Exécution du test de performance...');
      const results = testFilterPerformance(1000);
      setPerformanceResults(results);
      console.log('✅ Test de performance terminé:', results);
    } catch (error) {
      console.error('❌ Erreur lors du test de performance:', error);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl border-2 border-gray-200 shadow-lg p-6 space-y-4">
      <h3 className="text-lg font-apple-display font-semibold text-gray-900">
        🧪 Tests de Validation des Filtres
      </h3>
      
      <div className="space-y-3">
        <Button 
          onClick={runTests}
          disabled={isRunning}
          className="w-full"
        >
          {isRunning ? 'Tests en cours...' : 'Lancer les Tests de Validation'}
        </Button>
        
        <Button 
          onClick={runPerformanceTest}
          disabled={isRunning}
          variant="outline"
          className="w-full"
        >
          {isRunning ? 'Performance en cours...' : 'Test de Performance (1000 entrées)'}
        </Button>
      </div>

      {testResults && (
        <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
          <h4 className="font-semibold text-green-800 mb-2">✅ Résultats des Tests</h4>
          <div className="text-sm text-green-700 space-y-1">
            <p><strong>Tests exécutés:</strong> {testResults.totalTests}</p>
            <p><strong>Tests réussis:</strong> {testResults.passed}</p>
            <div className="mt-2">
              <p><strong>Détails:</strong></p>
              <ul className="list-disc list-inside space-y-1">
                <li>Recherche case-insensitive: {testResults.results.caseInsensitive ? '✅' : '❌'}</li>
                <li>Filtre par société: {testResults.results.societyFilter ? '✅' : '❌'}</li>
                <li>Filtre par document: {testResults.results.documentFilter ? '✅' : '❌'}</li>
                <li>Filtre par date: {testResults.results.dateFilter ? '✅' : '❌'}</li>
                <li>Filtres combinés: {testResults.results.combinedFilters ? '✅' : '❌'}</li>
                <li>Gestion filtres vides: {testResults.results.emptyFilter ? '✅' : '❌'}</li>
                <li>Normalisation accents: {testResults.results.accentNormalization ? '✅' : '❌'}</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {performanceResults && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-blue-800 mb-2">🚀 Résultats de Performance</h4>
          <div className="text-sm text-blue-700 space-y-1">
            <p><strong>Entrées testées:</strong> {performanceResults.totalEntries}</p>
            <p><strong>Résultats filtrés:</strong> {performanceResults.filteredResults}</p>
            <p><strong>Durée:</strong> {performanceResults.duration.toFixed(2)}ms</p>
            <p><strong>Performance:</strong> {performanceResults.performance.toFixed(0)} entrées/ms</p>
          </div>
        </div>
      )}

      <div className="text-xs text-gray-500 mt-4">
        <p>💡 <strong>Note:</strong> Ces tests valident le fonctionnement des corrections apportées au système de filtrage.</p>
        <p>📝 Consultez la console du navigateur pour voir les logs détaillés des tests.</p>
      </div>
    </div>
  );
};

export default FilterTestComponent;
