import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import AuthLayout from '../components/AuthLayout';
import '../styles/wyzant.css';

axios.defaults.withCredentials = true;

const emailValid = value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());

const field =
  'w-full px-4 py-3 text-[15px] rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-market-orange/30 focus:border-market-orange';

function RegisterPage() {
  const navigate = useNavigate();
  const [registerForm, setRegisterForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    university: '',
  });
  const [role, setRole] = useState('');
  const [enrollmentModule, setEnrollmentModule] = useState('IT1010');
  const [enrollmentSuffix, setEnrollmentSuffix] = useState(() => Math.floor(Math.random() * 9000) + 1000);
  const [registerErrors, setRegisterErrors] = useState({});

  useEffect(() => {
    setEnrollmentSuffix(Math.floor(Math.random() * 9000) + 1000);
  }, [enrollmentModule]);

  const handleRegisterChange = e => {
    const { name, value } = e.target;
    setRegisterForm(prev => ({ ...prev, [name]: value }));
    if (registerErrors[name]) setRegisterErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const validateRegister = () => {
    const next = {};
    if (!registerForm.username?.trim() || registerForm.username.trim().length < 3) {
      next.username = 'Name must be at least 3 characters';
    }
    if (!registerForm.email?.trim() || !emailValid(registerForm.email)) {
      next.email = 'Please enter a valid email';
    }
    if (!registerForm.phoneNumber?.trim() || !/^\d{10}$/.test(registerForm.phoneNumber.trim())) {
      next.phoneNumber = 'Phone number must be exactly 10 digits (e.g. 0712345678)';
    }
    if (!registerForm.university?.trim() || registerForm.university.trim().length < 2) {
      next.university = 'Please enter your university or institution';
    }
    if (!registerForm.password || registerForm.password.length < 6) {
      next.password = 'Password must be at least 6 characters';
    }
    if (registerForm.password !== registerForm.confirmPassword) {
      next.confirmPassword = 'Passwords do not match';
    }
    if (!role || (role !== 'student' && role !== 'tutor')) {
      next.role = 'Please select your role';
    }

    setRegisterErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleRegisterSubmit = async e => {
    e.preventDefault();
    if (!validateRegister()) return;
    try {
      await axios.post('http://localhost:5000/api/auth/register', {
        ...registerForm,
        role,
        enrollmentModule,
      });

      const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
        email: registerForm.email,
        password: registerForm.password,
      });

      const { user } = loginRes.data;
      toast.success(`Welcome, ${user.username}! Your account is ready.`);

      if (user.role === 'admin') {
        navigate('/admin-dashboard');
      } else if (user.role === 'tutor') {
        navigate('/tutor-dashboard');
      } else {
        navigate('/home');
      }
    } catch (err) {
      const data = err.response?.data;
      const raw = data?.msg || data?.error;
      const message =
        typeof raw === 'string'
          ? raw
          : err.code === 'ERR_NETWORK'
            ? 'Cannot reach server. Check MongoDB and API on port 5000.'
            : 'Registration failed';
      toast.error(message);
    }
  };

  return (
    <AuthLayout
      panelTitle="Join PeerWise. Teach or learn on your terms."
      panelSubtitle="Create a free account in minutes. Choose student or tutor, and start connecting with peers worldwide."
      contentClassName="max-w-xl"
    >
      <div className="rounded-2xl bg-white border border-slate-200/90 shadow-xl shadow-slate-200/40 p-8 sm:p-9">
        <div className="text-center mb-8">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Create account</h2>
          <p className="mt-2 text-sm text-slate-600">All fields marked with your selections are required.</p>
        </div>

        <form onSubmit={handleRegisterSubmit} className="space-y-5" noValidate>
          <div>
            <p className="text-sm font-semibold text-slate-800 mb-2">I am a</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setRole('student');
                  setRegisterErrors(p => ({ ...p, role: undefined }));
                }}
                className={`rounded-xl border-2 p-4 text-center transition-all ${
                  role === 'student'
                    ? 'border-market-orange bg-amber-50/80 shadow-sm'
                    : 'border-slate-200 bg-slate-50/50 hover:border-slate-300'
                }`}
              >
                <span className="block text-lg font-bold text-slate-900 mb-0.5">Student</span>
                <span className="font-medium text-slate-600 text-xs">I want to learn</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setRole('tutor');
                  setRegisterErrors(p => ({ ...p, role: undefined }));
                }}
                className={`rounded-xl border-2 p-4 text-center transition-all ${
                  role === 'tutor'
                    ? 'border-market-orange bg-amber-50/80 shadow-sm'
                    : 'border-slate-200 bg-slate-50/50 hover:border-slate-300'
                }`}
              >
                <span className="block text-lg font-bold text-slate-900 mb-0.5">Tutor</span>
                <span className="font-medium text-slate-600 text-xs">I want to teach</span>
              </button>
            </div>
            {registerErrors.role && <p className="mt-2 text-sm text-red-600 text-center">{registerErrors.role}</p>}
          </div>

          {role === 'student' && (
            <div className="rounded-xl border border-amber-200/80 bg-amber-50/50 p-4">
              <label htmlFor="enrollment-module" className="block text-sm font-bold text-slate-800 mb-2">
                Enrollment module
              </label>
              <select
                id="enrollment-module"
                value={enrollmentModule}
                onChange={e => setEnrollmentModule(e.target.value)}
                className={field}
              >
                <option value="IT1010">IT1010 — Introduction to IT</option>
                <option value="IT2010">IT2010 — Algorithms</option>
                <option value="IT3010">IT3010 — Deep Learning</option>
              </select>
              <p className="mt-3 text-xs text-slate-600">
                Reference ID:{' '}
                <span className="font-mono font-bold text-market-orange">
                  {enrollmentModule}-ENR-{enrollmentSuffix}
                </span>
              </p>
              <p className="mt-2 text-xs text-slate-500">Use this reference when completing payment if required.</p>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label htmlFor="reg-username" className="block text-sm font-semibold text-slate-800 mb-1.5">
                Full name
              </label>
              <input
                id="reg-username"
                name="username"
                type="text"
                autoComplete="name"
                value={registerForm.username}
                onChange={handleRegisterChange}
                className={field}
                placeholder="Jane Doe"
              />
              {registerErrors.username && (
                <p className="mt-1.5 text-sm text-red-600">{registerErrors.username}</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="reg-email" className="block text-sm font-semibold text-slate-800 mb-1.5">
                Email
              </label>
              <input
                id="reg-email"
                name="email"
                type="email"
                autoComplete="email"
                value={registerForm.email}
                onChange={handleRegisterChange}
                className={field}
                placeholder="you@university.edu"
              />
              {registerErrors.email && <p className="mt-1.5 text-sm text-red-600">{registerErrors.email}</p>}
            </div>

            <div>
              <label htmlFor="reg-phone" className="block text-sm font-semibold text-slate-800 mb-1.5">
                Phone
              </label>
              <input
                id="reg-phone"
                name="phoneNumber"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                placeholder="0712345678"
                value={registerForm.phoneNumber}
                onChange={handleRegisterChange}
                className={field}
              />
              {registerErrors.phoneNumber && (
                <p className="mt-1.5 text-sm text-red-600">{registerErrors.phoneNumber}</p>
              )}
            </div>

            <div>
              <label htmlFor="reg-uni" className="block text-sm font-semibold text-slate-800 mb-1.5">
                University
              </label>
              <input
                id="reg-uni"
                name="university"
                type="text"
                placeholder="Institution name"
                value={registerForm.university}
                onChange={handleRegisterChange}
                className={field}
              />
              {registerErrors.university && (
                <p className="mt-1.5 text-sm text-red-600">{registerErrors.university}</p>
              )}
            </div>

            <div>
              <label htmlFor="reg-password" className="block text-sm font-semibold text-slate-800 mb-1.5">
                Password
              </label>
              <input
                id="reg-password"
                name="password"
                type="password"
                autoComplete="new-password"
                value={registerForm.password}
                onChange={handleRegisterChange}
                className={field}
              />
              {registerErrors.password && (
                <p className="mt-1.5 text-sm text-red-600">{registerErrors.password}</p>
              )}
            </div>

            <div>
              <label htmlFor="reg-confirm" className="block text-sm font-semibold text-slate-800 mb-1.5">
                Confirm password
              </label>
              <input
                id="reg-confirm"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={registerForm.confirmPassword}
                onChange={handleRegisterChange}
                className={field}
              />
              {registerErrors.confirmPassword && (
                <p className="mt-1.5 text-sm text-red-600">{registerErrors.confirmPassword}</p>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-market-orange py-3.5 text-[15px] font-bold text-white shadow-md shadow-[0_4px_14px_rgba(74,185,230,0.35)] hover:bg-market-orange-hover transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-market-orange focus-visible:ring-offset-2"
          >
            Create account
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-600">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-market-orange hover:text-market-orange-hover">
            Sign in
          </Link>
        </p>

        <p className="mt-6 text-center">
          <button
            type="button"
            onClick={() => navigate('/admin-register')}
            className="text-sm font-medium text-slate-500 hover:text-slate-700"
          >
            Administrator registration
          </button>
        </p>

        <p className="mt-6 text-center text-[11px] text-slate-400">
          By continuing, you agree to fair use of the platform for educational purposes.
        </p>
      </div>
    </AuthLayout>
  );
}

export default RegisterPage;
