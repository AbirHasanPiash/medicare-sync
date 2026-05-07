import { pdf, Document, Page, Text, View } from '@react-pdf/renderer';

const PrescriptionPdfDocument = ({ prescription }) => (
  <Document>
    <Page size="A4">
      <View>
        <Text>Digital Prescription</Text>
        <Text>Generated from MediCare Sync EMR</Text>
      </View>

      <View>
        <Text>Patient Details</Text>
        <View>
          <Text>Name:</Text>
          <Text>{prescription.patientName}</Text>
        </View>
        <View>
          <Text>Email:</Text>
          <Text>{prescription.patientEmail}</Text>
        </View>
      </View>

      <View>
        <Text>Visit Details</Text>
        <View>
          <Text>Visit Date:</Text>
          <Text>{prescription.visitDate}</Text>
        </View>
        <View>
          <Text>Doctor:</Text>
          <Text>{prescription.doctorName}</Text>
        </View>
        <View>
          <Text>Diagnosis:</Text>
          <Text>{prescription.diagnosis || 'N/A'}</Text>
        </View>
        <View>
          <Text>Symptoms:</Text>
          <Text>{prescription.symptoms || 'N/A'}</Text>
        </View>
      </View>

      <View>
        <Text>Medications</Text>
        {prescription.medications.map((item, index) => (
          <View key={`${item.medicineName}-${index}`}>
            <Text>{item.medicineName}</Text>
            <View>
              <Text>Dosage:</Text>
              <Text>{item.dosage}</Text>
            </View>
            <View>
              <Text>Frequency:</Text>
              <Text>{item.frequency}</Text>
            </View>
            <View>
              <Text>Duration:</Text>
              <Text>{item.duration}</Text>
            </View>
            <View>
              <Text>Instructions:</Text>
              <Text>{item.instructions || 'N/A'}</Text>
            </View>
          </View>
        ))}
      </View>

      <Text>
        This is an electronically generated prescription and does not require a
        physical signature.
      </Text>
    </Page>
  </Document>
);

export const formatPrescriptionDate = (value) => {
  if (!value) return 'N/A';
  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const getAppointmentsWithPrescriptions = (allAppointments) => {
  if (!Array.isArray(allAppointments)) return [];

  return allAppointments
    .filter((item) => {
      const prescriptions = item.medicalRecord?.prescriptions;
      return Array.isArray(prescriptions) && prescriptions.length > 0;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));
};

export const getAppointmentOptions = (allAppointments, isDoctor) => {
  if (!Array.isArray(allAppointments)) return [];

  return allAppointments.filter((item) => {
    const validStatus = ['SCHEDULED', 'RESCHEDULED', 'COMPLETED'].includes(
      item.status
    );
    if (!validStatus) return false;

    if (!isDoctor) return true;

    const hasPrescription =
      Array.isArray(item.medicalRecord?.prescriptions) &&
      item.medicalRecord.prescriptions.length > 0;

    return !hasPrescription;
  });
};

export const buildPdfPayloadFromSavedPrescription = ({
  savedPrescription,
  selectedAppointment,
}) => {
  if (!savedPrescription || !selectedAppointment) return null;

  return {
    patientName:
      `${savedPrescription.patient?.firstName || ''} ${savedPrescription.patient?.lastName || ''}`.trim() ||
      'N/A',
    patientEmail: savedPrescription.patient?.email || 'N/A',
    visitDate: new Date(selectedAppointment.date).toLocaleDateString(),
    doctorName:
      `${savedPrescription.doctor?.firstName || ''} ${savedPrescription.doctor?.lastName || ''}`.trim() ||
      'N/A',
    diagnosis: savedPrescription.diagnosis,
    symptoms: Array.isArray(savedPrescription.symptoms)
      ? savedPrescription.symptoms.join(', ')
      : savedPrescription.symptoms,
    medications: (savedPrescription.prescriptions || []).map((item) => ({
      medicineName: item.medicineName,
      dosage: item.dosage,
      frequency: item.frequency,
      duration: item.duration,
      instructions: item.instructions,
    })),
  };
};

export const buildPdfPayloadFromAppointment = (appointment) => {
  const medicalRecord = appointment.medicalRecord;
  if (!medicalRecord) return null;

  return {
    patientName:
      `${appointment.patient?.firstName || ''} ${appointment.patient?.lastName || ''}`.trim() ||
      'N/A',
    patientEmail: appointment.patient?.email || 'N/A',
    visitDate: new Date(appointment.date).toLocaleDateString(),
    doctorName:
      `${appointment.doctor?.firstName || ''} ${appointment.doctor?.lastName || ''}`.trim() ||
      'N/A',
    diagnosis: medicalRecord.diagnosis,
    symptoms: Array.isArray(medicalRecord.symptoms)
      ? medicalRecord.symptoms.join(', ')
      : medicalRecord.symptoms,
    medications: (medicalRecord.prescriptions || []).map((item) => ({
      medicineName: item.medicineName,
      dosage: item.dosage,
      frequency: item.frequency,
      duration: item.duration,
      instructions: item.instructions,
    })),
  };
};

export const savePrescription = async ({ api, form }) => {
  const response = await api.post('/appointments/prescriptions', form);
  return response.data.medicalRecord;
};

export const downloadPrescriptionPdf = async ({ payload, appointmentId }) => {
  if (!payload) {
    throw new Error('No prescription data found to generate PDF.');
  }

  const blob = await pdf(
    <PrescriptionPdfDocument prescription={payload} />
  ).toBlob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `prescription-${appointmentId}.pdf`;
  anchor.click();
  URL.revokeObjectURL(url);
};
