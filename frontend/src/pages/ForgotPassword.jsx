import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Stethoscope } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      const res = await fetch('http://localhost:5000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (res.ok) {
        setMessage(data.message);
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
          <h2 className="text-3xl font-extrabold text-slate-900">Reset Password</h2>
          <p className="mt-2 text-slate-500">Enter your email and we'll send you a link to reset your password.</p>
        </div>

        {error && <div className="p-4 mb-6 text-sm font-medium text-red-700 bg-red-50 border border-red-100 rounded-xl">{error}</div>}
        {message && <div className="p-4 mb-6 text-sm font-medium text-teal-700 bg-teal-50 border border-teal-100 rounded-xl">{message}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-8">
            <label className="block mb-2 text-sm font-bold text-slate-700">Email Address</label>
            <input
              type="email"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-colors"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="w-full px-4 py-3.5 font-bold text-white transition-all shadow-lg bg-teal-600 rounded-xl hover:bg-teal-700 hover:-translate-y-0.5">
            Send Reset Link
          </button>
          <p className="mt-6 text-sm text-center text-slate-600">
            Remember your password? <Link to="/login" className="font-bold text-teal-600 transition-colors hover:text-teal-700">Log in</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;