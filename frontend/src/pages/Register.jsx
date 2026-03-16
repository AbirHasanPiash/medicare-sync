import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Stethoscope } from 'lucide-react';

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
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Frontend Password Strength Validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      setError('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number.');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, role }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Registration successful! Redirecting to login...');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('Cannot connect to the server.');
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
      <div className="w-full max-w-md p-8 sm:p-10 bg-white border shadow-xl rounded-3xl border-slate-100 z-10 mt-16 mb-8">
        
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

        {/* Feedback Messages */}
        {error && (
          <div className="p-4 mb-6 text-sm font-medium text-red-700 bg-red-50 border border-red-100 rounded-xl">
            {error}
          </div>
        )}
        {success && (
          <div className="p-4 mb-6 text-sm font-medium text-teal-700 bg-teal-50 border border-teal-100 rounded-xl">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <label className="block mb-2 text-sm font-bold text-slate-700">
                First Name
              </label>
              <input
                type="text"
                name="firstName"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-colors"
                placeholder="John"
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="block mb-2 text-sm font-bold text-slate-700">
                Last Name
              </label>
              <input
                type="text"
                name="lastName"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-colors"
                placeholder="Doe"
                onChange={handleChange}
                required
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
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-colors"
              placeholder="you@example.com"
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-5">
            <label className="block mb-2 text-sm font-bold text-slate-700">
              Password
            </label>
            <input
              type="password"
              name="password"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-colors"
              placeholder="••••••••"
              onChange={handleChange}
              required
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
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-colors"
                onChange={handleChange}
                required
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
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-colors"
                onChange={handleChange}
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
            className="w-full px-4 py-3.5 font-bold text-white transition-all shadow-lg bg-teal-600 rounded-xl hover:bg-teal-700 hover:-translate-y-0.5 hover:shadow-teal-500/30"
          >
            Create Account
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