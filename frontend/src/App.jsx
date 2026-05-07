import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import BookAppointment from './pages/BookAppointment';
import DoctorSchedule from './pages/DoctorSchedule';
import DoctorLeaves from './pages/DoctorLeaves';
import PatientHistory from './pages/PatientHistory';
import ManageAvailability from './pages/ManageAvailability';
import DigitalPrescriptions from './pages/DigitalPrescriptions';
import MedicalDocuments from './pages/MedicalDocuments';
import PatientMedicalHistory from './pages/PatientMedicalHistory';
import PrivateDoctorNotes from './pages/PrivateDoctorNotes';

const Home = () => (
  <div className="p-4 bg-white rounded shadow">Dashboard Overview</div>
);
const Unauthorized = () => (
  <div className="p-4 text-red-700 bg-red-100 rounded shadow">
    You do not have permission to view this page.
  </div>
);

const App = () => {
  return (
    <AuthProvider>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            fontFamily: 'Inter, sans-serif',
            background: '#ffffff',
            color: '#0f172a', // slate-900
            boxShadow:
              '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            borderRadius: '1rem', // rounded-2xl
            padding: '16px',
            fontWeight: '500',
          },
          success: {
            iconTheme: {
              primary: '#0d9488', // teal-600
              secondary: '#ffffff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444', // red-500
              secondary: '#ffffff',
            },
          },
        }}
      />
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          {/* Protected Dashboard Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<Home />} />

              <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
                <Route path="revenue" element={<div>Revenue Component</div>} />
                <Route path="users" element={<div>Users Component</div>} />
              </Route>

              <Route element={<ProtectedRoute allowedRoles={['DOCTOR']} />}>
                <Route path="schedule" element={<DoctorSchedule />} />
                <Route path="leaves" element={<DoctorLeaves />} />
                <Route path="availability" element={<ManageAvailability />} />
                <Route path="patients" element={<PrivateDoctorNotes />} />
                <Route
                  path="patient-medical-history"
                  element={<PatientMedicalHistory />}
                />
                <Route
                  path="patient-medical-history/:patientId"
                  element={<PatientMedicalHistory />}
                />
              </Route>

              <Route element={<ProtectedRoute allowedRoles={['STAFF']} />}>
                <Route path="queue" element={<div>Queue Component</div>} />
                <Route path="billing" element={<div>Billing Component</div>} />
              </Route>

              <Route element={<ProtectedRoute allowedRoles={['PATIENT']} />}>
                <Route path="book" element={<BookAppointment />} />
                <Route path="history" element={<PatientHistory />} />
                <Route path="documents" element={<MedicalDocuments />} />
              </Route>

              <Route
                element={
                  <ProtectedRoute allowedRoles={['DOCTOR', 'PATIENT']} />
                }
              >
                <Route
                  path="prescriptions"
                  element={<DigitalPrescriptions />}
                />
              </Route>
            </Route>
          </Route>

          {/* Fallback Route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
