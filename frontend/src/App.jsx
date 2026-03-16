import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Landing from './pages/Landing'; // Import the new Landing Page
import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

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
                <Route
                  path="schedule"
                  element={<div>Schedule Component</div>}
                />
                <Route
                  path="patients"
                  element={<div>Patients Component</div>}
                />
              </Route>

              <Route element={<ProtectedRoute allowedRoles={['STAFF']} />}>
                <Route path="queue" element={<div>Queue Component</div>} />
                <Route path="billing" element={<div>Billing Component</div>} />
              </Route>

              <Route element={<ProtectedRoute allowedRoles={['PATIENT']} />}>
                <Route
                  path="book"
                  element={<div>Book Appointment Component</div>}
                />
                <Route path="history" element={<div>History Component</div>} />
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
