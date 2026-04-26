import { useEffect, useState } from 'react';
import axios from 'axios';
import { Navigate } from 'react-router-dom';

function UserRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    axios.get('http://localhost:5000/api/auth/session', { withCredentials: true })
      .then(() => setIsAuthenticated(true))
      .catch(() => setIsAuthenticated(false));
  }, []);

  if (isAuthenticated === null) return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading...</div>;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

export default UserRoute;
