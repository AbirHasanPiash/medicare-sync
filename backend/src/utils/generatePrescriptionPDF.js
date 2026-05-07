import PDFDocument from 'pdfkit';

const writeLabelValue = (doc, label, value) => {
  doc.font('Helvetica-Bold').text(`${label}:`, { continued: true });
  doc.font('Helvetica').text(` ${value || 'N/A'}`);
};

export const generatePrescriptionPDFBuffer = (prescription) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(20).font('Helvetica-Bold').text('Digital Prescription');
    doc.moveDown(0.3);
    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#4B5563')
      .text('Generated from MediCare Sync EMR');
    doc.fillColor('#111827');
    doc.moveDown(1.2);

    doc.fontSize(13).font('Helvetica-Bold').text('Patient Details');
    doc.moveDown(0.4);
    doc.fontSize(11);
    writeLabelValue(doc, 'Name', prescription.patientName);
    writeLabelValue(doc, 'Email', prescription.patientEmail);
    doc.moveDown(0.8);

    doc.fontSize(13).font('Helvetica-Bold').text('Visit Details');
    doc.moveDown(0.4);
    doc.fontSize(11);
    writeLabelValue(doc, 'Visit Date', prescription.visitDate);
    writeLabelValue(doc, 'Doctor', prescription.doctorName);
    writeLabelValue(doc, 'Diagnosis', prescription.diagnosis);
    writeLabelValue(doc, 'Symptoms', prescription.symptoms);
    doc.moveDown(0.8);

    doc.fontSize(13).font('Helvetica-Bold').text('Medications');
    doc.moveDown(0.5);

    const medications = Array.isArray(prescription.medications)
      ? prescription.medications
      : [];

    if (medications.length === 0) {
      doc.fontSize(11).font('Helvetica').text('No medications recorded.');
    } else {
      medications.forEach((item, index) => {
        doc
          .fontSize(11)
          .font('Helvetica-Bold')
          .text(`${index + 1}. ${item.medicineName || 'Unnamed medicine'}`);
        doc.font('Helvetica');
        doc.text(`   Dosage: ${item.dosage || 'N/A'}`);
        doc.text(`   Frequency: ${item.frequency || 'N/A'}`);
        doc.text(`   Duration: ${item.duration || 'N/A'}`);
        doc.text(`   Instructions: ${item.instructions || 'N/A'}`);
        doc.moveDown(0.5);
      });
    }

    doc.moveDown(1);
    doc
      .fontSize(9)
      .fillColor('#4B5563')
      .text(
        'This is an electronically generated prescription and does not require a physical signature.'
      );

    doc.end();
  });
