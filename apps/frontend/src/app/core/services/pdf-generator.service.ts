import { Injectable, inject } from '@angular/core';
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { AmountToWordsService } from './amount-to-words.service';
import type { InvoiceResponse, InvoiceItemResponse, Currency } from '../../../types';

// pdfMake initialization happens per-call to avoid immutable import issues in ESM/Vite

/**
 * PdfGeneratorService - Generates PDF documents for invoices using pdfmake.
 */
@Injectable({ providedIn: 'root' })
export class PdfGeneratorService {
  private readonly amountToWordsService = inject(AmountToWordsService);

  /**
   * Generates and opens a PDF for the given invoice.
   */
  async generateInvoicePdf(invoice: InvoiceResponse): Promise<void> {
    const documentDefinition = await this.createDocumentDefinition(invoice);

    const vfs = pdfFonts.pdfMake ? pdfFonts.pdfMake.vfs : pdfFonts.vfs || pdfFonts;
    const fonts = {
      Roboto: {
        normal: 'Roboto-Regular.ttf',
        bold: 'Roboto-Medium.ttf',
        italic: 'Roboto-Italic.ttf',
        bolditalic: 'Roboto-MediumItalic.ttf',
      },
    };

    pdfMake.createPdf(documentDefinition, undefined, fonts, vfs).open();
  }

  /**
   * Creates the document definition for pdfmake.
   */
  private async createDocumentDefinition(invoice: InvoiceResponse): Promise<any> {
    const amount = parseFloat(invoice.totalGross) || 0;
    const amountWords = this.amountToWordsService.convert(amount, invoice.currency);

    // Pre-load logo to base64 if available
    let logoBase64 = null;
    if (invoice.seller.logoUrl) {
      try {
        logoBase64 = await this.getBase64ImageFromURL(invoice.seller.logoUrl);
      } catch (e) {
        // Fallback if logo fails to load (e.g. CORS)
      }
    }

    return {
      pageSize: 'A4',
      pageMargins: [40, 40, 40, 40],
      content: [
        // Header: Seller Info & Logo
        {
          columns: [
            {
              width: '*',
              stack: [
                { text: 'Sprzedawca', style: 'sectionLabel' },
                { text: invoice.seller.companyName, style: 'companyName' },
                { text: invoice.seller.address, style: 'address' },
                { text: `NIP: ${invoice.seller.nip}`, style: 'nip' },
              ],
            },
            logoBase64
              ? {
                  width: 150,
                  image: logoBase64,
                  fit: [100, 80],
                  alignment: 'right',
                }
              : { width: 150, text: '' },
          ],
          margin: [0, 0, 0, 30],
        },

        // Title & Number
        {
          stack: [
            { text: 'FAKTURA VAT', style: 'title' },
            { text: `nr ${invoice.invoiceNumber}`, style: 'subtitle' },
          ],
          alignment: 'center',
          margin: [0, 0, 0, 20],
        },

        // Dates Row
        {
          table: {
            widths: ['*', '*', '*', '*'],
            body: [
              [
                {
                  stack: [
                    { text: 'Data wystawienia', style: 'dateLabel' },
                    { text: this.formatDate(invoice.issueDate), style: 'dateValue' },
                  ],
                },
                {
                  stack: [
                    { text: 'Data sprzedaży', style: 'dateLabel' },
                    { text: this.formatDate(invoice.issueDate), style: 'dateValue' },
                  ],
                },
                {
                  stack: [
                    { text: 'Termin płatności', style: 'dateLabel' },
                    { text: this.formatDate(invoice.dueDate), style: 'dateValue' },
                  ],
                },
                {
                  stack: [
                    { text: 'Metoda płatności', style: 'dateLabel' },
                    { text: this.getPaymentMethodLabel(invoice.paymentMethod), style: 'dateValue' },
                  ],
                },
              ],
            ],
          },
          layout: 'noBorders',
          fillColor: '#f5f5f5',
          margin: [0, 0, 0, 30],
        },

        // Buyer Info
        {
          stack: [
            { text: 'Nabywca', style: 'sectionLabel' },
            { text: invoice.buyer.name, style: 'companyName' },
            invoice.buyer.address ? { text: invoice.buyer.address, style: 'address' } : {},
            invoice.buyer.nip ? { text: `NIP: ${invoice.buyer.nip}`, style: 'nip' } : {},
          ],
          margin: [0, 0, 0, 30],
        },

        // Items Table
        {
          table: {
            headerRows: 1,
            widths: [25, '*', 35, 40, 60, 40, 70, 70],
            body: [
              [
                { text: 'Lp.', style: 'tableHeader' },
                { text: 'Nazwa', style: 'tableHeader' },
                { text: 'J.m.', style: 'tableHeader' },
                { text: 'Ilość', style: 'tableHeader', alignment: 'right' },
                { text: 'Cena netto', style: 'tableHeader', alignment: 'right' },
                { text: 'VAT', style: 'tableHeader', alignment: 'center' },
                { text: 'Netto', style: 'tableHeader', alignment: 'right' },
                { text: 'Brutto', style: 'tableHeader', alignment: 'right' },
              ],
              ...invoice.items.map((item, index) => [
                { text: index + 1, alignment: 'center' },
                item.name,
                item.unit || 'szt.',
                { text: this.formatNumber(item.quantity), alignment: 'right' },
                { text: this.formatCurrency(item.unitPrice), alignment: 'right' },
                { text: this.formatVatRate(item.vatRate), alignment: 'center' },
                { text: this.formatCurrency(item.netAmount), alignment: 'right' },
                { text: this.formatCurrency(item.grossAmount), alignment: 'right' },
              ]),
            ],
          },
          layout: {
            hLineWidth: (i: number, node: any) => (i === 0 || i === node.table.body.length ? 1 : 1),
            vLineWidth: (i: number, node: any) =>
              i === 0 || i === node.table.widths.length ? 1 : 1,
            hLineColor: (i: number) => '#e0e0e0',
            vLineColor: (i: number) => '#e0e0e0',
            paddingLeft: (i: number) => 5,
            paddingRight: (i: number) => 5,
            paddingTop: (i: number) => 5,
            paddingBottom: (i: number) => 5,
          },
        },

        // Totals
        {
          columns: [
            { width: '*', text: '' },
            {
              width: 150,
              table: {
                widths: ['*', '*'],
                body: [
                  [
                    { text: 'Razem netto:', style: 'totalLabel' },
                    {
                      text: `${this.formatCurrency(invoice.totalNet)} ${invoice.currency}`,
                      alignment: 'right',
                    },
                  ],
                  [
                    { text: 'Razem VAT:', style: 'totalLabel' },
                    {
                      text: `${this.formatCurrency(invoice.totalVat)} ${invoice.currency}`,
                      alignment: 'right',
                    },
                  ],
                  [
                    { text: 'DO ZAPŁATY:', style: 'totalGrossLabel' },
                    {
                      text: `${this.formatCurrency(invoice.totalGross)} ${invoice.currency}`,
                      style: 'totalGrossValue',
                    },
                  ],
                ],
              },
              layout: 'noBorders',
              margin: [0, 10, 0, 0],
            },
          ],
          margin: [0, 0, 0, 20],
        },

        // Amount in Words
        {
          text: [
            { text: 'Słownie: ', bold: true },
            { text: amountWords, italic: true },
          ],
          margin: [0, 0, 0, 20],
        },

        // Notes
        invoice.notes
          ? {
              stack: [
                { text: 'Uwagi', style: 'sectionLabel' },
                { text: invoice.notes, style: 'notes' },
              ],
              margin: [0, 0, 0, 20],
            }
          : {},

        // Bank Info
        {
          stack: [
            { text: 'Dane do przelewu', style: 'sectionLabel' },
            {
              text: [
                { text: 'Numer konta: ', color: '#555' },
                { text: this.formatIban(invoice.seller.bankAccount), bold: true },
              ],
            },
          ],
          margin: [0, 0, 0, 40],
        },

        // Footer signatures
        {
          columns: [
            {
              width: '*',
              stack: [
                {
                  canvas: [
                    {
                      type: 'line',
                      x1: 0,
                      y1: 0,
                      x2: 200,
                      y2: 0,
                      lineWidth: 0.5,
                      lineColor: '#ccc',
                    },
                  ],
                },
                {
                  text: 'Podpis osoby upoważnionej do wystawienia',
                  style: 'signatureLabel',
                  margin: [0, 5, 0, 0],
                },
              ],
              alignment: 'center',
            },
            { width: 40, text: '' },
            {
              width: '*',
              stack: [
                {
                  canvas: [
                    {
                      type: 'line',
                      x1: 0,
                      y1: 0,
                      x2: 200,
                      y2: 0,
                      lineWidth: 0.5,
                      lineColor: '#ccc',
                    },
                  ],
                },
                {
                  text: 'Podpis osoby upoważnionej do odbioru',
                  style: 'signatureLabel',
                  margin: [0, 5, 0, 0],
                },
              ],
              alignment: 'center',
            },
          ],
          margin: [0, 40, 0, 0],
        },
      ],
      styles: {
        sectionLabel: {
          fontSize: 10,
          bold: true,
          color: '#666',
          textTransform: 'uppercase',
          margin: [0, 0, 0, 5],
        },
        companyName: {
          fontSize: 14,
          bold: true,
          margin: [0, 0, 0, 2],
        },
        address: {
          fontSize: 11,
          color: '#444',
          margin: [0, 0, 0, 2],
        },
        nip: {
          fontSize: 11,
          color: '#444',
        },
        title: {
          fontSize: 22,
          bold: true,
          margin: [0, 0, 0, 5],
        },
        subtitle: {
          fontSize: 14,
          color: '#666',
        },
        dateLabel: {
          fontSize: 10,
          color: '#666',
          margin: [0, 5, 0, 2],
        },
        dateValue: {
          fontSize: 11,
          bold: true,
          margin: [0, 0, 0, 5],
        },
        tableHeader: {
          fontSize: 10,
          bold: true,
          color: '#555',
          fillColor: '#f5f5f5',
        },
        totalLabel: {
          fontSize: 10,
          bold: true,
        },
        totalGrossLabel: {
          fontSize: 12,
          bold: true,
          margin: [0, 5, 0, 0],
        },
        totalGrossValue: {
          fontSize: 12,
          bold: true,
          margin: [0, 5, 0, 0],
          alignment: 'right',
        },
        notes: {
          fontSize: 10,
          italic: true,
          color: '#444',
        },
        signatureLabel: {
          fontSize: 9,
          color: '#888',
        },
      },
      defaultStyle: {
        font: 'Roboto',
        fontSize: 11,
      },
    };
  }

  private formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pl-PL');
  }

  private getPaymentMethodLabel(method: string): string {
    const labels: Record<string, string> = {
      transfer: 'Przelew',
      cash: 'Gotówka',
      card: 'Karta',
    };
    return labels[method] || method;
  }

  private formatNumber(value: string): string {
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    return num.toLocaleString('pl-PL', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  }

  private formatCurrency(value: string): string {
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    return num.toLocaleString('pl-PL', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  private formatVatRate(rate: string): string {
    return rate === 'zw' ? 'zw.' : `${rate}%`;
  }

  private formatIban(iban: string | null): string {
    if (!iban) return '-';
    const clean = iban.replace(/\s/g, '');
    return clean.match(/.{1,4}/g)?.join(' ') || iban;
  }

  /**
   * Helper to convert image URL to base64.
   */
  private getBase64ImageFromURL(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.setAttribute('crossOrigin', 'anonymous');
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        const dataURL = canvas.toDataURL('image/png');
        resolve(dataURL);
      };
      img.onerror = (error) =>
        reject(new Error(error instanceof Error ? error.message : 'Failed to load image'));
      img.src = url;
    });
  }
}
