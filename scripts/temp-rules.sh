#!/bin/bash

# Script pour temporairement ouvrir les règles Firestore
# ATTENTION: Ne pas utiliser en production !

echo "⚠️  ATTENTION: Ce script va ouvrir temporairement les règles Firestore"
echo "   Les règles seront restaurées après l'exécution du script de génération"
echo ""
read -p "Voulez-vous continuer ? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Annulé"
    exit 1
fi

# Sauvegarder les règles actuelles
echo "📦 Sauvegarde des règles actuelles..."
cp firestore.rules firestore.rules.backup

# Copier les règles temporaires
echo "📝 Application des règles temporaires..."
cp firestore.rules.temp firestore.rules

# Déployer les règles temporaires
echo "🚀 Déploiement des règles temporaires..."
firebase deploy --only firestore:rules

echo ""
echo "✅ Règles temporaires déployées !"
echo ""
echo "📝 Vous pouvez maintenant exécuter:"
echo "   node scripts/clear-and-seed.js"
echo ""
read -p "Appuyez sur Entrée une fois le script terminé pour restaurer les règles..."

# Restaurer les règles originales
echo "🔄 Restauration des règles originales..."
cp firestore.rules.backup firestore.rules
firebase deploy --only firestore:rules

# Supprimer la sauvegarde
rm firestore.rules.backup

echo "✅ Règles restaurées !"

