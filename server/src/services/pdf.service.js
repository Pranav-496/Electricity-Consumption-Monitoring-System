const PDFDocument = require('pdfkit');

/**
 * Generates an official electricity bill invoice PDF stream
 */
const generateBillPdf = (bill) => {
  const doc = new PDFDocument({ margin: 50 });

  // Header / Brand
  doc.fillColor('#047857').fontSize(22).text('POWERGRID MONITORING SYSTEM', { align: 'center' });
  doc.fillColor('#6b7280').fontSize(10).text('Official Utility Consumption & Billing Statement', { align: 'center' });
  doc.moveDown(1.5);

  // Line separator
  doc.strokeColor('#e5e7eb').lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
  doc.moveDown(1);

  // Bill Metadata Table
  const startY = doc.y;
  doc.fillColor('#111827').fontSize(10);
  doc.text(`Bill Reference: #${bill.id.slice(0, 8)}`, 50, startY);
  doc.text(`Bill Date: ${bill.bill_date}`, 50, startY + 15);
  doc.text(`Due Date: ${bill.due_date}`, 50, startY + 30);
  doc.text(`Payment Status: ${bill.payment_status.toUpperCase()}`, 50, startY + 45);

  const consumer = bill.meters?.consumers || {};
  doc.text(`Consumer Name: ${consumer.name || 'Valued Customer'}`, 320, startY);
  doc.text(`Contact: ${consumer.contact || 'N/A'}`, 320, startY + 15);
  doc.text(`Address: ${consumer.address || 'N/A'}`, 320, startY + 30);
  doc.text(`Meter Number: ${bill.meters?.meter_number || 'N/A'}`, 320, startY + 45);

  doc.moveDown(4);

  // Consumption Details Section
  doc.fillColor('#065f46').fontSize(12).text('Consumption Reading Overview');
  doc.moveDown(0.5);

  doc.fillColor('#374151').fontSize(10);
  doc.text(`Billing Cycle: ${bill.billing_period_start} to ${bill.billing_period_end}`);
  doc.text(`Meter Reading Date: ${bill.reading_date}`);
  doc.text(`Total Energy Units Consumed: ${bill.units_consumed} kWh`);
  doc.moveDown(1);

  // Financial Breakdown Box
  doc.rect(50, doc.y, 500, 140).fillAndStroke('#f9fafb', '#e5e7eb');
  const boxY = doc.y + 15;
  
  doc.fillColor('#111827').fontSize(11).text('Charges Breakdown', 70, boxY);
  
  doc.fontSize(10).fillColor('#4b5563');
  doc.text(`Energy Charges (${bill.units_consumed} kWh @ Rs. ${bill.rate_per_unit}/kWh):`, 70, boxY + 25);
  doc.text(`Rs. ${(bill.units_consumed * bill.rate_per_unit).toFixed(2)}`, 450, boxY + 25, { align: 'right' });

  doc.text('Base Fixed Meter Charge:', 70, boxY + 45);
  doc.text(`Rs. ${bill.fixed_charge.toFixed(2)}`, 450, boxY + 45, { align: 'right' });

  doc.text('Applicable Utility Tax:', 70, boxY + 65);
  doc.text(`Rs. ${bill.tax_amount.toFixed(2)}`, 450, boxY + 65, { align: 'right' });

  doc.strokeColor('#d1d5db').lineWidth(0.5).moveTo(70, boxY + 85).lineTo(530, boxY + 85).stroke();

  doc.fillColor('#111827').fontSize(11).text('Total Amount Payable:', 70, boxY + 95);
  doc.text(`Rs. ${bill.amount.toFixed(2)}`, 450, boxY + 95, { align: 'right' });

  doc.text(`Amount Paid: Rs. ${(bill.total_paid || 0).toFixed(2)}   |   Outstanding Balance: Rs. ${(bill.outstanding_balance !== undefined ? bill.outstanding_balance : bill.amount).toFixed(2)}`, 70, boxY + 115);

  doc.moveDown(10);
  doc.fillColor('#9ca3af').fontSize(8).text('This is a computer generated utility invoice demonstration document. No physical signature required.', { align: 'center' });

  doc.end();
  return doc;
};

module.exports = {
  generateBillPdf
};
