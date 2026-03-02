# Correction du problème : champ agence à NULL

## 🔍 Problème identifié

Le champ `agence` reste à `NULL` pour toutes les entrées de la base de données. Cela peut être dû à :

1. **Les migrations n'ont pas été exécutées** dans Supabase
2. **Des entrées ont été créées avant l'implémentation** de la gestion d'agence
3. **Le code frontend n'envoie pas l'agence** lors de l'insertion (peu probable car il y a une validation)

## ✅ Solution immédiate

### Étape 1 : Exécuter le script de correction

Exécutez le fichier `fix_agence_null.sql` directement dans le **Supabase SQL Editor** :

1. Ouvrez Supabase Dashboard
2. Allez dans **SQL Editor**
3. Copiez-collez le contenu de `fix_agence_null.sql`
4. Cliquez sur **Run** (Exécuter)

Ce script va :
- Mettre à jour toutes les entrées avec `agence IS NULL` selon les règles historiques
- Assigner une agence par défaut aux entrées restantes
- Afficher un résumé des mises à jour effectuées

### Étape 2 : Vérifier que les migrations sont appliquées

Assurez-vous que les migrations suivantes sont bien appliquées dans Supabase :

1. `20250120000000_add_agence_column.sql` - Ajoute la colonne agence
2. `20250120000001_update_historical_agence_data.sql` - Met à jour les données historiques
3. `20250120000002_add_agent_stats_by_agence.sql` - Ajoute les fonctions RPC pour les stats

Pour vérifier si la colonne existe :
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'inventory'
  AND column_name = 'agence';
```

### Étape 3 : Vérifier les nouvelles insertions

Pour vérifier que les nouvelles entrées incluent bien l'agence :

1. Ouvrez la console du navigateur (F12)
2. Soumettez une nouvelle entrée
3. Vérifiez dans les logs que `agence` est bien présent dans l'objet envoyé

Ou vérifiez directement en base :
```sql
SELECT 
    id,
    nom_agent_inventaire,
    agence,
    created_at
FROM public.inventory
ORDER BY created_at DESC
LIMIT 10;
```

## 🔧 Solutions alternatives

### Si le script ne fonctionne pas

Si après exécution du script, il reste des entrées avec `agence IS NULL`, exécutez cette requête pour voir quelles entrées posent problème :

```sql
SELECT 
    id,
    nom_agent_inventaire,
    DATE(created_at) as date_creation,
    created_at,
    agence
FROM public.inventory
WHERE agence IS NULL
ORDER BY created_at DESC;
```

Ensuite, vous pouvez les corriger manuellement selon les règles :

```sql
-- Exemple : corriger une entrée spécifique
UPDATE public.inventory
SET agence = 'Nzeng-Ayong'  -- ou l'agence appropriée
WHERE id = 'UUID_DE_L_ENTREE';
```

### Vérifier que la contrainte CHECK permet NULL

La contrainte CHECK devrait permettre NULL pour la colonne agence. Si ce n'est pas le cas, modifiez-la :

```sql
-- Vérifier la contrainte actuelle
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.inventory'::regclass
  AND conname LIKE '%agence%';

-- Si nécessaire, modifier pour permettre NULL explicitement
ALTER TABLE public.inventory
DROP CONSTRAINT IF EXISTS inventory_agence_check;

ALTER TABLE public.inventory
ADD CONSTRAINT inventory_agence_check 
CHECK (agence IS NULL OR agence IN ('Okala', 'Nzeng-Ayong', 'PK9', 'Espace Conseil', 'Owendo'));
```

## 📊 Vérification finale

Après correction, vérifiez la répartition par agence :

```sql
SELECT 
    agence,
    COUNT(*) as nombre_entrees,
    COUNT(*) * 100.0 / SUM(COUNT(*)) OVER () as pourcentage
FROM public.inventory
GROUP BY agence
ORDER BY nombre_entrees DESC;
```

Toutes les entrées devraient avoir une agence assignée (sauf si vous avez intentionnellement laissé certaines entrées sans agence pour des tests).

## 🐛 Débogage

Si le problème persiste après ces corrections :

1. **Vérifiez les logs du navigateur** lors de la soumission d'une entrée
2. **Vérifiez les logs Supabase** pour voir s'il y a des erreurs d'insertion
3. **Testez avec une nouvelle entrée** en vérifiant que `currentAgence` n'est pas null avant la soumission
4. **Vérifiez localStorage** : `localStorage.getItem('inventoryAgence')` devrait retourner une valeur

Pour déboguer dans la console :
```javascript
// Dans la console du navigateur
console.log('Agence sauvegardée:', localStorage.getItem('inventoryAgence'));
```
