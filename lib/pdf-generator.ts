import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Facture, Client } from './types';
import { formatCurrency } from './utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { db } from '@/firebase.config';
import { doc, getDoc } from 'firebase/firestore';

interface CompanySettings {
  nom: string;
  description: string;
  pays: string;
  email: string;
  telephone?: string;
  adresse?: string;
  ville?: string;
  codePostal?: string;
}

// Professional minimal color palette
const colors = {
  black: [15, 23, 42] as [number, number, number], // Slate-900
  dark: [30, 41, 59] as [number, number, number], // Slate-800
  gray: [100, 116, 139] as [number, number, number], // Slate-500
  lightGray: [241, 245, 249] as [number, number, number], // Slate-100
  border: [226, 232, 240] as [number, number, number], // Slate-200
  accent: [37, 99, 235] as [number, number, number], // Blue-600
  accentDark: [30, 64, 175] as [number, number, number], // Blue-700
  accentLight: [59, 130, 246] as [number, number, number], // Blue-500
  honey: [250, 204, 21] as [number, number, number], // Amber-400
  emerald: [16, 185, 129] as [number, number, number], // Emerald-500
  rose: [244, 63, 94] as [number, number, number], // Rose-500
  white: [255, 255, 255] as [number, number, number],
};

async function loadLogoAsBase64(): Promise<string | null> {
  try {
    const response = await fetch('/images/logo_w.png');
    if (!response.ok) {
      // Try alternative logo
      const altResponse = await fetch('/images/logo.png');
      if (!altResponse.ok) return null;
      const blob = await altResponse.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    }
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

async function loadCompanySettings(): Promise<CompanySettings> {
  try {
    const settingsDoc = await getDoc(doc(db, 'settings', 'company'));
    if (settingsDoc.exists()) {
      const data = settingsDoc.data();
      return {
        nom: data.nom || 'FleetManager',
        description: data.description || 'Gestion de flotte professionnelle',
        pays: data.pays || 'Maroc',
        email: data.email || 'contact@fleetmanager.ma',
        telephone: data.telephone || '',
        adresse: data.adresse || '',
        ville: data.ville || '',
        codePostal: data.codePostal || '',
      };
    }
  } catch (error) {
    console.warn('Error loading company settings:', error);
  }
  
  // Return default values if settings don't exist
  return {
    nom: 'FleetManager',
    description: 'Gestion de flotte professionnelle',
    pays: 'Maroc',
    email: 'contact@fleetmanager.ma',
  };
}

async function generateFacturePDFContent(facture: Facture, client: Client, preview: boolean = false): Promise<jsPDF> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);

  // Load company settings and logo
  const companySettings = await loadCompanySettings();
  const logoBase64 = await loadLogoAsBase64();
  const logoSize = 32;
  const headerHeight = 78;

  // ========== HERO HEADER BAND ==========
  doc.setFillColor(...colors.accentDark);
  doc.rect(0, 0, pageWidth, headerHeight, 'F');

  doc.setFillColor(...colors.accent);
  doc.setDrawColor(...colors.accent);
  doc.triangle(
    pageWidth * 0.55,
    -20,
    pageWidth + 10,
    -20,
    pageWidth + 10,
    headerHeight + 10,
    'F'
  );

  doc.setFillColor(...colors.accentLight);
  doc.triangle(
    pageWidth * 0.7,
    -10,
    pageWidth + 20,
    -10,
    pageWidth * 0.85,
    headerHeight - 15,
    'F'
  );

  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'PNG', margin, 18, logoSize, logoSize * 0.55);
    } catch (e) {
      console.warn('Could not load logo:', e);
    }
  }

  // Header text
  doc.setTextColor(...colors.white);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(companySettings.description, pageWidth / 2, headerHeight - 32, { align: 'center' });

  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(companySettings.nom, pageWidth / 2, headerHeight - 15, { align: 'center' });

  // Invoice summary card (top-right)
  const summaryCardWidth = 120;
  const summaryCardX = pageWidth - margin - summaryCardWidth;
  const summaryCardY = 18;
  doc.setDrawColor(0, 0, 0, 0);
  doc.setFillColor(...colors.white);
  doc.roundedRect(summaryCardX, summaryCardY, summaryCardWidth, 58, 6, 6, 'F');

  doc.setDrawColor(...colors.border);
  doc.roundedRect(summaryCardX, summaryCardY, summaryCardWidth, 58, 6, 6, 'S');

  doc.setTextColor(...colors.gray);
  doc.setFont('helvetica', 'medium');
  doc.setFontSize(8);
  doc.text('FACTURE', summaryCardX + summaryCardWidth / 2, summaryCardY + 12, { align: 'center' });

  doc.setTextColor(...colors.black);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(`#${facture.numero}`, summaryCardX + summaryCardWidth / 2, summaryCardY + 20, { align: 'center' });

  const summaryRows = [
    { label: `Émission`, value: format(facture.dateEmission, 'dd MMM yyyy', { locale: fr }) },
    { label: `Échéance`, value: facture.dateEcheance ? format(facture.dateEcheance, 'dd MMM yyyy', { locale: fr }) : '—' },
  ];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  let summaryRowY = summaryCardY + 32;
  summaryRows.forEach(row => {
    doc.setTextColor(...colors.gray);
    doc.text(row.label, summaryCardX + summaryCardWidth / 2, summaryRowY, { align: 'center' });
    doc.setTextColor(...colors.black);
    doc.text(row.value, summaryCardX + summaryCardWidth / 2, summaryRowY + 6, { align: 'center' });
    summaryRowY += 12;
  });

  const statusText = facture.statut === 'payee'
    ? 'Payée'
    : facture.statut === 'en_retard'
      ? 'En retard'
      : facture.statut === 'partiellement_payee'
        ? 'Partiellement payée'
        : facture.statut === 'annulee'
          ? 'Annulée'
          : facture.statut === 'envoyee'
            ? 'Envoyée'
            : 'Brouillon';

  const statusColor = facture.statut === 'payee'
    ? colors.emerald
    : facture.statut === 'en_retard'
      ? colors.rose
      : colors.accentLight;

  doc.setFillColor(...statusColor);
  doc.setTextColor(...colors.white);
  doc.roundedRect(summaryCardX + 12, summaryCardY + 46, summaryCardWidth - 24, 14, 6, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(statusText.toUpperCase(), summaryCardX + summaryCardWidth / 2, summaryCardY + 55, { align: 'center' });

  // Move past header
  let startY = headerHeight + 12;

  // ========== INFO CARDS ==========
  const infoCardHeight = 54;
  doc.setFillColor(...colors.white);
  doc.setDrawColor(...colors.border);
  doc.roundedRect(margin, startY, contentWidth, infoCardHeight, 8, 8, 'FD');

  const dividerX = margin + contentWidth / 2;
  doc.setDrawColor(...colors.border);
  doc.line(dividerX, startY + 10, dividerX, startY + infoCardHeight - 10);

  const columnPadding = 14;
  const companyInfoX = margin + columnPadding;
  const clientInfoX = dividerX + columnPadding;
  const infoWidth = (contentWidth / 2) - (columnPadding * 2);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.accentDark);
  doc.text('ÉMETTEUR', companyInfoX, startY + 12);
  doc.text('FACTURÉ À', clientInfoX, startY + 12);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...colors.dark);
  doc.setFontSize(8);

  let companyY = startY + 20;
  const drawMultiline = (text: string, x: number, y: number, width: number) => {
    const lines = doc.splitTextToSize(text, width);
    doc.text(lines, x, y);
    return y + (lines.length * 4.4);
  };

  companyY = drawMultiline(companySettings.nom, companyInfoX, companyY, infoWidth);
  if (companySettings.description) {
    doc.setTextColor(...colors.gray);
    companyY = drawMultiline(companySettings.description, companyInfoX, companyY, infoWidth);
    doc.setTextColor(...colors.dark);
  }
  if (companySettings.adresse) {
    companyY = drawMultiline(companySettings.adresse, companyInfoX, companyY, infoWidth);
  }
  const companyLocation = [companySettings.codePostal, companySettings.ville].filter(Boolean).join(' ');
  if (companyLocation) {
    doc.setTextColor(...colors.gray);
    companyY = drawMultiline(companyLocation, companyInfoX, companyY, infoWidth);
    doc.setTextColor(...colors.dark);
  }
  if (companySettings.pays) {
    companyY = drawMultiline(companySettings.pays, companyInfoX, companyY, infoWidth);
  }
  if (companySettings.email) {
    doc.setTextColor(...colors.gray);
    companyY = drawMultiline(companySettings.email, companyInfoX, companyY, infoWidth);
  }
  if (companySettings.telephone) {
    doc.text(`Tél: ${companySettings.telephone}`, companyInfoX, companyY + 4);
  }

  let clientY = startY + 20;
  doc.setTextColor(...colors.dark);
  clientY = drawMultiline(client.nom, clientInfoX, clientY, infoWidth);
  if (client.adresse) {
    clientY = drawMultiline(client.adresse, clientInfoX, clientY, infoWidth);
  }
  const clientLocation = [client.codePostal, client.ville].filter(Boolean).join(' ');
  if (clientLocation) {
    doc.setTextColor(...colors.gray);
    clientY = drawMultiline(clientLocation, clientInfoX, clientY, infoWidth);
    doc.setTextColor(...colors.dark);
  }
  if (client.pays) {
    clientY = drawMultiline(client.pays, clientInfoX, clientY, infoWidth);
  }
  if (client.email) {
    doc.setTextColor(...colors.gray);
    clientY = drawMultiline(client.email, clientInfoX, clientY, infoWidth);
  }
  if (client.telephone) {
    doc.text(`Tél: ${client.telephone}`, clientInfoX, clientY + 4);
  }

  startY += infoCardHeight + 16;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.black);
  doc.text('Détails de la facture', margin, startY);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'medium');
  doc.setTextColor(...colors.gray);
  doc.text('Prestations et montants', margin, startY + 6);

  // ========== ITEMS TABLE ==========
  const tableStartY = startY + 12;
  const tableWidth = contentWidth;
  const descriptionWidth = tableWidth - 18 - 32 - 22 - 22 - 32 - 20; // Total width minus other columns minus padding

  autoTable(doc, {
    startY: tableStartY,
    head: [['Description', 'Qté', 'Prix unitaire', 'TVA', 'Remise', 'Total HT']],
    body: facture.lignes.map(ligne => {
      const totalLigne = ligne.quantite * ligne.prixUnitaire;
      const remiseAmount = totalLigne * (ligne.remise || 0) / 100;
      const totalHTLigne = totalLigne - remiseAmount;
      
      // Truncate description if too long
      let description = ligne.description || '-';
      if (description.length > 50) {
        description = description.substring(0, 47) + '...';
      }
      
      return [
        description,
        ligne.quantite.toString(),
        formatCurrency(ligne.prixUnitaire),
        ligne.tva ? `${ligne.tva}%` : '0%',
        ligne.remise ? `${ligne.remise}%` : '0%',
        formatCurrency(totalHTLigne)
      ];
    }),
    theme: 'plain',
    headStyles: {
      fillColor: colors.dark,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      cellPadding: 3,
      halign: 'center',
      valign: 'middle',
    },
    bodyStyles: {
      textColor: colors.black,
      fontSize: 7.5,
      cellPadding: 3,
      overflow: 'linebreak',
      cellWidth: 'wrap',
      halign: 'center',
      valign: 'middle',
    },
    alternateRowStyles: {
      fillColor: colors.white,
    },
    styles: {
      cellPadding: 3,
      lineColor: colors.border,
      lineWidth: 0.2,
      overflow: 'linebreak',
      cellWidth: 'wrap',
      halign: 'center',
      valign: 'middle',
    },
    columnStyles: {
      0: { cellWidth: descriptionWidth, halign: 'left', overflow: 'linebreak', valign: 'middle' },
      1: { cellWidth: 18, halign: 'center', valign: 'middle' },
      2: { cellWidth: 32, halign: 'right', valign: 'middle' },
      3: { cellWidth: 22, halign: 'center', valign: 'middle' },
      4: { cellWidth: 22, halign: 'center', valign: 'middle' },
      5: { cellWidth: 32, halign: 'right', fontStyle: 'bold', valign: 'middle' },
    },
    margin: { left: margin, right: margin },
  });

  const finalY = (doc as any).lastAutoTable.finalY || tableStartY + 50;

  // ========== TOTALS SECTION ==========
  const totalsStartY = finalY + 15;
  const totalsBoxWidth = 82;
  const totalsBoxX = pageWidth - margin - totalsBoxWidth;

  // Clean minimal totals box
  doc.setFillColor(...colors.white);
  doc.rect(totalsBoxX, totalsStartY, totalsBoxWidth, 46, 'F');

  // Subtle border
  doc.setDrawColor(...colors.border);
  doc.setLineWidth(0.3);
  doc.rect(totalsBoxX, totalsStartY, totalsBoxWidth, 46, 'D');

  let totalsY = totalsStartY + 9;
  
  // Total HT
  doc.setTextColor(...colors.black);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Total HT', totalsBoxX + 6, totalsY);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(facture.totalHT), totalsBoxX + totalsBoxWidth - 6, totalsY, { align: 'right' });
  totalsY += 7;

  // Total TVA
  doc.setFont('helvetica', 'normal');
  doc.text('Total TVA', totalsBoxX + 6, totalsY);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(facture.totalTVA), totalsBoxX + totalsBoxWidth - 6, totalsY, { align: 'right' });
  totalsY += 8;

  // Divider line
  doc.setDrawColor(...colors.border);
  doc.setLineWidth(0.3);
  doc.line(totalsBoxX + 6, totalsY, totalsBoxX + totalsBoxWidth - 6, totalsY);
  totalsY += 7;

  // Total TTC - clean and prominent
  doc.setTextColor(...colors.black);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL TTC', totalsBoxX + 6, totalsY);
  doc.setFontSize(11);
  doc.text(formatCurrency(facture.totalTTC), totalsBoxX + totalsBoxWidth - 6, totalsY, { align: 'right' });

  // ========== PAYMENT STATUS ==========
  if (facture.montantPaye > 0 || facture.montantRestant > 0) {
    totalsY = totalsStartY + 52;
    doc.setTextColor(...colors.black);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    
    if (facture.montantPaye > 0) {
      doc.text(`Payé: ${formatCurrency(facture.montantPaye)}`, margin, totalsY);
      totalsY += 7;
    }
    
    if (facture.montantRestant > 0) {
      doc.setFont('helvetica', 'bold');
      doc.text(`Reste à payer: ${formatCurrency(facture.montantRestant)}`, margin, totalsY);
    }
  }

  // ========== NOTES & CONDITIONS ==========
  let notesY = totalsStartY + 57;
  
  if (facture.conditionsPaiement || facture.notes) {
    const notePadding = 6;
    let estimatedHeight = notePadding * 2;
    const noteSections: { title: string; lines: string[] }[] = [];

    if (facture.conditionsPaiement) {
      noteSections.push({
        title: 'Conditions de paiement',
        lines: doc.splitTextToSize(facture.conditionsPaiement, contentWidth - notePadding * 2),
      });
    }

    if (facture.notes) {
      noteSections.push({
        title: 'Notes',
        lines: doc.splitTextToSize(facture.notes, contentWidth - notePadding * 2),
      });
    }

    noteSections.forEach((section, index) => {
      estimatedHeight += 4; // title spacing
      estimatedHeight += section.lines.length * 4.2;
      if (index < noteSections.length - 1) {
        estimatedHeight += 3;
      }
    });

    doc.setFillColor(...colors.lightGray);
    doc.rect(margin, notesY, contentWidth, estimatedHeight, 'F');

    doc.setDrawColor(...colors.border);
    doc.setLineWidth(0.3);
    doc.rect(margin, notesY, contentWidth, estimatedHeight, 'D');

    let noteContentY = notesY + notePadding;
    noteSections.forEach((section, index) => {
      doc.setTextColor(...colors.black);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text(section.title + ':', margin + notePadding, noteContentY);
      noteContentY += 4;

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...colors.dark);
      doc.setFontSize(7.5);
      doc.text(section.lines, margin + notePadding, noteContentY);
      noteContentY += section.lines.length * 4.2;

      if (index < noteSections.length - 1) {
        noteContentY += 3;
      }
    });
  }

  // ========== PROFESSIONAL FOOTER ==========
  const footerY = pageHeight - 25;
  
  // Clean footer line
  doc.setDrawColor(...colors.border);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY, pageWidth - margin, footerY);
  
  doc.setTextColor(...colors.gray);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  const footerText = `${companySettings.nom}${companySettings.description ? ` - ${companySettings.description}` : ''}`;
  // Split footer text if too long
  const footerLines = doc.splitTextToSize(footerText, contentWidth);
  let footerTextY = footerY + 7;
  footerLines.forEach((line: string, index: number) => {
    doc.text(line, pageWidth / 2, footerTextY + (index * 5), { align: 'center' });
  });
  doc.setFontSize(6);
  doc.setTextColor(...colors.gray);
  doc.text('Merci de votre confiance', pageWidth / 2, footerTextY + (footerLines.length * 5) + 6, { align: 'center' });

  return doc;
}

export async function generateFacturePDF(facture: Facture, client: Client): Promise<void> {
  const doc = await generateFacturePDFContent(facture, client, false);
  doc.save(`Facture-${facture.numero}.pdf`);
}

export async function previewFacturePDF(facture: Facture, client: Client): Promise<void> {
  const doc = await generateFacturePDFContent(facture, client, true);
  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, '_blank');
  // Clean up the URL after a delay
  setTimeout(() => URL.revokeObjectURL(pdfUrl), 100);
}
