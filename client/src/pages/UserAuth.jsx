import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

axios.defaults.withCredentials = true;

const emailValid = value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());

function UserAuth() {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [role, setRole] = useState('student');
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const toggleForm = () => {
    setForm({ username: '', email: '', password: '', confirmPassword: '' });
    setErrors({});
    setIsLogin(!isLogin);
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const validateForm = () => {
    const next = {};
    
    if (!form.email?.trim() || !emailValid(form.email)) {
      next.email = 'Please enter a valid email';
    }
    
    if (!form.password || form.password.length < 6) {
      next.password = 'Password must be at least 6 characters';
    }
    
    if (!isLogin) {
      if (!form.username?.trim() || form.username.trim().length < 3) {
        next.username = 'Name must be at least 3 characters';
      }
      if (form.password !== form.confirmPassword) {
        next.confirmPassword = 'Passwords do not match';
      }
    }
    
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!validateForm()) return;
    
    try {
      if (isLogin) {
        const res = await axios.post('http://localhost:5000/api/auth/login', {
          email: form.email,
          password: form.password
        });
        const { user } = res.data;
        toast.success(`Welcome back, ${user.username}!`);
        
        if (user.role === 'admin') {
          navigate('/admin-dashboard');
        } else {
          navigate('/home');
        }
      } else {
        await axios.post('http://localhost:5000/api/auth/register', {
          username: form.username,
          email: form.email,
          password: form.password,
          role: role
        });
        toast.success('User registered successfully!');
        setIsLogin(true);
      }
    } catch (err) {
      const msg = err.response?.data?.msg || 'Error occurred';
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFFaf2] font-sans">
      <div className="bg-[#fffaf2cc] rounded-xl shadow-lg border border-[#d6a77a] max-w-md w-full p-8">
        <h3 className="text-2xl font-bold text-center text-[#7B3F00] mb-6">
          {isLogin ? 'User Login' : 'User Register'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div>
                <label className="block text-sm font-medium text-[#5c2c00] mb-1">
                  Full Name
                </label>
                <input
                  className="w-full px-4 py-2 border rounded-md border-[#D6A77A] bg-white focus:outline-none focus:ring-2 focus:ring-[#D6A77A]"
                  name="username"
                  placeholder="Username"
                  value={form.username}
                  onChange={handleChange}
                  required
                />
                {errors.username && (
                  <p className="mt-1 text-sm text-red-600">{errors.username}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#5c2c00] mb-2">
                  I am a…
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('student')}
                    className={`rounded-xl border-2 p-3 text-center transition-all ${
                      role === 'student'
                        ? 'border-[#7B3F00] bg-[#F1E1C6]'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <span className="text-xl block mb-1">👨‍🎓</span>
                    <span className="font-semibold text-[#7B3F00] text-sm">Student</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('tutor')}
                    className={`rounded-xl border-2 p-3 text-center transition-all ${
                      role === 'tutor'
                        ? 'border-[#7B3F00] bg-[#F1E1C6]'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <span className="text-xl block mb-1">🧑‍🏫</span>
                    <span className="font-semibold text-[#7B3F00] text-sm">Tutor</span>
                  </button>
                </div>
              </div>
            </>
          )}
          
          <div>
            <label className="block text-sm font-medium text-[#5c2c00] mb-1">
              Email
            </label>
            <input
              className="w-full px-4 py-2 border rounded-md border-[#D6A77A] bg-white focus:outline-none focus:ring-2 focus:ring-[#D6A77A]"
              type="email"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              required
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[#5c2c00] mb-1">
              Password
            </label>
            <input
              className="w-full px-4 py-2 border rounded-md border-[#D6A77A] bg-white focus:outline-none focus:ring-2 focus:ring-[#D6A77A]"
              type="password"
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              required
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password}</p>
            )}
          </div>
          
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-[#5c2c00] mb-1">
                Confirm Password
              </label>
              <input
                className="w-full px-4 py-2 border rounded-md border-[#D6A77A] bg-white focus:outline-none focus:ring-2 focus:ring-[#D6A77A]"
                type="password"
                name="confirmPassword"
                placeholder="Confirm Password"
                value={form.confirmPassword}
                onChange={handleChange}
                required
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>
          )}
          
          <button
            className="w-full py-3 bg-[#7B3F00] text-white font-semibold rounded-md hover:bg-[#5c2c00] transition-colors"
            type="submit"
          >
            {isLogin ? 'Login' : 'Register'}
          </button>
        </form>

        <div className="text-center mt-4">
          <small className="text-[#5c2c00]">
            {isLogin ? 'New user?' : 'Already registered?'}{' '}
            <button
              onClick={toggleForm}
              className="font-semibold text-[#7B3F00] underline hover:text-[#5c2c00]"
            >
              {isLogin ? 'Register here' : 'Login'}
            </button>
          </small>
        </div>

        <div className="text-center mt-3">
          <button
            onClick={() => navigate('/admin-register')}
            className="text-sm text-[#7B3F00] underline hover:text-[#5c2c00]"
          >
            Admin Registration
          </button>
        </div>
      </div>
    </div>
  );
}

export default UserAuth;