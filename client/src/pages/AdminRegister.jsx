import { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import AuthLayout from '../components/AuthLayout';
import '../styles/wyzant.css';

axios.defaults.withCredentials = true;

const field =
  'w-full px-4 py-3 text-[15px] rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-market-orange/30 focus:border-market-orange';

function AdminRegister() {
  const navigate = useNavigate();
  const [enrolled, setEnrolled] = useState(false);
  const [enrollKey, setEnrollKey] = useState('');
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    phoneNumber: '',
    university: '',
  });

  const checkKey = () => {
    if (enrollKey === '1234') {
      setEnrolled(true);
      toast.success('Enrollment key verified.');
    } else {
      toast.error('Invalid enrollment key');
    }
  };

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      await axios.post(
        'http://localhost:5000/api/auth/register',
        { ...form, role: 'admin' },
        { withCredentials: true },
      );

      await axios.post(
        'http://localhost:5000/api/auth/login',
        { email: form.email, password: form.password },
        { withCredentials: true },
      );

      toast.success('Administrator account ready.');
      navigate('/admin-dashboard');
    } catch (err) {
      const data = err.response?.data;
      const message = data?.msg || data?.error || 'Registration or login failed';
      toast.error(typeof message === 'string' ? message : 'Registration failed');
    }
  };

  return (
    <AuthLayout
      panelTitle="Restricted access. Admin onboarding only."
      panelSubtitle="Use this flow only with an authorized enrollment key. All actions are logged for security and compliance."
      contentClassName="max-w-md"
    >
      <div className="rounded-2xl bg-white border border-slate-200/90 shadow-xl shadow-slate-200/40 p-8 sm:p-9">
        <div className="text-center mb-8">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Administrator registration</h2>
          <p className="mt-2 text-sm text-slate-600">Verify your key, then complete your profile.</p>
        </div>

        {!enrolled ? (
          <div className="space-y-4">
            <div>
              <label htmlFor="admin-key" className="block text-sm font-semibold text-slate-800 mb-1.5">
                Enrollment key
              </label>
              <input
                id="admin-key"
                type="password"
                placeholder="Enter key"
                value={enrollKey}
                onChange={e => setEnrollKey(e.target.value)}
                className={field}
                autoComplete="off"
              />
            </div>
            <button
              type="button"
              onClick={checkKey}
              className="w-full rounded-xl bg-slate-900 py-3.5 text-[15px] font-bold text-white hover:bg-slate-800 transition-colors"
            >
              Verify key
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="admin-username" className="block text-sm font-semibold text-slate-800 mb-1.5">
                Full name
              </label>
              <input
                id="admin-username"
                name="username"
                required
                onChange={handleChange}
                className={field}
                placeholder="Admin name"
              />
            </div>
            <div>
              <label htmlFor="admin-email" className="block text-sm font-semibold text-slate-800 mb-1.5">
                Email
              </label>
              <input
                id="admin-email"
                name="email"
                type="email"
                required
                onChange={handleChange}
                className={field}
                placeholder="admin@organization.edu"
              />
            </div>
            <div>
              <label htmlFor="admin-password" className="block text-sm font-semibold text-slate-800 mb-1.5">
                Password
              </label>
              <input
                id="admin-password"
                name="password"
                type="password"
                required
                onChange={handleChange}
                className={field}
                placeholder="••••••••"
              />
            </div>
            <div>
              <label htmlFor="admin-phone" className="block text-sm font-semibold text-slate-800 mb-1.5">
                Phone (10 digits)
              </label>
              <input
                id="admin-phone"
                name="phoneNumber"
                type="tel"
                inputMode="numeric"
                required
                onChange={handleChange}
                className={field}
                placeholder="0712345678"
              />
            </div>
            <div>
              <label htmlFor="admin-uni" className="block text-sm font-semibold text-slate-800 mb-1.5">
                Organization
              </label>
              <input
                id="admin-uni"
                name="university"
                type="text"
                required
                onChange={handleChange}
                className={field}
                placeholder="Institution or system name"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-xl bg-market-orange py-3.5 text-[15px] font-bold text-white shadow-md hover:bg-market-orange-hover transition-colors"
            >
              Register as administrator
            </button>
          </form>
        )}

        <p className="mt-8 text-center text-sm text-slate-600">
          <Link to="/login" className="font-semibold text-market-orange hover:text-market-orange-hover">
            Back to sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}

export default AdminRegister;
