import { createElement, useState, useContext } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import ConfirmationModal from './ConfirmationModal';
import {
  Menu,
  X,
  LogOut,
  Home,
  Users,
  Calendar,
  Clock,
  CreditCard,
  Activity,
  Stethoscope,
  CalendarOff,
  FileText,
  FileLock2,
  FolderOpen,
} from 'lucide-react';

const NavItem = ({ to, icon, label, isActivePath, onNavigate }) => {
  const active = isActivePath(to);
  const iconClassName = `w-5 h-5 transition-colors ${active ? 'text-teal-600' : 'text-slate-400'}`;

  return (
    <Link
      to={to}
      onClick={onNavigate}
      className={`flex items-center gap-3 px-4 py-3 mb-1.5 font-bold rounded-xl transition-all duration-200 ${
        active
          ? 'bg-teal-50 text-teal-700 shadow-sm border border-teal-100/50'
          : 'text-slate-500 hover:bg-slate-100/70 hover:text-teal-600 border border-transparent'
      }`}
    >
      {createElement(icon, { className: iconClassName })}
      {label}
    </Link>
  );
};

const DashboardLayout = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  // State for Mobile Sidebar and Logout Modal
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // Triggered by the modal's confirm button
  const executeLogout = () => {
    setIsLogoutModalOpen(false);
    logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  // Helper function to determine if a link is active
  const isActive = (path) => {
    if (path === '/dashboard' && location.pathname === '/dashboard')
      return true;
    if (path !== '/dashboard' && location.pathname.startsWith(path))
      return true;
    return false;
  };

  const renderNavLinks = () => {
    const navProps = {
      isActivePath: isActive,
      onNavigate: () => setIsSidebarOpen(false),
    };

    switch (user?.role) {
      case 'ADMIN':
        return (
          <>
            <NavItem
              to="/dashboard/revenue"
              icon={CreditCard}
              label="Revenue"
              {...navProps}
            />
            <NavItem
              to="/dashboard/users"
              icon={Users}
              label="Manage Users"
              {...navProps}
            />
          </>
        );
      case 'DOCTOR':
        return (
          <>
            <NavItem
              to="/dashboard/schedule"
              icon={Calendar}
              label="My Schedule"
              {...navProps}
            />
            <NavItem
              to="/dashboard/patients"
              icon={FileLock2}
              label="Private Notes"
              {...navProps}
            />
            <NavItem
              to="/dashboard/prescriptions"
              icon={FileText}
              label="Digital Prescriptions"
              {...navProps}
            />
            <NavItem
              to="/dashboard/leaves"
              icon={CalendarOff}
              label="Leave Management"
              {...navProps}
            />
            <NavItem
              to="/dashboard/availability"
              icon={Clock}
              label="Clinic Hours"
              {...navProps}
            />
          </>
        );
      case 'STAFF':
        return (
          <>
            <NavItem
              to="/dashboard/queue"
              icon={Clock}
              label="Queue Management"
              {...navProps}
            />
            <NavItem
              to="/dashboard/billing"
              icon={CreditCard}
              label="Billing"
              {...navProps}
            />
          </>
        );
      case 'PATIENT':
        return (
          <>
            <NavItem
              to="/dashboard/book"
              icon={Calendar}
              label="Book Appointment"
              {...navProps}
            />
            <NavItem
              to="/dashboard/history"
              icon={Activity}
              label="Medical History"
              {...navProps}
            />
            <NavItem
              to="/dashboard/documents"
              icon={FolderOpen}
              label="Documents"
              {...navProps}
            />
            <NavItem
              to="/dashboard/prescriptions"
              icon={FileText}
              label="Digital Prescriptions"
              {...navProps}
            />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden font-sans bg-slate-50">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden animate-in fade-in duration-200"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 shadow-2xl lg:shadow-none ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-20 px-6 border-b border-slate-100">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-teal-600 transition-colors hover:text-teal-700"
          >
            <div className="p-1.5 bg-teal-50 rounded-lg">
              <Stethoscope className="w-6 h-6" />
            </div>
            MediCare Sync
          </Link>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-2 rounded-lg lg:hidden text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-4 py-6 overflow-y-auto">
          <div className="mb-4 text-xs font-bold tracking-wider uppercase text-slate-400 px-4">
            Main Menu
          </div>
          <nav>
            <NavItem
              to="/dashboard"
              icon={Home}
              label="Dashboard Overview"
              isActivePath={isActive}
              onNavigate={() => setIsSidebarOpen(false)}
            />
            {renderNavLinks()}
          </nav>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex flex-col flex-1 w-full overflow-hidden">
        {/* Top Header */}
        <header className="flex items-center justify-between h-20 px-6 bg-white border-b border-slate-200 z-30 shadow-sm shadow-slate-100">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2.5 rounded-xl lg:hidden text-slate-500 hover:bg-slate-100 transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="hidden sm:block">
              <h1 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
                Welcome back,{' '}
                {user?.role === 'DOCTOR'
                  ? `Dr. ${user?.lastName}`
                  : user?.firstName}{' '}
                👋
              </h1>
              <p className="text-sm font-medium text-slate-500">
                {user?.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 border-l border-slate-200 pl-4 md:pl-6">
            <span className="hidden px-3.5 py-1.5 text-xs font-bold text-teal-700 bg-teal-50 border border-teal-100 rounded-full md:block shadow-sm">
              {user?.role}
            </span>
            <button
              onClick={() => setIsLogoutModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-red-600 transition-all bg-white border border-red-200 shadow-sm rounded-xl hover:bg-red-50 hover:border-red-300"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:block">Logout</span>
            </button>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50/50 scroll-smooth relative">
          <div className="container p-6 mx-auto md:p-8 max-w-7xl animate-in fade-in duration-300">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Reusable Logout Confirmation Modal */}
      <ConfirmationModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={executeLogout}
        type="warning" // Uses the amber warning colors since logging out isn't "destructive" data-wise
        title="Ready to leave?"
        message="Are you sure you want to log out of your dashboard? You will need to sign in again to access your records."
        confirmText="Yes, Logout"
      />
    </div>
  );
};

export default DashboardLayout;
