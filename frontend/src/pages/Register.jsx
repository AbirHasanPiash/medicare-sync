import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Stethoscope, Loader2 } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const Register = () => {
  const [role, setRole] = useState('PATIENT');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    specialization: 'General',
    dateOfBirth: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Frontend Password Strength Validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      return toast.error('Password must be at least 8 chars with an uppercase, lowercase, and number.');
    }

    setIsSubmitting(true);

    try {
      // Use the centralized Axios API instance
      await api.post('/auth/register', { ...formData, role });

      toast.success('Registration successful!');
      toast('Redirecting to login...', { icon: '👋' });
      
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen px-6 font-sans overflow-hidden bg-slate-50">
      
      {/* Background Decorative Blob */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 pointer-events-none"></div>

      {/* Top Left Logo */}
      <div className="absolute top-6 left-6 md:top-8 md:left-12">
        <Link
          to="/"
          className="flex items-center gap-2 text-xl md:text-2xl font-extrabold tracking-tight text-teal-600 transition-colors hover:text-teal-700"
        >
          <Stethoscope className="w-7 h-7" />
          MediCare Sync
        </Link>
      </div>

      {/* Register Card */}
      <div className="w-full max-w-md p-8 sm:p-10 bg-white border shadow-xl rounded-3xl border-slate-100 z-10 mt-20 mb-8">
        
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-slate-900">
            Create an Account
          </h2>
          <p className="mt-2 text-slate-500">
            Join MediCare Sync to manage your healthcare.
          </p>
        </div>

        {/* Segmented Role Toggle */}
        <div className="flex p-1 mb-8 bg-slate-100 rounded-xl">
          <button
            type="button"
            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
              role === 'PATIENT' 
                ? 'bg-white text-teal-700 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
            onClick={() => setRole('PATIENT')}
          >
            I am a Patient
          </button>
          <button
            type="button"
            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
              role === 'DOCTOR' 
                ? 'bg-white text-teal-700 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
            onClick={() => setRole('DOCTOR')}
          >
            I am a Doctor
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <label className="block mb-2 text-sm font-bold text-slate-700">
                First Name
              </label>
              <input
                type="text"
                name="firstName"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-colors text-slate-800"
                placeholder="John"
                onChange={handleChange}
                required
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block mb-2 text-sm font-bold text-slate-700">
                Last Name
              </label>
              <input
                type="text"
                name="lastName"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-colors text-slate-800"
                placeholder="Doe"
                onChange={handleChange}
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="mb-5">
            <label className="block mb-2 text-sm font-bold text-slate-700">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-colors text-slate-800"
              placeholder="you@example.com"
              onChange={handleChange}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="mb-5">
            <label className="block mb-2 text-sm font-bold text-slate-700">
              Password
            </label>
            <input
              type="password"
              name="password"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-colors text-slate-800"
              placeholder="••••••••"
              onChange={handleChange}
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Dynamic Fields based on Role */}
          {role === 'PATIENT' && (
            <div className="mb-8">
              <label className="block mb-2 text-sm font-bold text-slate-700">
                Date of Birth
              </label>
              <input
                type="date"
                name="dateOfBirth"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-colors text-slate-800"
                onChange={handleChange}
                required
                disabled={isSubmitting}
              />
            </div>
          )}

          {role === 'DOCTOR' && (
            <div className="mb-8">
              <label className="block mb-2 text-sm font-bold text-slate-700">
                Specialization
              </label>
              <select
                name="specialization"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-colors text-slate-800"
                onChange={handleChange}
                disabled={isSubmitting}
              >
                <option value="General">General Practice</option>
                <option value="Cardiology">Cardiology</option>
                <option value="Dental">Dental</option>
                <option value="Orthopedics">Orthopedics</option>
                <option value="Neurology">Neurology</option>
                <option value="Pediatrics">Pediatrics</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center items-center gap-2 px-4 py-3.5 font-bold text-white transition-all shadow-lg bg-teal-600 rounded-xl hover:bg-teal-700 hover:-translate-y-0.5 hover:shadow-teal-500/30 disabled:opacity-70 disabled:hover:translate-y-0 disabled:shadow-none"
          >
            {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
            {isSubmitting ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p className="mt-6 text-sm text-center text-slate-600">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-teal-600 transition-colors hover:text-teal-700">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;