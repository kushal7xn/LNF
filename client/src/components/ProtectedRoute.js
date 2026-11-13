import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  // Not logged in
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If specific roles are required, check the user's role
  if (allowedRoles && !allowedRoles.includes(user.role)) {

    // Finder trying to access a Lost User page
    if (user.role === 'finder') {
      return <Navigate to="/finder/login" replace />;
    }

    // Lost User trying to access a Finder page
    if (user.role === 'lost_user') {
      return <Navigate to="/login" replace />;
    }

    // Anything else
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;