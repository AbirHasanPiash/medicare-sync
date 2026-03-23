import { useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Stethoscope, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const result = await login(email, password);

    if (result.success) {
      toast.success('Welcome back!');
      navigate('/dashboard');
    } else {
      toast.error(result.error);
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

      {/* Login Card */}
      <div className="w-full max-w-md p-8 sm:p-10 bg-white border shadow-xl rounded-3xl border-slate-100 z-10">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-slate-900">
            Welcome Back
          </h2>
          <p className="mt-2 text-slate-500">
            Please enter your details to sign in.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label className="block mb-2 text-sm font-bold text-slate-700">
              Email Address
            </label>
            <input
              type="email"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-colors text-slate-800"
              placeholder="doctor@medicare.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-bold text-slate-700">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-sm font-semibold text-teal-600 transition-colors hover:text-teal-700"
              >
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-colors text-slate-800"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center items-center gap-2 px-4 py-3.5 font-bold text-white transition-all shadow-lg bg-teal-600 rounded-xl hover:bg-teal-700 hover:-translate-y-0.5 hover:shadow-teal-500/30 disabled:opacity-70 disabled:hover:translate-y-0 disabled:shadow-none"
          >
            {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>

          <p className="mt-6 text-sm text-center text-slate-600">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="font-bold text-teal-600 transition-colors hover:text-teal-700"
            >
              Register here
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;