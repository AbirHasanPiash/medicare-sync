import { useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import {
  CalendarCheck,
  FileText,
  CreditCard,
  ShieldCheck,
  Users,
  Activity,
  Star,
  Stethoscope
} from "lucide-react";

const Landing = () => {
  const { user } = useContext(AuthContext);

  return (
    <div className="min-h-screen font-sans text-gray-900 bg-slate-50 overflow-x-hidden">

      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-md border-b md:px-12">
        <div className="flex items-center gap-2 text-xl md:text-2xl font-extrabold text-teal-600">
          <Stethoscope className="w-7 h-7" />
          MediCare Sync
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <Link
              to="/dashboard"
              className="px-5 py-2.5 text-sm font-bold text-white bg-teal-600 rounded-xl hover:bg-teal-700"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="hidden sm:block font-semibold text-gray-600 hover:text-teal-600"
              >
                Login
              </Link>

              <Link
                to="/register"
                className="px-5 py-2.5 text-sm font-bold text-white bg-teal-600 rounded-xl hover:bg-teal-700"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* HERO */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 py-16 lg:py-24 grid lg:grid-cols-2 gap-12 items-center">

        <div>
          <h1 className="text-4xl lg:text-6xl font-extrabold leading-tight text-slate-900">
            Modern Clinic Management
            <span className="block text-teal-600">
              Simplified for Everyone
            </span>
          </h1>

          <p className="mt-6 text-lg text-slate-600 max-w-xl">
            MediCare Sync connects patients, doctors, and clinic staff in one
            unified platform. Manage appointments, electronic medical records,
            and billing with speed, accuracy, and security.
          </p>

          {/* DYNAMIC HERO BUTTONS */}
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            {user ? (
              <Link
                to="/dashboard"
                className="px-8 py-3.5 font-bold text-center text-white bg-teal-600 rounded-xl shadow-lg hover:bg-teal-700 hover:-translate-y-0.5 transition-all"
              >
                Go to your Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="px-8 py-3.5 font-bold text-center text-white bg-teal-600 rounded-xl hover:bg-teal-700 transition-colors"
                >
                  Book Appointment
                </Link>

                <Link
                  to="/login"
                  className="px-8 py-3.5 font-bold text-center text-teal-700 bg-teal-50 border rounded-xl hover:bg-teal-100 transition-colors"
                >
                  Doctor Login
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="flex-1 w-full max-w-lg lg:max-w-none">
          <div className="relative">
            {/* Image styling wrapper */}
            <div className="absolute inset-0 transform translate-x-4 translate-y-4 rounded-3xl bg-teal-600/10 -z-10"></div>
            <img 
              src="/hero-image.jpeg" 
              alt="Modern medical clinic management" 
              className="object-cover w-full h-auto shadow-2xl rounded-3xl border border-white/50"
              style={{ aspectRatio: '4/3' }} 
            />
            
            {/* Floating UI Badge for Doctor Availability (Bottom Left) */}
            <div className="absolute p-4 bg-white shadow-xl -bottom-6 -left-6 rounded-2xl animate-bounce" style={{ animationDuration: '3s' }}>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 text-xl bg-teal-100 rounded-full">
                  👨‍⚕️
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">50+ Specialists</p>
                  <p className="text-xs text-slate-500">Available for booking</p>
                </div>
              </div>
            </div>

            {/* Floating UI Badge for Social Proof (Top Right) */}
            <div className="absolute p-3 bg-white shadow-xl -top-6 -right-4 rounded-2xl animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }}>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 text-lg bg-yellow-100 rounded-full">
                  ⭐
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">4.9/5 Rating</p>
                  <p className="text-xs text-slate-500">Trusted by patients</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* TRUSTED STATS */}
      <section className="bg-white py-14">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">

          <div>
            <p className="text-3xl font-bold text-teal-600">10k+</p>
            <p className="text-gray-600">Appointments Booked</p>
          </div>

          <div>
            <p className="text-3xl font-bold text-teal-600">150+</p>
            <p className="text-gray-600">Doctors</p>
          </div>

          <div>
            <p className="text-3xl font-bold text-teal-600">20+</p>
            <p className="text-gray-600">Clinics</p>
          </div>

          <div>
            <p className="text-3xl font-bold text-teal-600">4.9</p>
            <p className="text-gray-600">Average Rating</p>
          </div>

        </div>
      </section>

      {/* FEATURES */}
      <section className="py-20 px-6 md:px-12 bg-slate-50">
        <div className="max-w-7xl mx-auto text-center">

          <h2 className="text-3xl font-extrabold mb-4">
            Everything Your Clinic Needs
          </h2>

          <p className="text-gray-600 mb-14">
            A powerful yet simple platform built to streamline healthcare operations.
          </p>

          <div className="grid md:grid-cols-3 gap-10">

            <Feature
              icon={<CalendarCheck />}
              title="Smart Scheduling"
              desc="Patients can book appointments instantly while doctors manage their availability with real-time scheduling."
            />

            <Feature
              icon={<FileText />}
              title="Electronic Medical Records"
              desc="Secure digital patient history, prescriptions, and diagnostic records accessible anytime."
            />

            <Feature
              icon={<CreditCard />}
              title="Automated Billing"
              desc="Generate invoices, track payments, and manage clinic revenue effortlessly."
            />

          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20 bg-white px-6 md:px-12">
        <div className="max-w-6xl mx-auto text-center">

          <h2 className="text-3xl font-extrabold mb-12">
            How MediCare Sync Works
          </h2>

          <div className="grid md:grid-cols-3 gap-10">

            <Step
              icon={<Users />}
              title="Register"
              desc="Patients and doctors create secure accounts in seconds."
            />

            <Step
              icon={<CalendarCheck />}
              title="Book Appointment"
              desc="Patients find doctors and schedule available slots instantly."
            />

            <Step
              icon={<Activity />}
              title="Manage Care"
              desc="Doctors maintain records, prescriptions, and treatment history."
            />

          </div>

        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-20 bg-slate-50 px-6 md:px-12">

        <div className="max-w-6xl mx-auto text-center">

          <h2 className="text-3xl font-extrabold mb-12">
            What Doctors & Patients Say
          </h2>

          <div className="grid md:grid-cols-3 gap-8">

            <Testimonial
              name="Dr. Rahman"
              text="Managing appointments and medical records has never been easier."
            />

            <Testimonial
              name="Nusrat Jahan"
              text="Booking doctor appointments is now quick and hassle-free."
            />

            <Testimonial
              name="Clinic Admin"
              text="Billing and reporting are fully streamlined."
            />

          </div>

        </div>

      </section>

      {/* SECURITY */}
      <section className="py-16 bg-white px-6 md:px-12">

        <div className="max-w-5xl mx-auto text-center">

          <ShieldCheck className="mx-auto text-teal-600 w-10 h-10 mb-4" />

          <h2 className="text-3xl font-extrabold">
            Your Data is Safe
          </h2>

          <p className="text-gray-600 mt-4">
            MediCare Sync uses industry-standard encryption and secure
            authentication to protect patient records and clinic data.
          </p>

        </div>

      </section>

      {/* DYNAMIC FINAL CTA */}
      <section className="py-20 bg-teal-600 text-center text-white px-6">

        <h2 className="text-3xl font-extrabold">
          Ready to Transform Your Clinic?
        </h2>

        <p className="mt-4 text-teal-100">
          Join thousands of healthcare professionals already using MediCare Sync.
        </p>

        {user ? (
          <Link
            to="/dashboard"
            className="inline-block mt-8 px-8 py-4 bg-white text-teal-600 font-bold rounded-xl hover:bg-gray-100 transition-colors"
          >
            Enter Dashboard
          </Link>
        ) : (
          <Link
            to="/register"
            className="inline-block mt-8 px-8 py-4 bg-white text-teal-600 font-bold rounded-xl hover:bg-gray-100 transition-colors"
          >
            Start Free Today
          </Link>
        )}

      </section>

      {/* FOOTER */}
      <footer className="py-10 text-center text-gray-500 border-t bg-slate-50">
        © {new Date().getFullYear()} MediCare Sync
      </footer>

    </div>
  );
};

const Feature = ({ icon, title, desc }) => (
  <div className="bg-white p-8 rounded-2xl border hover:shadow-lg transition">
    <div className="text-teal-600 mb-4">{icon}</div>
    <h3 className="font-bold text-xl mb-2">{title}</h3>
    <p className="text-gray-600">{desc}</p>
  </div>
);

const Step = ({ icon, title, desc }) => (
  <div className="p-6">
    <div className="text-teal-600 mb-3">{icon}</div>
    <h3 className="font-bold text-lg">{title}</h3>
    <p className="text-gray-600">{desc}</p>
  </div>
);

const Testimonial = ({ name, text }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border">
    <Star className="text-yellow-400 mb-3" />
    <p className="text-gray-600 italic">"{text}"</p>
    <p className="mt-4 font-semibold">{name}</p>
  </div>
);

export default Landing;