import { useEffect, useState } from 'react';
import axios from 'axios';
import { Navigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function AdminRoute({ children }) {
  const [isAdmin, setIsAdmin] = useState(null);

  useEffect(() => {
    axios.get('http://localhost:5000/api/auth/session', { withCredentials: true })
      .then((res) => {
        if (res.data.user && res.data.user.role === 'admin') {
          setIsAdmin(true);
        } else {
          toast.error('Admin access required');
          setIsAdmin(false);
        }
      })
      .catch(() => setIsAdmin(false));
  }, []);

  if (isAdmin === null) return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading...</div>;
  if (!isAdmin) return <Navigate to="/login" replace />;

  return (
    <>
      <ToastContainer position="top-center" autoClose={3000} />
      {children}
    </>
  );
}

export default AdminRoute;
