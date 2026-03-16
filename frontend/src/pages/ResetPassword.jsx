import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Stethoscope } from 'lucide-react';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { token } = useParams(); // Grabs the token from the URL
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }

    // Reuse your strong password validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password)) {
      return setError('Password must be at least 8 chars with an uppercase, lowercase, and number.');
    }

    try {
      const res = await fetch(`http://localhost:5000/api/auth/reset-password/${token}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();

      if (res.ok) {
        setSuccess('Password reset successfully! Redirecting to login...');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError(data.error || 'Something went wrong');
      }
    } catch (err) {
      setError('Cannot connect to server');
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen px-6 font-sans overflow-hidden bg-slate-50">
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 pointer-events-none"></div>

      <div className="absolute top-6 left-6 md:top-8 md:left-12">
        <Link to="/" className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-teal-600 transition-colors hover:text-teal-700">
          <Stethoscope className="w-7 h-7" />
          MediCare Sync
        </Link>
      </div>

      <div className="w-full max-w-md p-8 sm:p-10 bg-white border shadow-xl rounded-3xl border-slate-100 z-10">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-slate-900">Set New Password</h2>
          <p className="mt-2 text-slate-500">Please enter your new secure password.</p>
        </div>

        {error && <div className="p-4 mb-6 text-sm font-medium text-red-700 bg-red-50 border border-red-100 rounded-xl">{error}</div>}
        {success && <div className="p-4 mb-6 text-sm font-medium text-teal-700 bg-teal-50 border border-teal-100 rounded-xl">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label className="block mb-2 text-sm font-bold text-slate-700">New Password</label>
            <input
              type="password"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-colors"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="mb-8">
            <label className="block mb-2 text-sm font-bold text-slate-700">Confirm Password</label>
            <input
              type="password"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-colors"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="w-full px-4 py-3.5 font-bold text-white transition-all shadow-lg bg-teal-600 rounded-xl hover:bg-teal-700 hover:-translate-y-0.5">
            Reset Password
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;