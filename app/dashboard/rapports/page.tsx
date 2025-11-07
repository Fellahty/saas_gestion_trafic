'use client';

import { useEffect, useState, useMemo } from 'react';
import { collection, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase.config';
import { Camion, Chauffeur, Mission, Depense, Recette, Facture } from '@/lib/types';
import { Download, TrendingUp, TrendingDown, DollarSign, Truck, Users, BarChart3, FileText, Loader2, FileSpreadsheet, ChevronDown } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { format, startOfMonth, endOfMonth, subMonths, eachMonthOfInterval } from 'date-fns';
import { fr } from 'date-fns/locale';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function RapportsPage() {
  const [camions, setCamions] = useState<Camion[]>([]);
  const [chauffeurs, setChauffeurs] = useState<Chauffeur[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [depenses, setDepenses] = useState<Depense[]>([]);
  const [recettes, setRecettes] = useState<Recette[]>([]);
  const [factures, setFactures] = useState<Facture[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
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

  // Fonction d'export PDF
  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const doc = new jsPDF();
      const primaryColor: [number, number, number] = [14, 165, 233];
      const darkColor: [number, number, number] = [31, 41, 55];
      const lightGray: [number, number, number] = [243, 244, 246];

      let yPos = 20;

      // Header
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(0, 0, 210, 50, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('Rapports et Analyses', 20, 25);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('FleetManager - Gestion de flotte', 20, 32);
      doc.text(`Période: ${format(selectedMonth, 'MMMM yyyy', { locale: fr })}`, 150, 32, { align: 'right' });
      doc.text(`Date d'export: ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}`, 150, 38, { align: 'right' });

      yPos = 60;

      // KPIs Principaux
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Indicateurs Clés', 20, yPos);
      yPos += 10;

      autoTable(doc, {
        startY: yPos,
        head: [['Indicateur', 'Valeur']],
        body: [
          ['Chiffre d\'affaires', formatCurrency(kpis.totalRecettes)],
          ['Total dépenses', formatCurrency(kpis.totalDepenses)],
          ['Bénéfice net', formatCurrency(kpis.profit)],
          ['Marge bénéficiaire', `${kpis.marge.toFixed(1)}%`],
          ['Créances clients', formatCurrency(kpis.creances)],
          ['Nombre de factures impayées', kpis.nbFacturesImpayees.toString()],
          ['Missions réalisées', kpis.nbMissions.toString()],
          ['Coût moyen par mission', formatCurrency(kpis.coutParMission)],
          ['Taux d\'utilisation', `${kpis.tauxUtilisation.toFixed(1)}%`],
        ],
        theme: 'striped',
        headStyles: {
          fillColor: primaryColor,
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 10,
        },
        bodyStyles: {
          textColor: darkColor,
          fontSize: 9,
        },
        alternateRowStyles: {
          fillColor: lightGray,
        },
        margin: { left: 20, right: 20 },
      });

      const kpisY = (doc as any).lastAutoTable.finalY || yPos;
      yPos = kpisY + 15;

      // Données mensuelles
      if (monthlyData.length > 0) {
        doc.addPage();
        yPos = 20;
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Évolution Financière (6 derniers mois)', 20, yPos);
        yPos += 10;

        autoTable(doc, {
          startY: yPos,
          head: [['Mois', 'Recettes', 'Dépenses', 'Bénéfice']],
          body: monthlyData.map(item => [
            item.mois,
            formatCurrency(item.recettes),
            formatCurrency(item.depenses),
            formatCurrency(item.profit),
          ]),
          theme: 'striped',
          headStyles: {
            fillColor: primaryColor,
            textColor: 255,
            fontStyle: 'bold',
            fontSize: 10,
          },
          bodyStyles: {
            textColor: darkColor,
            fontSize: 9,
          },
          alternateRowStyles: {
            fillColor: lightGray,
          },
          margin: { left: 20, right: 20 },
        });

        yPos = (doc as any).lastAutoTable.finalY || yPos;
      }

      // Top 5 Camions
      if (topCamions.length > 0) {
        doc.addPage();
        yPos = 20;
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Top 5 Camions par Rentabilité', 20, yPos);
        yPos += 10;

        autoTable(doc, {
          startY: yPos,
          head: [['#', 'Camion', 'Bénéfice', 'Missions']],
          body: topCamions.map((item, index) => [
            (index + 1).toString(),
            item.camion,
            formatCurrency(item.profit),
            item.nbMissions.toString(),
          ]),
          theme: 'striped',
          headStyles: {
            fillColor: primaryColor,
            textColor: 255,
            fontStyle: 'bold',
            fontSize: 10,
          },
          bodyStyles: {
            textColor: darkColor,
            fontSize: 9,
          },
          alternateRowStyles: {
            fillColor: lightGray,
          },
          margin: { left: 20, right: 20 },
        });
      }

      // Top 5 Chauffeurs
      if (topChauffeurs.length > 0) {
        const currentPage = doc.getCurrentPageInfo().pageNumber;
        const pageHeight = doc.internal.pageSize.height;
        const lastY = (doc as any).lastAutoTable?.finalY || 60;
        
        if (lastY > pageHeight - 60) {
          doc.addPage();
          yPos = 20;
        } else {
          yPos = lastY + 15;
        }

        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Top 5 Chauffeurs par Performance', 20, yPos);
        yPos += 10;

        autoTable(doc, {
          startY: yPos,
          head: [['#', 'Chauffeur', 'Bénéfice', 'Missions']],
          body: topChauffeurs.map((item, index) => [
            (index + 1).toString(),
            item.nom,
            formatCurrency(item.profit),
            item.nbMissions.toString(),
          ]),
          theme: 'striped',
          headStyles: {
            fillColor: primaryColor,
            textColor: 255,
            fontStyle: 'bold',
            fontSize: 10,
          },
          bodyStyles: {
            textColor: darkColor,
            fontSize: 9,
          },
          alternateRowStyles: {
            fillColor: lightGray,
          },
          margin: { left: 20, right: 20 },
        });
      }

      // Dépenses par type
      if (depensesByType.length > 0) {
        doc.addPage();
        yPos = 20;
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Répartition des Dépenses par Type', 20, yPos);
        yPos += 10;

        const totalDepenses = depensesByType.reduce((sum, item) => sum + item.value, 0);

        autoTable(doc, {
          startY: yPos,
          head: [['Type de dépense', 'Montant', 'Pourcentage']],
          body: depensesByType.map(item => [
            item.name,
            formatCurrency(item.value),
            `${((item.value / totalDepenses) * 100).toFixed(1)}%`,
          ]),
          theme: 'striped',
          headStyles: {
            fillColor: primaryColor,
            textColor: 255,
            fontStyle: 'bold',
            fontSize: 10,
          },
          bodyStyles: {
            textColor: darkColor,
            fontSize: 9,
          },
          alternateRowStyles: {
            fillColor: lightGray,
          },
          margin: { left: 20, right: 20 },
        });
      }

      // Footer sur chaque page
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        const pageHeight = doc.internal.pageSize.height;
        doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.setLineWidth(0.5);
        doc.line(20, pageHeight - 30, 190, pageHeight - 30);
        
        doc.setTextColor(128, 128, 128);
        doc.setFontSize(8);
        doc.text('FleetManager - Gestion de flotte professionnelle', 105, pageHeight - 20, { align: 'center' });
        doc.text(`Page ${i} sur ${totalPages}`, 105, pageHeight - 15, { align: 'center' });
      }

      // Sauvegarder le PDF
      const fileName = `Rapport-${format(selectedMonth, 'yyyy-MM', { locale: fr })}-${format(new Date(), 'yyyyMMdd-HHmmss')}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error);
      alert('Une erreur est survenue lors de l\'export. Veuillez réessayer.');
    } finally {
      setExporting(false);
    }
  };

  // Fonction d'export CSV/Excel
  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const workbook = XLSX.utils.book_new();

      // Feuille 1: KPIs
      const kpisData = [
        ['Indicateur', 'Valeur'],
        ['Chiffre d\'affaires', kpis.totalRecettes],
        ['Total dépenses', kpis.totalDepenses],
        ['Bénéfice net', kpis.profit],
        ['Marge bénéficiaire (%)', kpis.marge],
        ['Créances clients', kpis.creances],
        ['Nombre de factures impayées', kpis.nbFacturesImpayees],
        ['Missions réalisées', kpis.nbMissions],
        ['Coût moyen par mission', kpis.coutParMission],
        ['Taux d\'utilisation (%)', kpis.tauxUtilisation],
      ];
      const kpisSheet = XLSX.utils.aoa_to_sheet(kpisData);
      XLSX.utils.book_append_sheet(workbook, kpisSheet, 'KPIs');

      // Feuille 2: Évolution mensuelle
      if (monthlyData.length > 0) {
        const monthlySheetData = [
          ['Mois', 'Recettes', 'Dépenses', 'Bénéfice'],
          ...monthlyData.map(item => [
            item.mois,
            item.recettes,
            item.depenses,
            item.profit,
          ]),
        ];
        const monthlySheet = XLSX.utils.aoa_to_sheet(monthlySheetData);
        XLSX.utils.book_append_sheet(workbook, monthlySheet, 'Évolution Mensuelle');
      }

      // Feuille 3: Top Camions
      if (topCamions.length > 0) {
        const camionsSheetData = [
          ['#', 'Camion', 'Bénéfice', 'Missions'],
          ...topCamions.map((item, index) => [
            index + 1,
            item.camion,
            item.profit,
            item.nbMissions,
          ]),
        ];
        const camionsSheet = XLSX.utils.aoa_to_sheet(camionsSheetData);
        XLSX.utils.book_append_sheet(workbook, camionsSheet, 'Top Camions');
      }

      // Feuille 4: Top Chauffeurs
      if (topChauffeurs.length > 0) {
        const chauffeursSheetData = [
          ['#', 'Chauffeur', 'Bénéfice', 'Missions'],
          ...topChauffeurs.map((item, index) => [
            index + 1,
            item.nom,
            item.profit,
            item.nbMissions,
          ]),
        ];
        const chauffeursSheet = XLSX.utils.aoa_to_sheet(chauffeursSheetData);
        XLSX.utils.book_append_sheet(workbook, chauffeursSheet, 'Top Chauffeurs');
      }

      // Feuille 5: Dépenses par type
      if (depensesByType.length > 0) {
        const totalDepenses = depensesByType.reduce((sum, item) => sum + item.value, 0);
        const depensesSheetData = [
          ['Type de dépense', 'Montant', 'Pourcentage (%)'],
          ...depensesByType.map(item => [
            item.name,
            item.value,
            (item.value / totalDepenses) * 100,
          ]),
        ];
        const depensesSheet = XLSX.utils.aoa_to_sheet(depensesSheetData);
        XLSX.utils.book_append_sheet(workbook, depensesSheet, 'Dépenses par Type');
      }

      // Exporter le fichier
      const fileName = `Rapport-${format(selectedMonth, 'yyyy-MM', { locale: fr })}-${format(new Date(), 'yyyyMMdd-HHmmss')}.xlsx`;
      XLSX.writeFile(workbook, fileName);
    } catch (error) {
      console.error('Erreur lors de l\'export Excel:', error);
      alert('Une erreur est survenue lors de l\'export. Veuillez réessayer.');
    } finally {
      setExporting(false);
    }
  };

  // Fermer le menu d'export quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.export-menu-container')) {
        setShowExportMenu(false);
      }
    };

    if (showExportMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showExportMenu]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600"></div>
          <p className="text-gray-600 text-sm">Chargement des données...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full overflow-x-hidden container-zoom-safe space-y-4 sm:space-y-6">
      {/* Header amélioré */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 p-4 sm:p-6 bg-gradient-to-r from-primary-50 via-white to-primary-50 rounded-xl border border-primary-100 shadow-sm">
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary-100 rounded-lg">
              <BarChart3 className="w-6 h-6 sm:w-7 sm:h-7 text-primary-600" />
            </div>
            <span>Rapports et Analyses</span>
          </h1>
          <p className="text-gray-600 text-sm sm:text-base mt-1">
            Analysez la performance de votre flotte en temps réel
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          <div className="relative">
            <input
              type="month"
              value={format(selectedMonth, 'yyyy-MM')}
              onChange={(e) => setSelectedMonth(new Date(e.target.value + '-01'))}
              className="w-full sm:w-auto px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all bg-white shadow-sm hover:border-gray-400"
            />
          </div>
          <div className="relative export-menu-container">
            <button 
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={exporting}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-primary-400 disabled:cursor-not-allowed text-sm font-medium transition-all shadow-md hover:shadow-lg active:scale-95"
            >
              {exporting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span className="hidden sm:inline">Export en cours...</span>
                  <span className="sm:hidden">Export...</span>
                </>
              ) : (
                <>
                  <Download size={18} />
                  <span className="hidden sm:inline">Exporter</span>
                  <span className="sm:hidden">Export</span>
                  <ChevronDown size={16} className={`transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
                </>
              )}
            </button>
            
            {showExportMenu && !exporting && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
                <button
                  onClick={() => {
                    handleExportPDF();
                    setShowExportMenu(false);
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 text-sm font-medium text-gray-700"
                >
                  <FileText size={18} className="text-red-600" />
                  <span>Exporter en PDF</span>
                </button>
                <button
                  onClick={() => {
                    handleExportExcel();
                    setShowExportMenu(false);
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 text-sm font-medium text-gray-700 border-t border-gray-200"
                >
                  <FileSpreadsheet size={18} className="text-green-600" />
                  <span>Exporter en Excel</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* KPIs Principaux - Design amélioré */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Carte CA */}
        <div className="group bg-white rounded-xl shadow-md border border-gray-200 p-5 sm:p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-100 rounded-full -mr-16 -mt-16 opacity-20 group-hover:opacity-30 transition-opacity"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600 uppercase tracking-wide">Chiffre d'affaires</p>
              <div className="bg-green-100 p-2.5 rounded-lg group-hover:bg-green-200 transition-colors">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
              {formatCurrency(kpis.totalRecettes)}
            </p>
            <div className="flex items-center gap-1 mt-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-500">Mois en cours</span>
            </div>
          </div>
        </div>

        {/* Carte Dépenses */}
        <div className="group bg-white rounded-xl shadow-md border border-gray-200 p-5 sm:p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-100 rounded-full -mr-16 -mt-16 opacity-20 group-hover:opacity-30 transition-opacity"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600 uppercase tracking-wide">Total dépenses</p>
              <div className="bg-red-100 p-2.5 rounded-lg group-hover:bg-red-200 transition-colors">
                <TrendingDown className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
              {formatCurrency(kpis.totalDepenses)}
            </p>
            <div className="flex items-center gap-1 mt-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-500">Mois en cours</span>
            </div>
          </div>
        </div>

        {/* Carte Bénéfice */}
        <div className={`group bg-white rounded-xl shadow-md border ${kpis.profit >= 0 ? 'border-green-200' : 'border-red-200'} p-5 sm:p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden`}>
          <div className={`absolute top-0 right-0 w-32 h-32 ${kpis.profit >= 0 ? 'bg-green-100' : 'bg-red-100'} rounded-full -mr-16 -mt-16 opacity-20 group-hover:opacity-30 transition-opacity`}></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600 uppercase tracking-wide">Bénéfice net</p>
              <div className={`p-2.5 rounded-lg ${kpis.profit >= 0 ? 'bg-green-100 group-hover:bg-green-200' : 'bg-red-100 group-hover:bg-red-200'} transition-colors`}>
                <DollarSign className={`w-5 h-5 sm:w-6 sm:h-6 ${kpis.profit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              </div>
            </div>
            <p className={`text-2xl sm:text-3xl font-bold mb-1 ${kpis.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(kpis.profit)}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${kpis.profit >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                Marge: {kpis.marge.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Carte Créances */}
        <div className="group bg-white rounded-xl shadow-md border border-orange-200 p-5 sm:p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-100 rounded-full -mr-16 -mt-16 opacity-20 group-hover:opacity-30 transition-opacity"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600 uppercase tracking-wide">Créances clients</p>
              <div className="bg-orange-100 p-2.5 rounded-lg group-hover:bg-orange-200 transition-colors">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-orange-600 mb-1">
              {formatCurrency(kpis.creances)}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs font-medium text-gray-600">
                {kpis.nbFacturesImpayees} facture{kpis.nbFacturesImpayees > 1 ? 's' : ''} impayée{kpis.nbFacturesImpayees > 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Graphiques - Design amélioré */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Évolution Revenus/Dépenses */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 sm:p-6 hover:shadow-lg transition-shadow duration-300">
          <div className="mb-4 sm:mb-6">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">Évolution financière</h3>
            <p className="text-sm text-gray-500">Tendances sur 6 mois</p>
          </div>
          <div className="w-full" style={{ minHeight: '280px', height: '100%' }}>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={monthlyData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="mois" 
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '8px 12px',
                  }}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="line"
                />
                <Line 
                  type="monotone" 
                  dataKey="recettes" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  dot={{ fill: '#10b981', r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Recettes"
                />
                <Line 
                  type="monotone" 
                  dataKey="depenses" 
                  stroke="#ef4444" 
                  strokeWidth={3}
                  dot={{ fill: '#ef4444', r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Dépenses"
                />
                <Line 
                  type="monotone" 
                  dataKey="profit" 
                  stroke="#0ea5e9" 
                  strokeWidth={3}
                  dot={{ fill: '#0ea5e9', r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Bénéfice"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Dépenses par type */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 sm:p-6 hover:shadow-lg transition-shadow duration-300">
          <div className="mb-4 sm:mb-6">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">Répartition des dépenses</h3>
            <p className="text-sm text-gray-500">Répartition par catégorie</p>
          </div>
          <div className="w-full" style={{ minHeight: '280px', height: '100%' }}>
            {depensesByType.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={depensesByType}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => {
                      if (percent < 0.05) return ''; // Masquer les labels trop petits
                      return `${name} ${(percent * 100).toFixed(0)}%`;
                    }}
                    outerRadius={90}
                    innerRadius={40}
                    fill="#8884d8"
                    dataKey="value"
                    paddingAngle={2}
                  >
                    {depensesByType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '8px 12px',
                    }}
                  />
                  <Legend 
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <p className="text-sm">Aucune donnée disponible</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tableaux de performance - Design amélioré */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Top 5 Camions */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 sm:p-6 hover:shadow-lg transition-shadow duration-300">
          <div className="mb-4 sm:mb-6 flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Truck className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">Top 5 Camions</h3>
              <p className="text-sm text-gray-500">Par rentabilité</p>
            </div>
          </div>
          <div className="overflow-x-auto table-zoom-safe -mx-4 sm:-mx-6 px-4 sm:px-6">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    <span className="hidden sm:inline">Camion</span>
                    <span className="sm:hidden">Cam.</span>
                  </th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Bénéfice
                  </th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Missions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topCamions.length > 0 ? (
                  topCamions.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 sm:px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-xs font-semibold">
                            {index + 1}
                          </span>
                          <span className="text-sm font-medium text-gray-900">{item.camion}</span>
                        </div>
                      </td>
                      <td className={`px-3 sm:px-4 py-3 whitespace-nowrap text-sm font-semibold ${item.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(item.profit)}
                      </td>
                      <td className="px-3 sm:px-4 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {item.nbMissions}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-sm text-gray-500">
                      Aucune donnée disponible
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top 5 Chauffeurs */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 sm:p-6 hover:shadow-lg transition-shadow duration-300">
          <div className="mb-4 sm:mb-6 flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Users className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">Top 5 Chauffeurs</h3>
              <p className="text-sm text-gray-500">Par performance</p>
            </div>
          </div>
          <div className="overflow-x-auto table-zoom-safe -mx-4 sm:-mx-6 px-4 sm:px-6">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Chauffeur
                  </th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Bénéfice
                  </th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Missions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topChauffeurs.length > 0 ? (
                  topChauffeurs.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 sm:px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-xs font-semibold">
                            {index + 1}
                          </span>
                          <span className="text-sm font-medium text-gray-900 truncate max-w-[120px] sm:max-w-none">
                            {item.nom}
                          </span>
                        </div>
                      </td>
                      <td className={`px-3 sm:px-4 py-3 whitespace-nowrap text-sm font-semibold ${item.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(item.profit)}
                      </td>
                      <td className="px-3 sm:px-4 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {item.nbMissions}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-sm text-gray-500">
                      Aucune donnée disponible
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Métriques additionnelles - Design amélioré */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 sm:p-6 hover:shadow-lg transition-shadow duration-300">
        <div className="mb-4 sm:mb-6">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">Indicateurs de performance</h3>
          <p className="text-sm text-gray-500">Métriques opérationnelles clés</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <div className="group text-center p-5 sm:p-6 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all duration-300">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 rounded-full mb-3 group-hover:bg-primary-200 transition-colors">
              <Truck className="w-6 h-6 text-primary-600" />
            </div>
            <p className="text-sm font-medium text-gray-600 mb-2">Missions réalisées</p>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">{kpis.nbMissions}</p>
            <p className="text-xs text-gray-500 mt-1">Ce mois</p>
          </div>
          <div className="group text-center p-5 sm:p-6 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all duration-300">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-3 group-hover:bg-blue-200 transition-colors">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-sm font-medium text-gray-600 mb-2">Coût moyen par mission</p>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">{formatCurrency(kpis.coutParMission)}</p>
            <p className="text-xs text-gray-500 mt-1">Moyenne</p>
          </div>
          <div className="group text-center p-5 sm:p-6 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all duration-300">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3 group-hover:bg-green-200 transition-colors">
              <BarChart3 className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-sm font-medium text-gray-600 mb-2">Taux d'utilisation</p>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">{kpis.tauxUtilisation.toFixed(1)}%</p>
            <p className="text-xs text-gray-500 mt-1">Flotte active</p>
          </div>
        </div>
      </div>
    </div>
  );
}
