async function getJsPDF() {
  const { jsPDF } = await import('jspdf');
  return jsPDF;
}

/**
 * Exports a single, professionally formatted presentation PDF with crop marks and scan instructions.
 */
export async function exportSingleQRPDF(
  canvas: HTMLCanvasElement,
  title: string = 'Scan to Connect',
  subtitle: string = 'Point your smartphone camera at the QR code'
) {
  const jsPDF = await getJsPDF();
  // A4 size: 210 x 297 mm
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;

  // Header Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(30, 41, 59); // slate-800
  doc.text(title, pageWidth / 2, 45, { align: 'center' });

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(subtitle, pageWidth / 2, 54, { align: 'center' });

  // Add QR Code image
  const imgData = canvas.toDataURL('image/png');
  const qrSize = 110; // mm
  const qrX = (pageWidth - qrSize) / 2;
  const qrY = 70;

  doc.addImage(imgData, 'PNG', qrX, qrY, qrSize, qrSize);

  // Subtle cut border / frame outline
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.4);
  doc.roundedRect(qrX - 8, qrY - 8, qrSize + 16, qrSize + 16, 4, 4, 'S');

  // Corner Crop Marks (for professional printing & cutting)
  const cropLen = 5;
  doc.setDrawColor(148, 163, 184); // slate-400
  doc.setLineWidth(0.3);

  // Top-left crop
  doc.line(qrX - 12, qrY - 8, qrX - 12 - cropLen, qrY - 8);
  doc.line(qrX - 8, qrY - 12, qrX - 8, qrY - 12 - cropLen);

  // Top-right crop
  doc.line(qrX + qrSize + 8, qrY - 12, qrX + qrSize + 8, qrY - 12 - cropLen);
  doc.line(qrX + qrSize + 12, qrY - 8, qrX + qrSize + 12 + cropLen, qrY - 8);

  // Bottom-left crop
  doc.line(qrX - 12, qrY + qrSize + 8, qrX - 12 - cropLen, qrY + qrSize + 8);
  doc.line(qrX - 8, qrY + qrSize + 12, qrX - 8, qrY + qrSize + 12 + cropLen);

  // Bottom-right crop
  doc.line(qrX + qrSize + 12, qrY + qrSize + 8, qrX + qrSize + 12 + cropLen, qrY + qrSize + 8);
  doc.line(qrX + qrSize + 8, qrY + qrSize + 12, qrX + qrSize + 8, qrY + qrSize + 12 + cropLen);

  // Bottom Footer Instruction
  doc.setFontSize(10);
  doc.setTextColor(148, 163, 184);
  doc.text('Created with MakeQR • Compatible with iOS Camera & Android Google Lens', pageWidth / 2, 260, {
    align: 'center',
  });

  doc.save(`makeqr-print-${Date.now()}.pdf`);
}

/**
 * Exports an A4 Multi-Sticker sheet (e.g. 2x3 grid = 6 stickers or 3x4 grid = 12 stickers)
 * Ready for printing on adhesive labels or table tents!
 */
export async function exportMultiStickerSheetPDF(
  canvas: HTMLCanvasElement,
  title: string = 'Scan Me',
  gridType: '2x3' | '3x4' = '2x3'
) {
  const jsPDF = await getJsPDF();
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const imgData = canvas.toDataURL('image/png');

  const cols = gridType === '2x3' ? 2 : 3;
  const rows = gridType === '2x3' ? 3 : 4;

  const marginX = 15;
  const marginY = 18;
  const cellWidth = (pageWidth - marginX * 2) / cols;
  const cellHeight = (pageHeight - marginY * 2) / rows;
  const qrSize = Math.min(cellWidth - 16, cellHeight - 24);

  // Header note (outside print zone)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(`MakeQR Print Sheet (${cols * rows} Stickers) • Cut along dashed guidelines`, marginX, 10);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = marginX + c * cellWidth;
      const y = marginY + r * cellHeight;

      // Dashed boundary guideline
      doc.setDrawColor(203, 213, 225); // slate-300
      doc.setLineDashPattern([2, 2], 0);
      doc.setLineWidth(0.25);
      doc.roundedRect(x + 2, y + 2, cellWidth - 4, cellHeight - 4, 3, 3, 'S');

      // Add QR Image
      const qrX = x + (cellWidth - qrSize) / 2;
      const qrY = y + 8;
      doc.addImage(imgData, 'PNG', qrX, qrY, qrSize, qrSize);

      // Label below QR
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);
      doc.text(title, x + cellWidth / 2, qrY + qrSize + 6, { align: 'center' });
    }
  }

  doc.save(`makeqr-stickers-${gridType}-${Date.now()}.pdf`);
}

/**
 * Exports a printable A4 Foldable Table Tent (Standing 2-Sided Display Card)
 * Includes tent ridge peak fold line, dual front/back QR display faces, and base folding tabs.
 */
export async function exportFoldableTableTentPDF(
  canvas: HTMLCanvasElement,
  title: string = 'Scan for Menu & Wi-Fi',
  tableNumber: string = 'Table 04'
) {
  const jsPDF = await getJsPDF();
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const imgData = canvas.toDataURL('image/png');

  // Page Header outside folding zone
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('MakeQR Table Tent Print Template • Fold along dashed lines to stand upright on table', pageWidth / 2, 10, {
    align: 'center',
  });

  const tentWidth = 140;
  const tentX = (pageWidth - tentWidth) / 2;

  // Tent Ridge fold at y=148.5 (middle of A4)
  const midY = pageHeight / 2;

  // Outer boundary cut line
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.rect(tentX, 20, tentWidth, 255);

  // Middle Tent Ridge Fold Line
  doc.setDrawColor(99, 102, 241); // indigo
  doc.setLineWidth(0.4);
  doc.setLineDashPattern([3, 2], 0);
  doc.line(tentX, midY, tentX + tentWidth, midY);

  // Label ridge
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(99, 102, 241);
  doc.text('▲ FOLD RIDGE (PEAK) ▲', pageWidth / 2, midY - 2, { align: 'center' });

  // Base fold lines
  const topBaseY = 35;
  const btmBaseY = 260;
  doc.setDrawColor(148, 163, 184);
  doc.line(tentX, topBaseY, tentX + tentWidth, topBaseY);
  doc.text('-- FOLD BASE FLAP 1 --', pageWidth / 2, topBaseY - 2, { align: 'center' });

  doc.line(tentX, btmBaseY, tentX + tentWidth, btmBaseY);
  doc.text('-- FOLD BASE FLAP 2 (INTERLOCK OR TAPE) --', pageWidth / 2, btmBaseY + 5, { align: 'center' });

  // Dual QR Faces
  const qrSize = 58;
  const qrX = (pageWidth - qrSize) / 2;

  // Side A Content
  const sideAY = 45;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(30, 41, 59);
  doc.text(title, pageWidth / 2, sideAY + 6, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`${tableNumber} • Point smartphone camera to scan`, pageWidth / 2, sideAY + 13, { align: 'center' });

  doc.addImage(imgData, 'PNG', qrX, sideAY + 18, qrSize, qrSize);

  // Side B Content
  const sideBY = midY + 12;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(30, 41, 59);
  doc.text(title, pageWidth / 2, sideBY + 6, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`${tableNumber} • Point smartphone camera to scan`, pageWidth / 2, sideBY + 13, { align: 'center' });

  doc.addImage(imgData, 'PNG', qrX, sideBY + 18, qrSize, qrSize);

  // Footnote
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('Scans cleanly on iOS & Android • Designed with MakeQR', pageWidth / 2, 290, { align: 'center' });

  doc.save(`makeqr-table-tent-${Date.now()}.pdf`);
}
