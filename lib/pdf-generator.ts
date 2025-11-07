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
  black: [0, 0, 0] as [number, number, number],
  dark: [31, 41, 55] as [number, number, number], // Gray-800
  gray: [107, 114, 128] as [number, number, number], // Gray-500
  lightGray: [243, 244, 246] as [number, number, number], // Gray-100
  border: [229, 231, 235] as [number, number, number], // Gray-200
  accent: [37, 99, 235] as [number, number, number], // Blue-600 - used sparingly
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
  const logoSize = 40;
  const logoX = margin;
  const logoY = 15;

  // ========== PROFESSIONAL HEADER SECTION ==========
  // Clean white background
  doc.setFillColor(...colors.white);
  doc.rect(0, 0, pageWidth, 65, 'F');

  // Subtle top border line
  doc.setDrawColor(...colors.border);
  doc.setLineWidth(0.5);
  doc.line(margin, 0, pageWidth - margin, 0);

  // Logo
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'PNG', logoX, logoY, logoSize, logoSize * 0.5);
    } catch (e) {
      console.warn('Could not load logo:', e);
    }
  }

  // Company info next to logo
  const companyInfoX = logoBase64 ? logoX + logoSize + 12 : margin;
  doc.setTextColor(...colors.black);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(companySettings.nom, companyInfoX, logoY + 8);
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...colors.gray);
  doc.text(companySettings.description, companyInfoX, logoY + 15);
  const companyContact = companySettings.pays + (companySettings.email ? ` • ${companySettings.email}` : '');
  doc.text(companyContact, companyInfoX, logoY + 21);

  // Invoice number and dates - right side
  const rightInfoX = pageWidth - margin;
  
  // Invoice number - clean and minimal
  doc.setTextColor(...colors.black);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('FACTURE', rightInfoX, logoY + 5, { align: 'right' });
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`N° ${facture.numero}`, rightInfoX, logoY + 12, { align: 'right' });

  // Invoice dates - below invoice number
  doc.setTextColor(...colors.gray);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  let dateY = logoY + 22;
  doc.text(`Date d'émission: ${format(facture.dateEmission, 'dd MMMM yyyy', { locale: fr })}`, rightInfoX, dateY, { align: 'right' });
  if (facture.dateEcheance) {
    dateY += 5;
    doc.text(`Date d'échéance: ${format(facture.dateEcheance, 'dd MMMM yyyy', { locale: fr })}`, rightInfoX, dateY, { align: 'right' });
  }

  // ========== COMPANY & CLIENT INFO SECTION ==========
  let startY = 75;

  // Clean divider line
  doc.setDrawColor(...colors.border);
  doc.setLineWidth(0.3);
  doc.line(margin, startY - 8, pageWidth - margin, startY - 8);

  // Company info section - left side
  const companyInfoWidth = (pageWidth / 2) - margin - 10;
  doc.setTextColor(...colors.black);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('ÉMETTEUR', margin, startY);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...colors.dark);
  let companyY = startY + 7;
  
  // Company name - wrap if too long
  const companyNameLines = doc.splitTextToSize(companySettings.nom, companyInfoWidth);
  doc.text(companyNameLines, margin, companyY);
  companyY += 5 * companyNameLines.length;
  
  // Description - wrap if too long
  const descLines = doc.splitTextToSize(companySettings.description, companyInfoWidth);
  doc.text(descLines, margin, companyY);
  companyY += 5 * descLines.length;
  
  if (companySettings.adresse) {
    const addrLines = doc.splitTextToSize(companySettings.adresse, companyInfoWidth);
    doc.text(addrLines, margin, companyY);
    companyY += 5 * addrLines.length;
  }
  
  let locationParts: string[] = [];
  if (companySettings.codePostal && companySettings.ville) {
    locationParts.push(`${companySettings.codePostal} ${companySettings.ville}`);
  } else if (companySettings.ville) {
    locationParts.push(companySettings.ville);
  }
  if (companySettings.pays) {
    locationParts.push(companySettings.pays);
  }
  if (locationParts.length > 0) {
    const locationText = locationParts.join(', ');
    const locationLines = doc.splitTextToSize(locationText, companyInfoWidth);
    doc.text(locationLines, margin, companyY);
    companyY += 5 * locationLines.length;
  }
  
  doc.setTextColor(...colors.gray);
  if (companySettings.email) {
    const emailLines = doc.splitTextToSize(companySettings.email, companyInfoWidth);
    doc.text(emailLines, margin, companyY);
    companyY += 5 * emailLines.length;
  }
  if (companySettings.telephone) {
    doc.text(`Tél: ${companySettings.telephone}`, margin, companyY);
  }

  // Client info section - right side
  const clientInfoX = pageWidth / 2 + 15;
  const clientInfoWidth = pageWidth - margin - clientInfoX;
  doc.setTextColor(...colors.black);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('FACTURÉ À', clientInfoX, startY);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...colors.dark);
  let clientY = startY + 7;
  
  // Client name - wrap if too long
  const clientNameLines = doc.splitTextToSize(client.nom, clientInfoWidth);
  doc.text(clientNameLines, clientInfoX, clientY);
  clientY += 5 * clientNameLines.length;
  
  if (client.adresse) {
    const addrLines = doc.splitTextToSize(client.adresse, clientInfoWidth);
    doc.text(addrLines, clientInfoX, clientY);
    clientY += 5 * addrLines.length;
  }
  
  if (client.codePostal && client.ville) {
    const locationText = `${client.codePostal} ${client.ville}`;
    const locationLines = doc.splitTextToSize(locationText, clientInfoWidth);
    doc.text(locationLines, clientInfoX, clientY);
    clientY += 5 * locationLines.length;
  }
  
  if (client.pays) {
    const paysLines = doc.splitTextToSize(client.pays, clientInfoWidth);
    doc.text(paysLines, clientInfoX, clientY);
    clientY += 5 * paysLines.length;
  }
  
  if (client.email) {
    doc.setTextColor(...colors.gray);
    const emailLines = doc.splitTextToSize(client.email, clientInfoWidth);
    doc.text(emailLines, clientInfoX, clientY);
    clientY += 5 * emailLines.length;
  }
  
  if (client.telephone) {
    doc.text(`Tél: ${client.telephone}`, clientInfoX, clientY);
  }

  // ========== ITEMS TABLE ==========
  const tableStartY = startY + 40;
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
      fontSize: 9,
      cellPadding: 4,
      halign: 'left',
    },
    bodyStyles: {
      textColor: colors.black,
      fontSize: 8,
      cellPadding: 4,
      overflow: 'linebreak',
      cellWidth: 'wrap',
    },
    alternateRowStyles: {
      fillColor: colors.white,
    },
    styles: {
      cellPadding: 4,
      lineColor: colors.border,
      lineWidth: 0.2,
      overflow: 'linebreak',
      cellWidth: 'wrap',
    },
    columnStyles: {
      0: { cellWidth: descriptionWidth, halign: 'left', overflow: 'linebreak' },
      1: { cellWidth: 18, halign: 'center' },
      2: { cellWidth: 32, halign: 'right' },
      3: { cellWidth: 22, halign: 'center' },
      4: { cellWidth: 22, halign: 'center' },
      5: { cellWidth: 32, halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: margin, right: margin },
  });

  const finalY = (doc as any).lastAutoTable.finalY || tableStartY + 50;

  // ========== TOTALS SECTION ==========
  const totalsStartY = finalY + 15;
  const totalsBoxWidth = 85;
  const totalsBoxX = pageWidth - margin - totalsBoxWidth;

  // Clean minimal totals box
  doc.setFillColor(...colors.white);
  doc.rect(totalsBoxX, totalsStartY, totalsBoxWidth, 50, 'F');

  // Subtle border
  doc.setDrawColor(...colors.border);
  doc.setLineWidth(0.3);
  doc.rect(totalsBoxX, totalsStartY, totalsBoxWidth, 50, 'D');

  let totalsY = totalsStartY + 10;
  
  // Total HT
  doc.setTextColor(...colors.black);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Total HT', totalsBoxX + 6, totalsY);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(facture.totalHT), totalsBoxX + totalsBoxWidth - 6, totalsY, { align: 'right' });
  totalsY += 8;

  // Total TVA
  doc.setFont('helvetica', 'normal');
  doc.text('Total TVA', totalsBoxX + 6, totalsY);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(facture.totalTVA), totalsBoxX + totalsBoxWidth - 6, totalsY, { align: 'right' });
  totalsY += 10;

  // Divider line
  doc.setDrawColor(...colors.border);
  doc.setLineWidth(0.3);
  doc.line(totalsBoxX + 6, totalsY, totalsBoxX + totalsBoxWidth - 6, totalsY);
  totalsY += 8;

  // Total TTC - clean and prominent
  doc.setTextColor(...colors.black);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL TTC', totalsBoxX + 6, totalsY);
  doc.setFontSize(11);
  doc.text(formatCurrency(facture.totalTTC), totalsBoxX + totalsBoxWidth - 6, totalsY, { align: 'right' });

  // ========== PAYMENT STATUS ==========
  if (facture.montantPaye > 0 || facture.montantRestant > 0) {
    totalsY = totalsStartY + 55;
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
  let notesY = totalsStartY + 65;
  
  if (facture.conditionsPaiement || facture.notes) {
    // Clean minimal background
    doc.setFillColor(...colors.lightGray);
    doc.rect(margin, notesY, contentWidth, 30, 'F');
    
    // Subtle border
    doc.setDrawColor(...colors.border);
    doc.setLineWidth(0.3);
    doc.rect(margin, notesY, contentWidth, 30, 'D');
    
    doc.setTextColor(...colors.black);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    
    let noteContentY = notesY + 7;
    
    if (facture.conditionsPaiement) {
      doc.text('Conditions de paiement:', margin + 6, noteContentY);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...colors.dark);
      const conditionsLines = doc.splitTextToSize(facture.conditionsPaiement, contentWidth - 12);
      doc.text(conditionsLines, margin + 6, noteContentY + 5);
      noteContentY += 5 + (5 * conditionsLines.length);
    }
    
    if (facture.notes) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colors.black);
      doc.text('Notes:', margin + 6, noteContentY);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...colors.dark);
      const splitNotes = doc.splitTextToSize(facture.notes, contentWidth - 12);
      doc.text(splitNotes, margin + 6, noteContentY + 5);
    }
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
