import { useContext } from 'react';
import { Link } from 'react-router-dom';
import useSWR from 'swr';
import { fetcher } from '../utils/api';
import { AuthContext } from '../contexts/AuthContext';
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  FolderOpen,
  Users,
  User,
  Stethoscope,
  FileText,
  CalendarOff,
  Activity,
  History,
  ArrowRight,
  AlertCircle,
  Heart,
  Video,
  MapPin,
} from 'lucide-react';

// Skeletons

const StatCardSkeleton = () => (
  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm animate-pulse">
    <div className="w-12 h-12 bg-slate-200 rounded-xl mb-4"></div>
    <div className="w-14 h-8 bg-slate-300 rounded mb-2"></div>
    <div className="w-28 h-4 bg-slate-200 rounded"></div>
  </div>
);

const RowSkeleton = () => (
  <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden animate-pulse h-20"></div>
);

// Shared small components

const StatCard = ({ icon: Icon, value, label, color, bgColor }) => (
  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
    <div
      className={`w-12 h-12 flex items-center justify-center rounded-xl mb-4 ${bgColor}`}
    >
      <Icon className={`w-6 h-6 ${color}`} />
    </div>
    <p className="text-3xl font-extrabold text-slate-900 tracking-tight">
      {value}
    </p>
    <p className="text-sm font-medium text-slate-500 mt-1">{label}</p>
  </div>
);

const ActionCard = ({ to, icon: Icon, label, description, color, bgColor }) => (
  <Link
    to={to}
    className="group flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md hover:border-teal-200 transition-all duration-200"
  >
    <div
      className={`w-11 h-11 flex items-center justify-center rounded-xl shrink-0 ${bgColor} group-hover:scale-110 transition-transform`}
    >
      <Icon className={`w-5 h-5 ${color}`} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="font-bold text-slate-800 text-sm">{label}</p>
      <p className="text-xs text-slate-500 truncate mt-0.5">{description}</p>
    </div>
    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-1 transition-all shrink-0" />
  </Link>
);

const StatusBadge = ({ status }) => {
  const map = {
    SCHEDULED: ['text-blue-700 bg-blue-100', 'Upcoming'],
    RESCHEDULED: ['text-orange-700 bg-orange-100', 'Rescheduled'],
    COMPLETED: ['text-teal-700 bg-teal-100', 'Completed'],
    CANCELLED: ['text-red-700 bg-red-100', 'Cancelled'],
  };
  const [cls, label] = map[status] ?? ['text-slate-600 bg-slate-100', status];
  return (
    <span
      className={`px-2.5 py-1 text-xs font-bold rounded-full shrink-0 ${cls}`}
    >
      {label}
    </span>
  );
};

const formatDate = (dateString) =>
  new Date(dateString).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

// Patient Dashboard

const PatientDashboard = ({ data }) => {
  const { profile, stats, upcomingAppointments, recentAppointments } = data;

  const dobFormatted = profile.dateOfBirth
    ? new Date(profile.dateOfBirth).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Not provided';

  return (
    <div className="space-y-8">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Calendar}
          value={stats.totalAppointments}
          label="Total Appointments"
          color="text-teal-600"
          bgColor="bg-teal-50"
        />
        <StatCard
          icon={Clock}
          value={stats.upcomingCount}
          label="Upcoming Visits"
          color="text-blue-600"
          bgColor="bg-blue-50"
        />
        <StatCard
          icon={CheckCircle2}
          value={stats.completedCount}
          label="Completed Visits"
          color="text-emerald-600"
          bgColor="bg-emerald-50"
        />
        <StatCard
          icon={FolderOpen}
          value={stats.documentCount}
          label="Documents Uploaded"
          color="text-amber-600"
          bgColor="bg-amber-50"
        />
      </div>

      {/* Profile + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Card */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 bg-teal-50 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-teal-600" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                {profile.firstName} {profile.lastName}
              </h2>
              <p className="text-sm font-medium text-slate-500">
                {profile.email}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Date of Birth
              </p>
              <p className="text-sm font-bold text-slate-800">{dobFormatted}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Blood Group
              </p>
              <div className="flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-red-500" />
                <p className="text-sm font-bold text-slate-800">
                  {profile.bloodGroup ?? 'Not recorded'}
                </p>
              </div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Gender
              </p>
              <p className="text-sm font-bold text-slate-800 capitalize">
                {profile.gender ?? 'Not specified'}
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Allergies
              </p>
              {profile.allergies.length === 0 ? (
                <p className="text-sm font-bold text-teal-600">None recorded</p>
              ) : (
                <p className="text-sm font-bold text-red-600 flex items-center gap-1 leading-tight">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {profile.allergies.join(', ')}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 mb-4">
            Quick Actions
          </h2>
          <div className="space-y-2.5">
            <ActionCard
              to="/dashboard/book"
              icon={Calendar}
              label="Book Appointment"
              description="Find a doctor and schedule a visit"
              color="text-teal-600"
              bgColor="bg-teal-50"
            />
            <ActionCard
              to="/dashboard/history"
              icon={Activity}
              label="Medical History"
              description="View your past and upcoming visits"
              color="text-blue-600"
              bgColor="bg-blue-50"
            />
            <ActionCard
              to="/dashboard/documents"
              icon={FolderOpen}
              label="My Documents"
              description="Manage your medical files and reports"
              color="text-amber-600"
              bgColor="bg-amber-50"
            />
            <ActionCard
              to="/dashboard/prescriptions"
              icon={FileText}
              label="Prescriptions"
              description="View and download your prescriptions"
              color="text-emerald-600"
              bgColor="bg-emerald-50"
            />
          </div>
        </div>
      </div>

      {/* Upcoming Appointments */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-teal-600" /> Upcoming Appointments
          </h2>
          {upcomingAppointments.length > 0 && (
            <Link
              to="/dashboard/history"
              className="text-sm font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1"
            >
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        {upcomingAppointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white border border-dashed border-slate-300 rounded-3xl text-center">
            <Calendar className="w-12 h-12 text-slate-300 mb-3" />
            <p className="font-bold text-slate-700">No upcoming appointments</p>
            <p className="text-sm text-slate-500 mt-1 mb-5">
              Book a visit with one of our doctors.
            </p>
            <Link
              to="/dashboard/book"
              className="px-5 py-2.5 bg-teal-600 text-white text-sm font-bold rounded-xl hover:bg-teal-700 transition-colors"
            >
              Book Now
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingAppointments.map((app) => (
              <div
                key={app.id}
                className="group flex flex-col sm:flex-row bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden hover:shadow-md hover:border-teal-200 transition-all"
              >
                <div className="flex flex-row sm:flex-col justify-between sm:justify-center p-4 bg-teal-50 border-b sm:border-b-0 sm:border-r border-teal-100 sm:w-48 shrink-0 group-hover:bg-teal-100/50 transition-colors">
                  <div className="flex items-center gap-2 text-teal-800 font-semibold text-sm">
                    <Calendar className="w-4 h-4" /> {formatDate(app.date)}
                  </div>
                  <div className="flex items-center gap-1.5 text-teal-900 font-extrabold">
                    <Clock className="w-4 h-4" /> {app.startTime}
                  </div>
                </div>
                <div className="flex-1 p-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-slate-900">
                      Dr. {app.doctor.lastName}
                    </h3>
                    <p className="text-sm text-teal-600 font-medium">
                      {app.doctor.doctorProfile?.specialization}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-500 font-medium">
                      {app.type === 'TELEHEALTH' ? (
                        <>
                          <Video className="w-3.5 h-3.5 text-teal-500" /> Online
                        </>
                      ) : (
                        <>
                          <MapPin className="w-3.5 h-3.5 text-teal-500" />{' '}
                          In-Person
                        </>
                      )}
                    </div>
                  </div>
                  <StatusBadge status={app.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recent Visits */}
      {recentAppointments.length > 0 && (
        <section>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2 mb-4">
            <History className="w-5 h-5 text-slate-500" /> Recent Visits
          </h2>
          <div className="space-y-2.5">
            {recentAppointments.map((app) => (
              <div
                key={app.id}
                className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl hover:border-slate-300 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-slate-50 rounded-full shrink-0">
                    {app.status === 'COMPLETED' ? (
                      <CheckCircle2 className="w-5 h-5 text-teal-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">
                      Dr. {app.doctor.lastName}
                    </p>
                    <p className="text-sm text-slate-500 font-medium">
                      {formatDate(app.date)} ·{' '}
                      {app.type === 'TELEHEALTH' ? 'Online' : 'In-Person'}
                    </p>
                  </div>
                </div>
                <StatusBadge status={app.status} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

// Doctor Dashboard

const DoctorDashboard = ({ data }) => {
  const { profile, stats, todayAppointments, upcomingAppointments } = data;

  return (
    <div className="space-y-8">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Calendar}
          value={stats.todayCount}
          label="Today's Appointments"
          color="text-teal-600"
          bgColor="bg-teal-50"
        />
        <StatCard
          icon={Users}
          value={stats.totalPatients}
          label="Total Patients"
          color="text-blue-600"
          bgColor="bg-blue-50"
        />
        <StatCard
          icon={Clock}
          value={stats.upcomingCount}
          label="Upcoming Visits"
          color="text-violet-600"
          bgColor="bg-violet-50"
        />
        <StatCard
          icon={CheckCircle2}
          value={stats.completedCount}
          label="Completed Sessions"
          color="text-emerald-600"
          bgColor="bg-emerald-50"
        />
      </div>

      {/* Profile + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Card */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 bg-teal-50 rounded-full flex items-center justify-center">
              <Stethoscope className="w-6 h-6 text-teal-600" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                Dr. {profile.firstName} {profile.lastName}
              </h2>
              <p className="text-sm font-medium text-slate-500">
                {profile.email}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 p-3 bg-teal-50 rounded-xl border border-teal-100">
              <p className="text-xs font-bold text-teal-500 uppercase tracking-wider mb-1">
                Specialization
              </p>
              <p className="text-sm font-bold text-teal-900">
                {profile.specialization}
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Slot Duration
              </p>
              <p className="text-sm font-bold text-slate-800">
                {profile.slotDuration} min
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Today Scheduled
              </p>
              <p className="text-sm font-bold text-slate-800">
                {stats.todayScheduledCount} patient
                {stats.todayScheduledCount !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 mb-4">
            Quick Actions
          </h2>
          <div className="space-y-2.5">
            <ActionCard
              to="/dashboard/schedule"
              icon={Calendar}
              label="My Schedule"
              description="View and manage today's appointments"
              color="text-teal-600"
              bgColor="bg-teal-50"
            />
            <ActionCard
              to="/dashboard/availability"
              icon={Clock}
              label="Clinic Hours"
              description="Set your weekly availability blocks"
              color="text-blue-600"
              bgColor="bg-blue-50"
            />
            <ActionCard
              to="/dashboard/leaves"
              icon={CalendarOff}
              label="Leave Management"
              description="Manage blocked dates and holidays"
              color="text-amber-600"
              bgColor="bg-amber-50"
            />
            <ActionCard
              to="/dashboard/prescriptions"
              icon={FileText}
              label="Prescriptions"
              description="Write prescriptions for patients"
              color="text-violet-600"
              bgColor="bg-violet-50"
            />
            <ActionCard
              to="/dashboard/patient-medical-history"
              icon={History}
              label="Patient History"
              description="Browse your patients' medical records"
              color="text-emerald-600"
              bgColor="bg-emerald-50"
            />
          </div>
        </div>
      </div>

      {/* Today's Schedule */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-teal-600" /> Today's Schedule
          </h2>
          <Link
            to="/dashboard/schedule"
            className="text-sm font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1"
          >
            Manage <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {todayAppointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white border border-dashed border-slate-300 rounded-3xl text-center">
            <Calendar className="w-12 h-12 text-slate-300 mb-3" />
            <p className="font-bold text-slate-700">No appointments today</p>
            <p className="text-sm text-slate-500 mt-1">
              Your schedule is clear for today.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {todayAppointments.map((app) => (
              <div
                key={app.id}
                className={`group flex flex-col sm:flex-row bg-white border rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-all ${
                  app.status === 'CANCELLED'
                    ? 'border-slate-200 opacity-60'
                    : 'border-slate-200 hover:border-teal-200'
                }`}
              >
                <div className="flex flex-row sm:flex-col justify-between sm:justify-center p-4 bg-slate-50 border-b sm:border-b-0 sm:border-r border-slate-200 sm:w-40 shrink-0 group-hover:bg-teal-50/30 transition-colors">
                  <div className="flex items-center gap-1.5 text-slate-700 text-sm font-bold">
                    <Clock className="w-4 h-4 text-teal-600" /> {app.startTime}
                  </div>
                  <div className="text-xs text-slate-500 font-medium">
                    {app.startTime} – {app.endTime}
                  </div>
                </div>
                <div className="flex-1 p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 flex items-center justify-center bg-teal-50 rounded-full text-teal-600 shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">
                        {app.patient.firstName} {app.patient.lastName}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mt-0.5">
                        {app.type === 'TELEHEALTH' ? (
                          <>
                            <Video className="w-3 h-3 text-teal-500" /> Online
                          </>
                        ) : (
                          <>
                            <MapPin className="w-3 h-3 text-teal-500" />{' '}
                            In-Person
                          </>
                        )}
                        {app.reason && (
                          <>
                            {' '}
                            ·{' '}
                            {app.reason.length > 45
                              ? `${app.reason.slice(0, 45)}…`
                              : app.reason}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <StatusBadge status={app.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Upcoming (Beyond Today) */}
      {upcomingAppointments.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" /> Upcoming Appointments
            </h2>
            <Link
              to="/dashboard/schedule"
              className="text-sm font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1"
            >
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-2.5">
            {upcomingAppointments.map((app) => (
              <div
                key={app.id}
                className="flex flex-col sm:flex-row items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl hover:border-slate-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="p-2.5 bg-blue-50 rounded-full shrink-0">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">
                      {app.patient.firstName} {app.patient.lastName}
                    </h3>
                    <p className="text-sm text-slate-500 font-medium">
                      {formatDate(app.date)} at {app.startTime}
                    </p>
                  </div>
                </div>
                <div className="mt-3 sm:mt-0">
                  <StatusBadge status={app.status} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

// Main Page

const DashboardOverview = () => {
  const { user } = useContext(AuthContext);
  const { data, error, isLoading } = useSWR('/dashboard/overview', fetcher);

  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="max-w-5xl mx-auto font-sans">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Dashboard Overview
          </h1>
          <p className="mt-2 text-slate-500 text-lg">
            {user?.role === 'DOCTOR'
              ? 'Your clinic performance at a glance.'
              : "Here's a summary of your health activity."}
          </p>
        </div>
        <div className="text-sm font-medium text-slate-500 bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm shrink-0">
          {today}
        </div>
      </div>

      {error && (
        <div className="p-4 mb-6 text-sm font-medium text-red-700 bg-red-50 border border-red-100 rounded-xl">
          Failed to load dashboard. Please refresh the page.
        </div>
      )}

      {isLoading ? (
        <div className="space-y-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </div>
          <div className="space-y-3">
            <RowSkeleton />
            <RowSkeleton />
            <RowSkeleton />
          </div>
        </div>
      ) : data?.role === 'PATIENT' ? (
        <PatientDashboard data={data} />
      ) : data?.role === 'DOCTOR' ? (
        <DoctorDashboard data={data} />
      ) : !error ? (
        <div className="p-10 text-center bg-white border border-dashed border-slate-300 rounded-3xl text-slate-500">
          Dashboard overview is not available for your role yet.
        </div>
      ) : null}
    </div>
  );
};

export default DashboardOverview;
