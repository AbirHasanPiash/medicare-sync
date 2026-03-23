import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Stethoscope, Loader2 } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { token } = useParams();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      return toast.error('Passwords do not match');
    }

    // Strong password validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password)) {
      return toast.error('Password must be at least 8 chars with an uppercase, lowercase, and number.');
    }

    setIsSubmitting(true);

    try {
      await api.put(`/auth/reset-password/${token}`, { password });
      
      toast.success('Password reset successfully!');
      toast('Redirecting to login...', { icon: '👋' });
      
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to reset password. The link may be expired.');
    } finally {
      setIsSubmitting(false);
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

        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label className="block mb-2 text-sm font-bold text-slate-700">New Password</label>
            <input
              type="password"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-colors text-slate-800"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>
          <div className="mb-8">
            <label className="block mb-2 text-sm font-bold text-slate-700">Confirm Password</label>
            <input
              type="password"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-colors text-slate-800"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 px-4 py-3.5 font-bold text-white transition-all shadow-lg bg-teal-600 rounded-xl hover:bg-teal-700 hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0"
          >
            {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
            {isSubmitting ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;