import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TestTube, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { InventoryEntry } from './InventoryTable';
import { detectDuplicates, checkPotentialDuplicate } from '@/utils/duplicateDetection';
import { InventoryFormData } from './InventoryForm';

/**
 * Composant de test pour valider la détection de doublons
 * Ce composant peut être temporairement ajouté à l'interface pour tester le système
 */
export const DuplicateTestComponent: React.FC = () => {
  const [testResults, setTestResults] = useState<{
    passed: number;
    failed: number;
    tests: Array<{
      name: string;
      passed: boolean;
      message: string;
    }>;
  } | null>(null);

  // Données de test pour simuler des doublons
  const createTestEntries = (): InventoryEntry[] => {
    const baseDate = new Date('2024-01-01');
    
    return [
      // Groupe 1: 3 doublons
      {
        id: '1',
        no: 1,
        intermediaire_orass: 'INTERMEDIAIRE A',
        police_orass: 'POLICE-001',
        ancien_numero: null,
        date_effet: '2024-01-01',
        date_echeance: '2024-12-31',
        nom_assure: 'DUPONT Jean',
        societe_concernee: 'Vie',
        type_document: 'Police',
        nom_agent_inventaire: 'Agent 1',
        created_at: '2024-01-01T10:00:00Z'
      },
      {
        id: '2',
        no: 2,
        intermediaire_orass: 'INTERMEDIAIRE A',
        police_orass: 'POLICE-001',
        ancien_numero: null,
        date_effet: '2024-01-01',
        date_echeance: '2024-12-31',
        nom_assure: 'DUPONT Jean',
        societe_concernee: 'Vie',
        type_document: 'Police',
        nom_agent_inventaire: 'Agent 2',
        created_at: '2024-01-01T11:00:00Z'
      },
      {
        id: '3',
        no: 3,
        intermediaire_orass: 'INTERMEDIAIRE A',
        police_orass: 'POLICE-001',
        ancien_numero: null,
        date_effet: '2024-01-01',
        date_echeance: '2024-12-31',
        nom_assure: 'DUPONT Jean',
        societe_concernee: 'Vie',
        type_document: 'Police',
        nom_agent_inventaire: 'Agent 3',
        created_at: '2024-01-01T12:00:00Z'
      },
      // Groupe 2: 2 doublons
      {
        id: '4',
        no: 4,
        intermediaire_orass: 'INTERMEDIAIRE B',
        police_orass: 'POLICE-002',
        ancien_numero: null,
        date_effet: '2024-02-01',
        date_echeance: '2024-12-31',
        nom_assure: 'MARTIN Marie',
        societe_concernee: 'IARD (Sinistre)',
        type_document: 'Contrat',
        nom_agent_inventaire: 'Agent 1',
        created_at: '2024-02-01T10:00:00Z'
      },
      {
        id: '5',
        no: 5,
        intermediaire_orass: 'INTERMEDIAIRE B',
        police_orass: 'POLICE-002',
        ancien_numero: null,
        date_effet: '2024-02-01',
        date_echeance: '2024-12-31',
        nom_assure: 'MARTIN Marie',
        societe_concernee: 'IARD (Sinistre)',
        type_document: 'Contrat',
        nom_agent_inventaire: 'Agent 2',
        created_at: '2024-02-01T11:00:00Z'
      },
      // Entrée unique
      {
        id: '6',
        no: 6,
        intermediaire_orass: 'INTERMEDIAIRE C',
        police_orass: 'POLICE-003',
        ancien_numero: null,
        date_effet: '2024-03-01',
        date_echeance: '2024-12-31',
        nom_assure: 'DURAND Pierre',
        societe_concernee: 'Production',
        type_document: 'Police',
        nom_agent_inventaire: 'Agent 1',
        created_at: '2024-03-01T10:00:00Z'
      }
    ];
  };

  const runTests = () => {
    const tests: Array<{
      name: string;
      passed: boolean;
      message: string;
    }> = [];

    const testEntries = createTestEntries();

    // Test 1: Détection de doublons
    try {
      const result = detectDuplicates(testEntries);
      const expectedGroups = 2; // 2 groupes de doublons
      const expectedTotalDuplicates = 5; // 3 + 2 doublons
      
      if (result.duplicates.length === expectedGroups && result.totalDuplicates === expectedTotalDuplicates) {
        tests.push({
          name: 'Détection de doublons',
          passed: true,
          message: `✅ ${result.duplicates.length} groupes détectés, ${result.totalDuplicates} entrées en doublon`
        });
      } else {
        tests.push({
          name: 'Détection de doublons',
          passed: false,
          message: `❌ Attendu: ${expectedGroups} groupes, ${expectedTotalDuplicates} doublons. Reçu: ${result.duplicates.length} groupes, ${result.totalDuplicates} doublons`
        });
      }
    } catch (error) {
      tests.push({
        name: 'Détection de doublons',
        passed: false,
        message: `❌ Erreur: ${error}`
      });
    }

    // Test 2: Vérification de doublon potentiel
    try {
      const newEntry: InventoryFormData = {
        intermediaire_orass: 'INTERMEDIAIRE A',
        police_orass: 'POLICE-001',
        ancien_numero: '',
        date_effet: new Date('2024-01-01'),
        date_echeance: new Date('2024-12-31'),
        nom_assure: 'DUPONT Jean',
        societe_concernee: 'Vie',
        type_document: 'Police'
      };

      const duplicateCheck = checkPotentialDuplicate(newEntry, testEntries);
      
      if (duplicateCheck.isDuplicate && duplicateCheck.existingEntry) {
        tests.push({
          name: 'Vérification doublon potentiel',
          passed: true,
          message: `✅ Doublon détecté pour l'entrée N° ${duplicateCheck.existingEntry.no}`
        });
      } else {
        tests.push({
          name: 'Vérification doublon potentiel',
          passed: false,
          message: '❌ Doublon non détecté alors qu\'il devrait l\'être'
        });
      }
    } catch (error) {
      tests.push({
        name: 'Vérification doublon potentiel',
        passed: false,
        message: `❌ Erreur: ${error}`
      });
    }

    // Test 3: Vérification d'entrée unique
    try {
      const uniqueEntry: InventoryFormData = {
        intermediaire_orass: 'INTERMEDIAIRE D',
        police_orass: 'POLICE-004',
        ancien_numero: '',
        date_effet: new Date('2024-04-01'),
        date_echeance: new Date('2024-12-31'),
        nom_assure: 'NOUVEAU Client',
        societe_concernee: 'Vie',
        type_document: 'Police'
      };

      const duplicateCheck = checkPotentialDuplicate(uniqueEntry, testEntries);
      
      if (!duplicateCheck.isDuplicate) {
        tests.push({
          name: 'Vérification entrée unique',
          passed: true,
          message: '✅ Entrée unique correctement identifiée'
        });
      } else {
        tests.push({
          name: 'Vérification entrée unique',
          passed: false,
          message: '❌ Entrée unique incorrectement identifiée comme doublon'
        });
      }
    } catch (error) {
      tests.push({
        name: 'Vérification entrée unique',
        passed: false,
        message: `❌ Erreur: ${error}`
      });
    }

    // Test 4: Normalisation des chaînes
    try {
      const entry1: InventoryFormData = {
        intermediaire_orass: 'INTERMÉDIAIRE A',
        police_orass: 'POLICE-001',
        ancien_numero: '',
        date_effet: new Date('2024-01-01'),
        date_echeance: new Date('2024-12-31'),
        nom_assure: 'DUPONT Jean',
        societe_concernee: 'Vie',
        type_document: 'Police'
      };

      const duplicateCheck = checkPotentialDuplicate(entry1, testEntries);
      
      if (duplicateCheck.isDuplicate) {
        tests.push({
          name: 'Normalisation des chaînes',
          passed: true,
          message: '✅ Normalisation des accents et casse fonctionne'
        });
      } else {
        tests.push({
          name: 'Normalisation des chaînes',
          passed: false,
          message: '❌ Normalisation des accents et casse ne fonctionne pas'
        });
      }
    } catch (error) {
      tests.push({
        name: 'Normalisation des chaînes',
        passed: false,
        message: `❌ Erreur: ${error}`
      });
    }

    const passed = tests.filter(t => t.passed).length;
    const failed = tests.filter(t => !t.passed).length;

    setTestResults({
      passed,
      failed,
      tests
    });
  };

  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-800">
          <TestTube className="h-5 w-5" />
          Tests de Validation - Système de Détection de Doublons
        </CardTitle>
        <CardDescription>
          Composant de test pour valider le bon fonctionnement de la détection de doublons
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Button onClick={runTests} className="w-full">
          <TestTube className="h-4 w-4 mr-2" />
          Lancer les Tests
        </Button>

        {testResults && (
          <div className="space-y-4">
            {/* Résumé */}
            <div className="flex items-center gap-4 p-4 bg-white rounded-lg border">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-semibold text-green-800">{testResults.passed} tests réussis</span>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <span className="font-semibold text-red-800">{testResults.failed} tests échoués</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-blue-600" />
                <span className="font-semibold text-blue-800">{testResults.tests.length} tests au total</span>
              </div>
            </div>

            {/* Détails des tests */}
            <div className="space-y-2">
              {testResults.tests.map((test, index) => (
                <div 
                  key={index}
                  className={`p-3 rounded-lg border ${
                    test.passed 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {test.passed ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span className="font-medium">{test.name}</span>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">{test.message}</div>
                </div>
              ))}
            </div>

            {/* Instructions */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="text-sm text-yellow-800">
                <div className="font-semibold mb-2">Instructions de validation :</div>
                <ul className="space-y-1 text-xs">
                  <li>• Tous les tests doivent être réussis pour valider le système</li>
                  <li>• Si des tests échouent, vérifiez l'implémentation des fonctions de détection</li>
                  <li>• Ce composant peut être supprimé après validation</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
