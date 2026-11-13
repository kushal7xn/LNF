import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminRoute = ({ children }) => {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  // Admin is not logged in
  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  // Logged-in user is not an admin
  if (!isAdmin()) {
    return <Navigate to="/" replace />;
  }

  // User is an admin
  return children;
};

export default AdminRoute;