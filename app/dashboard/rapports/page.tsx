'use client';

import { useEffect, useState, useMemo } from 'react';
import { collection, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase.config';
import { Camion, Chauffeur, Mission, Depense, Recette, Facture } from '@/lib/types';
import { Download, TrendingUp, TrendingDown, DollarSign, Truck, Users, BarChart3, FileText } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { format, startOfMonth, endOfMonth, subMonths, eachMonthOfInterval } from 'date-fns';
import { fr } from 'date-fns/locale';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function RapportsPage() {
  const [camions, setCamions] = useState<Camion[]>([]);
  const [chauffeurs, setChauffeurs] = useState<Chauffeur[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [depenses, setDepenses] = useState<Depense[]>([]);
  const [recettes, setRecettes] = useState<Recette[]>([]);
  const [factures, setFactures] = useState<Facture[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year'>('month');
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [camionsSnap, chauffeursSnap, missionsSnap, depensesSnap, recettesSnap, facturesSnap] = await Promise.all([
        getDocs(collection(db, 'camions')),
        getDocs(collection(db, 'chauffeurs')),
        getDocs(collection(db, 'missions')),
        getDocs(collection(db, 'depenses')),
        getDocs(collection(db, 'recettes')),
        getDocs(collection(db, 'factures')),
      ]);

      setCamions(camionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Camion)));
      setChauffeurs(chauffeursSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Chauffeur)));
      setMissions(missionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Mission)));
      setDepenses(depensesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Depense)));
      setRecettes(recettesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Recette)));
      setFactures(facturesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Facture)));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculs des KPIs
  const kpis = useMemo(() => {
    const periodeDebut = startOfMonth(selectedMonth);
    const periodeFin = endOfMonth(selectedMonth);

    const depensesPeriode = depenses.filter(d => {
      const date = d.date instanceof Timestamp ? d.date.toDate() : new Date(d.date);
      return date >= periodeDebut && date <= periodeFin;
    });

    const recettesPeriode = recettes.filter(r => {
      const date = r.date instanceof Timestamp ? r.date.toDate() : new Date(r.date);
      return date >= periodeDebut && date <= periodeFin;
    });

    const missionsPeriode = missions.filter(m => {
      const date = m.dateDebut instanceof Timestamp ? m.dateDebut.toDate() : new Date(m.dateDebut);
      return date >= periodeDebut && date <= periodeFin;
    });

    const totalDepenses = depensesPeriode.reduce((sum, d) => sum + d.montant, 0);
    const totalRecettes = recettesPeriode.reduce((sum, r) => sum + r.montant, 0);
    const profit = totalRecettes - totalDepenses;
    const marge = totalRecettes > 0 ? (profit / totalRecettes) * 100 : 0;

    // Coût par mission
    const coutParMission = missionsPeriode.length > 0 
      ? missionsPeriode.reduce((sum, m) => {
          const cout = m.coutEstime.carburant + m.coutEstime.peage + m.coutEstime.repas + m.coutEstime.autre;
          return sum + cout;
        }, 0) / missionsPeriode.length
      : 0;

    // Taux d'utilisation des camions
    const camionsActifs = camions.filter(c => c.etat === 'actif').length;
    const tauxUtilisation = camionsActifs > 0 ? (missionsPeriode.length / (camionsActifs * 30)) * 100 : 0;

    // Factures impayées
    const facturesImpayees = factures.filter(f => f.montantRestant > 0 && f.statut !== 'payee');
    const creances = facturesImpayees.reduce((sum, f) => sum + f.montantRestant, 0);

    return {
      totalRecettes,
      totalDepenses,
      profit,
      marge,
      nbMissions: missionsPeriode.length,
      coutParMission,
      tauxUtilisation,
      creances,
      nbFacturesImpayees: facturesImpayees.length,
    };
  }, [depenses, recettes, missions, camions, factures, selectedMonth]);

  // Graphique des revenus/dépenses par mois
  const monthlyData = useMemo(() => {
    const months = eachMonthOfInterval({
      start: subMonths(selectedMonth, 5),
      end: selectedMonth,
    });

    return months.map(month => {
      const debut = startOfMonth(month);
      const fin = endOfMonth(month);

      const dep = depenses.filter(d => {
        const date = d.date instanceof Timestamp ? d.date.toDate() : new Date(d.date);
        return date >= debut && date <= fin;
      }).reduce((sum, d) => sum + d.montant, 0);

      const rec = recettes.filter(r => {
        const date = r.date instanceof Timestamp ? r.date.toDate() : new Date(r.date);
        return date >= debut && date <= fin;
      }).reduce((sum, r) => sum + r.montant, 0);

      return {
        mois: format(month, 'MMM yyyy', { locale: fr }),
        recettes: rec,
        depenses: dep,
        profit: rec - dep,
      };
    });
  }, [depenses, recettes, selectedMonth]);

  // Top 5 camions par rentabilité
  const topCamions = useMemo(() => {
    const camionStats = camions.map(camion => {
      const missionsCamion = missions.filter(m => m.camionId === camion.id);
      const recettesCamion = missionsCamion.reduce((sum, m) => sum + (m.recette || 0), 0);
      const depensesCamion = missionsCamion.reduce((sum, m) => {
        const cout = m.coutEstime.carburant + m.coutEstime.peage + m.coutEstime.repas + m.coutEstime.autre;
        return sum + cout;
      }, 0);
      const profit = recettesCamion - depensesCamion;

      return {
        camion: camion.matricule,
        profit,
        recettes: recettesCamion,
        nbMissions: missionsCamion.length,
      };
    });

    return camionStats.sort((a, b) => b.profit - a.profit).slice(0, 5);
  }, [camions, missions]);

  // Top 5 chauffeurs par performance
  const topChauffeurs = useMemo(() => {
    const chauffeurStats = chauffeurs.map(chauffeur => {
      const missionsChauffeur = missions.filter(m => m.chauffeurId === chauffeur.id);
      const recettesChauffeur = missionsChauffeur.reduce((sum, m) => sum + (m.recette || 0), 0);
      const depensesChauffeur = missionsChauffeur.reduce((sum, m) => {
        const cout = m.coutEstime.carburant + m.coutEstime.peage + m.coutEstime.repas + m.coutEstime.autre;
        return sum + cout;
      }, 0);
      const profit = recettesChauffeur - depensesChauffeur;

      return {
        nom: `${chauffeur.prenom} ${chauffeur.nom}`,
        profit,
        recettes: recettesChauffeur,
        nbMissions: missionsChauffeur.length,
      };
    });

    return chauffeurStats.sort((a, b) => b.profit - a.profit).slice(0, 5);
  }, [chauffeurs, missions]);

  // Dépenses par type
  const depensesByType = useMemo(() => {
    const periodeDebut = startOfMonth(selectedMonth);
    const periodeFin = endOfMonth(selectedMonth);

    const depensesPeriode = depenses.filter(d => {
      const date = d.date instanceof Timestamp ? d.date.toDate() : new Date(d.date);
      return date >= periodeDebut && date <= periodeFin;
    });

    const byType: Record<string, number> = {};
    depensesPeriode.forEach(d => {
      byType[d.type] = (byType[d.type] || 0) + d.montant;
    });

    return Object.entries(byType).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }));
  }, [depenses, selectedMonth]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full overflow-x-hidden space-y-3 sm:space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="text-primary-600" />
            Rapports et Analyses
          </h1>
          <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">
            Analysez la performance de votre flotte
          </p>
        </div>
        <div className="flex gap-2">
          <input
            type="month"
            value={format(selectedMonth, 'yyyy-MM')}
            onChange={(e) => setSelectedMonth(new Date(e.target.value + '-01'))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
          <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm">
            <Download size={18} />
            Exporter
          </button>
        </div>
      </div>

      {/* KPIs Principaux */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Chiffre d'affaires</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(kpis.totalRecettes)}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total dépenses</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(kpis.totalDepenses)}
              </p>
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Bénéfice net</p>
              <p className={`text-2xl font-bold mt-1 ${kpis.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(kpis.profit)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Marge: {kpis.marge.toFixed(1)}%
              </p>
            </div>
            <div className={`p-3 rounded-full ${kpis.profit >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              <DollarSign className={`w-6 h-6 ${kpis.profit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Créances clients</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">
                {formatCurrency(kpis.creances)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {kpis.nbFacturesImpayees} facture{kpis.nbFacturesImpayees > 1 ? 's' : ''}
              </p>
            </div>
            <div className="bg-orange-100 p-3 rounded-full">
              <FileText className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Évolution Revenus/Dépenses */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Évolution financière</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mois" />
              <YAxis />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
              <Line type="monotone" dataKey="recettes" stroke="#10b981" strokeWidth={2} />
              <Line type="monotone" dataKey="depenses" stroke="#ef4444" strokeWidth={2} />
              <Line type="monotone" dataKey="profit" stroke="#0ea5e9" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Dépenses par type */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Répartition des dépenses</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={depensesByType}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {depensesByType.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tableaux de performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top 5 Camions */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Truck className="text-primary-600" />
            Top 5 Camions par rentabilité
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Camion</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bénéfice</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Missions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topCamions.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.camion}</td>
                    <td className={`px-4 py-3 text-sm font-medium ${item.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(item.profit)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{item.nbMissions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top 5 Chauffeurs */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="text-primary-600" />
            Top 5 Chauffeurs par performance
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Chauffeur</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bénéfice</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Missions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topChauffeurs.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.nom}</td>
                    <td className={`px-4 py-3 text-sm font-medium ${item.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(item.profit)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{item.nbMissions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Métriques additionnelles */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Indicateurs de performance</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Missions réalisées</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{kpis.nbMissions}</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Coût moyen par mission</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(kpis.coutParMission)}</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Taux d'utilisation</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{kpis.tauxUtilisation.toFixed(1)}%</p>
          </div>
        </div>
      </div>
    </div>
  );
}
