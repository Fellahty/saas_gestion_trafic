# Administration - Réinitialisation des données

## Script de réinitialisation

Pour supprimer toutes les données et générer des données de démonstration :

1. **Depuis le navigateur (recommandé)** :
   - Aller sur `/dashboard/admin/clear-and-seed`
   - Cliquer sur "Supprimer et régénérer les données"
   - Confirmer l'action

2. **Depuis le terminal** (nécessite Firebase Admin SDK) :
   ```bash
   node scripts/clear-and-seed.js
   ```

## Données générées

- 3 camions avec matricules marocains
- 5 chauffeurs marocains
- 4 clients (entreprises et particuliers)
- 12 missions entre villes marocaines (Khenifra ↔ El Jadida)
- Assurances, visites techniques, entretiens
- 15 dépenses (carburant, entretien, salaires)

**Toutes les dates sont dans les 30 derniers jours (passé récent).**

