'use client';

import { useState, useEffect } from 'react';
import { addDoc, updateDoc, doc, collection, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase.config';
import { Facture, Client, LigneFacture } from '@/lib/types';
import { X, Plus, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface FactureFormProps {
  facture: Facture | null;
  clients: Client[];
  onClose: () => void;
  onSuccess: () => void;
  generateNumero: () => string;
}

export default function FactureForm({
  facture,
  clients,
  onClose,
  onSuccess,
  generateNumero,
}: FactureFormProps) {
  const [formData, setFormData] = useState({
    numero: facture?.numero || generateNumero(),
    clientId: facture?.clientId || '',
    dateEmission: facture?.dateEmission 
      ? new Date(facture.dateEmission).toISOString().split('T')[0] 
      : new Date().toISOString().split('T')[0],
    dateEcheance: facture?.dateEcheance 
      ? new Date(facture.dateEcheance).toISOString().split('T')[0] 
      : '',
    statut: facture?.statut || 'brouillon',
    type: facture?.type || 'facture',
    lignes: facture?.lignes || [
      { description: '', quantite: 1, prixUnitaire: 0, tva: 20, remise: 0, total: 0 }
    ] as LigneFacture[],
    notes: facture?.notes || '',
    conditionsPaiement: facture?.conditionsPaiement || '30 jours',
    missionId: facture?.missionId || '',
  });

  const [totals, setTotals] = useState({
    totalHT: 0,
    totalTVA: 0,
    totalTTC: 0,
  });

  useEffect(() => {
    calculateTotals();
  }, [formData.lignes]);

  const calculateTotals = () => {
    let totalHT = 0;
    let totalTVA = 0;

    formData.lignes.forEach(ligne => {
      const totalLigne = ligne.quantite * ligne.prixUnitaire;
      const remise = totalLigne * (ligne.remise || 0) / 100;
      const totalHTLigne = totalLigne - remise;
      const tvaLigne = totalHTLigne * (ligne.tva || 0) / 100;
      
      totalHT += totalHTLigne;
      totalTVA += tvaLigne;
    });

    setTotals({
      totalHT,
      totalTVA,
      totalTTC: totalHT + totalTVA,
    });
  };

  const updateLigne = (index: number, field: keyof LigneFacture, value: any) => {
    const newLignes = [...formData.lignes];
    newLignes[index] = { ...newLignes[index], [field]: value };
    
    // Recalculate line total
    const ligne = newLignes[index];
    const totalLigne = ligne.quantite * ligne.prixUnitaire;
    const remise = totalLigne * (ligne.remise || 0) / 100;
    newLignes[index].total = totalLigne - remise;
    
    setFormData({ ...formData, lignes: newLignes });
  };

  const addLigne = () => {
    setFormData({
      ...formData,
      lignes: [
        ...formData.lignes,
        { description: '', quantite: 1, prixUnitaire: 0, tva: 20, remise: 0, total: 0 }
      ]
    });
  };

  const removeLigne = (index: number) => {
    if (formData.lignes.length > 1) {
      setFormData({
        ...formData,
        lignes: formData.lignes.filter((_, i) => i !== index)
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.clientId) {
      alert('Veuillez sélectionner un client');
      return;
    }

    if (formData.lignes.some(l => !l.description || l.prixUnitaire <= 0)) {
      alert('Veuillez remplir toutes les lignes correctement');
      return;
    }

    try {
      const factureData = {
        ...formData,
        totalHT: totals.totalHT,
        totalTVA: totals.totalTVA,
        totalTTC: totals.totalTTC,
        montantPaye: facture?.montantPaye || 0,
        montantRestant: totals.totalTTC - (facture?.montantPaye || 0),
        dateEmission: Timestamp.fromDate(new Date(formData.dateEmission)),
        dateEcheance: formData.dateEcheance ? Timestamp.fromDate(new Date(formData.dateEcheance)) : null,
        createdAt: facture?.createdAt ? Timestamp.fromDate(new Date(facture.createdAt)) : Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      if (facture) {
        await updateDoc(doc(db, 'factures', facture.id), factureData);
      } else {
        await addDoc(collection(db, 'factures'), {
          ...factureData,
          createdAt: Timestamp.now(),
        });
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving facture:', error);
      alert('Erreur lors de l\'enregistrement');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {facture ? 'Modifier' : 'Nouvelle facture'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Header Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Client *
              </label>
              <select
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              >
                <option value="">Sélectionner un client</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>{client.nom}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Numéro de facture
              </label>
              <input
                type="text"
                value={formData.numero}
                onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date d'émission *
              </label>
              <input
                type="date"
                value={formData.dateEmission}
                onChange={(e) => setFormData({ ...formData, dateEmission: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date d'échéance
              </label>
              <input
                type="date"
                value={formData.dateEcheance}
                onChange={(e) => setFormData({ ...formData, dateEcheance: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Statut
              </label>
              <select
                value={formData.statut}
                onChange={(e) => setFormData({ ...formData, statut: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="brouillon">Brouillon</option>
                <option value="envoyee">Envoyée</option>
                <option value="payee">Payée</option>
                <option value="partiellement_payee">Partiellement payée</option>
                <option value="en_retard">En retard</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Conditions de paiement
              </label>
              <input
                type="text"
                value={formData.conditionsPaiement}
                onChange={(e) => setFormData({ ...formData, conditionsPaiement: e.target.value })}
                placeholder="Ex: 30 jours"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Lignes de facture */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Lignes de facture
              </label>
              <button
                type="button"
                onClick={addLigne}
                className="flex items-center space-x-2 px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
              >
                <Plus size={16} />
                <span>Ajouter une ligne</span>
              </button>
            </div>

            <div className="space-y-3">
              {formData.lignes.map((ligne, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-start p-3 bg-gray-50 rounded-lg">
                  <div className="col-span-12 md:col-span-4">
                    <input
                      type="text"
                      placeholder="Description"
                      value={ligne.description}
                      onChange={(e) => updateLigne(index, 'description', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                      required
                    />
                  </div>
                  <div className="col-span-6 md:col-span-1">
                    <input
                      type="number"
                      placeholder="Qté"
                      value={ligne.quantite}
                      onChange={(e) => updateLigne(index, 'quantite', parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="col-span-6 md:col-span-2">
                    <input
                      type="number"
                      placeholder="Prix unitaire"
                      value={ligne.prixUnitaire}
                      onChange={(e) => updateLigne(index, 'prixUnitaire', parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="col-span-4 md:col-span-1">
                    <input
                      type="number"
                      placeholder="TVA %"
                      value={ligne.tva || 0}
                      onChange={(e) => updateLigne(index, 'tva', parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                      min="0"
                      max="100"
                    />
                  </div>
                  <div className="col-span-4 md:col-span-1">
                    <input
                      type="number"
                      placeholder="Remise %"
                      value={ligne.remise || 0}
                      onChange={(e) => updateLigne(index, 'remise', parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                      min="0"
                      max="100"
                    />
                  </div>
                  <div className="col-span-4 md:col-span-2 flex items-center">
                    <span className="font-medium text-gray-700">{formatCurrency(ligne.total)}</span>
                  </div>
                  <div className="col-span-12 md:col-span-1 flex justify-end">
                    {formData.lignes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLigne(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-700">Total HT:</span>
              <span className="font-medium">{formatCurrency(totals.totalHT)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Total TVA:</span>
              <span className="font-medium">{formatCurrency(totals.totalTVA)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t border-gray-300 pt-2">
              <span className="text-gray-900">Total TTC:</span>
              <span className="text-primary-600">{formatCurrency(totals.totalTTC)}</span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Notes additionnelles..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              {facture ? 'Enregistrer' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
