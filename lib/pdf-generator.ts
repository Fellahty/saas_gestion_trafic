import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Facture, Client } from './types';
import { formatCurrency } from './utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export async function generateFacturePDF(facture: Facture, client: Client): Promise<void> {
  const doc = new jsPDF();
  
  // Colors
  const primaryColor = [14, 165, 233]; // Primary blue
  const darkColor = [31, 41, 55]; // Dark gray
  const lightGray = [243, 244, 246];

  // Header
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 50, 'F');
  
  // Logo/Company name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('FleetManager', 20, 25);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Gestion de flotte professionnelle', 20, 32);
  doc.text('Facture N° ' + facture.numero, 150, 25, { align: 'right' });
  
  // Facture info
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.text(`Date d'émission: ${format(facture.dateEmission, 'dd/MM/yyyy', { locale: fr })}`, 150, 32, { align: 'right' });
  if (facture.dateEcheance) {
    doc.text(`Date d'échéance: ${format(facture.dateEcheance, 'dd/MM/yyyy', { locale: fr })}`, 150, 38, { align: 'right' });
  }
  
  // Client info
  doc.setTextColor(...darkColor);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Facturé à:', 20, 65);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(client.nom, 20, 72);
  if (client.adresse) {
    doc.text(client.adresse, 20, 78);
    let yPos = 84;
    if (client.codePostal && client.ville) {
      doc.text(`${client.codePostal} ${client.ville}`, 20, yPos);
      yPos += 6;
    }
    if (client.pays) {
      doc.text(client.pays, 20, yPos);
      yPos += 6;
    }
    if (client.email) {
      doc.text(`Email: ${client.email}`, 20, yPos);
      yPos += 6;
    }
    if (client.telephone) {
      doc.text(`Tél: ${client.telephone}`, 20, yPos);
    }
  }

  // Table
  autoTable(doc, {
    startY: 110,
    head: [['Description', 'Quantité', 'Prix unitaire', 'TVA', 'Total HT']],
    body: facture.lignes.map(ligne => [
      ligne.description,
      ligne.quantite.toString(),
      formatCurrency(ligne.prixUnitaire),
      ligne.tva ? `${ligne.tva}%` : '0%',
      formatCurrency(ligne.total)
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
    styles: {
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 35, halign: 'right' },
      3: { cellWidth: 25, halign: 'center' },
      4: { cellWidth: 35, halign: 'right' },
    },
    margin: { left: 20, right: 20 },
  });

  const finalY = (doc as any).lastAutoTable.finalY || 150;

  // Totals
  const totalsY = finalY + 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Total HT:', 150, totalsY, { align: 'right' });
  doc.text(formatCurrency(facture.totalHT), 190, totalsY, { align: 'right' });
  
  doc.text('Total TVA:', 150, totalsY + 7, { align: 'right' });
  doc.text(formatCurrency(facture.totalTVA), 190, totalsY + 7, { align: 'right' });
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setFillColor(...primaryColor);
  doc.rect(140, totalsY + 12, 60, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.text('Total TTC:', 150, totalsY + 19, { align: 'right' });
  doc.text(formatCurrency(facture.totalTTC), 190, totalsY + 19, { align: 'right' });

  // Payment info
  if (facture.montantPaye > 0) {
    doc.setTextColor(...darkColor);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Montant payé: ${formatCurrency(facture.montantPaye)}`, 20, totalsY + 25);
    if (facture.montantRestant > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(239, 68, 68); // Red
      doc.text(`Reste à payer: ${formatCurrency(facture.montantRestant)}`, 20, totalsY + 32);
    }
  }

  // Conditions
  if (facture.conditionsPaiement || facture.notes) {
    doc.setTextColor(...darkColor);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    let noteY = totalsY + 40;
    if (facture.conditionsPaiement) {
      doc.text(`Conditions de paiement: ${facture.conditionsPaiement}`, 20, noteY);
      noteY += 7;
    }
    if (facture.notes) {
      doc.text(`Notes: ${facture.notes}`, 20, noteY);
    }
  }

  // Footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.5);
  doc.line(20, pageHeight - 30, 190, pageHeight - 30);
  
  doc.setTextColor(128, 128, 128);
  doc.setFontSize(8);
  doc.text('FleetManager - Gestion de flotte professionnelle', 105, pageHeight - 20, { align: 'center' });
  doc.text('Merci de votre confiance!', 105, pageHeight - 15, { align: 'center' });

  // Save PDF
  doc.save(`Facture-${facture.numero}.pdf`);
}
