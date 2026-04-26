import { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import AuthLayout from '../components/AuthLayout';
import '../styles/wyzant.css';

axios.defaults.withCredentials = true;

const emailValid = value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());

const field =
  'w-full px-4 py-3 text-[15px] rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-market-orange/30 focus:border-market-orange';

function LoginPage() {
  const navigate = useNavigate();
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginErrors, setLoginErrors] = useState({});

  const handleLoginChange = e => {
    const { name, value } = e.target;
    setLoginForm(prev => ({ ...prev, [name]: value }));
    if (loginErrors[name]) setLoginErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const validateLogin = () => {
    const next = {};
    if (!loginForm.email?.trim() || !emailValid(loginForm.email)) {
      next.email = 'Please enter a valid email';
    }
    if (!loginForm.password || loginForm.password.length < 6) {
      next.password = 'Password must be at least 6 characters';
    }
    setLoginErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleLoginSubmit = async (e, demoCreds = null) => {
    if (e) e.preventDefault();
    let creds = loginForm;
    if (demoCreds) {
      creds = demoCreds;
      setLoginForm(demoCreds);
    } else if (!validateLogin()) {
      return;
    }

    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', creds);
      const { user } = res.data;
      toast.success(`Welcome back, ${user.username}!`);
      if (user.role === 'admin') {
        navigate('/admin-dashboard');
      } else if (user.role === 'tutor') {
        navigate('/tutor-dashboard');
      } else {
        navigate('/home');
      }
    } catch (err) {
      const data = err.response?.data;
      const message =
        data?.msg ||
        data?.error ||
        (err.code === 'ERR_NETWORK'
          ? 'Cannot reach server. Ensure the API is running on port 5000.'
          : 'Login failed. Please check your credentials.');
      toast.error(typeof message === 'string' ? message : 'Login failed.');
    }
  };

  return (
    <AuthLayout
      panelTitle="Welcome back. Learn without limits."
      panelSubtitle="Sign in to book sessions, message tutors, and manage your learning journey—built for a global student community."
    >
      <div className="rounded-2xl bg-white border border-slate-200/90 shadow-xl shadow-slate-200/40 p-8 sm:p-9">
        <div className="text-center mb-8">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Sign in</h2>
          <p className="mt-2 text-sm text-slate-600">Use your email and password to continue.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 mb-8">
          <button
            type="button"
            onClick={() => handleLoginSubmit(null, { email: 'hariyata@test.com', password: 'password123' })}
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition-colors"
          >
            Try demo · Student
          </button>
          <button
            type="button"
            onClick={() => handleLoginSubmit(null, { email: 'dunna@test.com', password: 'password123' })}
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition-colors"
          >
            Try demo · Tutor
          </button>
        </div>

        <form onSubmit={handleLoginSubmit} className="space-y-5" noValidate>
          <div>
            <label htmlFor="login-email" className="block text-sm font-semibold text-slate-800 mb-1.5">
              Email
            </label>
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              value={loginForm.email}
              onChange={handleLoginChange}
              className={field}
              placeholder="you@university.edu"
            />
            {loginErrors.email && <p className="mt-1.5 text-sm text-red-600">{loginErrors.email}</p>}
          </div>

          <div>
            <label htmlFor="login-password" className="block text-sm font-semibold text-slate-800 mb-1.5">
              Password
            </label>
            <input
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={loginForm.password}
              onChange={handleLoginChange}
              className={field}
              placeholder="••••••••"
            />
            {loginErrors.password && <p className="mt-1.5 text-sm text-red-600">{loginErrors.password}</p>}
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-market-orange py-3.5 text-[15px] font-bold text-white shadow-md shadow-[0_4px_14px_rgba(74,185,230,0.35)] hover:bg-market-orange-hover transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-market-orange focus-visible:ring-offset-2"
          >
            Continue
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-600">
          New to PeerWise?{' '}
          <Link to="/register" className="font-semibold text-market-orange hover:text-market-orange-hover">
            Create an account
          </Link>
        </p>

        <p className="mt-6 text-center text-[11px] text-slate-400">
          Protected by industry-standard encryption. We never sell your data.
        </p>
      </div>
    </AuthLayout>
  );
}

export default LoginPage;
