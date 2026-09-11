import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from '../config/axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);


  // =====================================================
  // RESTORE LOGIN WHEN PAGE IS REFRESHED
  // =====================================================

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);

        setUser(parsedUser);

        axios.defaults.headers.common['Authorization'] =
          `Bearer ${token}`;

      } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        delete axios.defaults.headers.common['Authorization'];
      }
    }

    setLoading(false);
  }, []);


  // =====================================================
  // SAVE AUTHENTICATION DATA
  // =====================================================

  const saveAuthData = (user, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));

    axios.defaults.headers.common['Authorization'] =
      `Bearer ${token}`;

    setUser(user);
  };


  // =====================================================
  // FINDER LOGIN
  // =====================================================

  const loginFinder = async (email, password) => {
    try {
      const response = await axios.post(
        '/api/auth/finder/login',
        {
          email,
          password
        }
      );

      const { user, token } = response.data;

      saveAuthData(user, token);

      return {
        success: true
      };

    } catch (error) {
      return {
        success: false,
        error:
          error.response?.data?.error ||
          'Finder login failed'
      };
    }
  };


  // =====================================================
  // FINDER REGISTER
  // =====================================================

  const registerFinder = async (
    username,
    email,
    password
  ) => {
    try {
      const response = await axios.post(
        '/api/auth/finder/register',
        {
          username,
          email,
          password
        }
      );

      const { user, token } = response.data;

      saveAuthData(user, token);

      return {
        success: true
      };

    } catch (error) {
      return {
        success: false,
        error:
          error.response?.data?.error ||
          'Finder registration failed'
      };
    }
  };


  // =====================================================
  // LOST USER LOGIN
  // =====================================================

  const loginLostUser = async (email, password) => {
    try {
      const response = await axios.post(
        '/api/auth/lost/login',
        {
          email,
          password
        }
      );

      const { user, token } = response.data;

      saveAuthData(user, token);

      return {
        success: true
      };

    } catch (error) {
      return {
        success: false,
        error:
          error.response?.data?.error ||
          'Lost user login failed'
      };
    }
  };


  // =====================================================
  // LOST USER REGISTER
  // =====================================================

  const registerLostUser = async (
    username,
    email,
    password
  ) => {
    try {
      const response = await axios.post(
        '/api/auth/lost/register',
        {
          username,
          email,
          password
        }
      );

      const { user, token } = response.data;

      saveAuthData(user, token);

      return {
        success: true
      };

    } catch (error) {
      return {
        success: false,
        error:
          error.response?.data?.error ||
          'Lost user registration failed'
      };
    }
  };


  // =====================================================
  // ADMIN LOGIN
  // =====================================================

  const loginAdmin = async (email, password) => {
    try {
      const response = await axios.post(
        '/api/admin/login',
        {
          email,
          password
        }
      );

      const { user, token } = response.data;

      saveAuthData(user, token);

      return {
        success: true
      };

    } catch (error) {
      return {
        success: false,
        error:
          error.response?.data?.error ||
          'Admin login failed'
      };
    }
  };


  // =====================================================
  // LOGOUT
  // =====================================================

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    delete axios.defaults.headers.common['Authorization'];

    setUser(null);
  };


  // =====================================================
  // ROLE CHECKS
  // =====================================================

  const isAdmin = () => {
    return user?.role === 'admin';
  };

  const isFinder = () => {
    return user?.role === 'finder';
  };

  const isLostUser = () => {
    return user?.role === 'lost_user';
  };


  // =====================================================
  // CONTEXT VALUE
  // =====================================================

  const value = {
    user,

    // Finder
    loginFinder,
    registerFinder,
    isFinder,

    // Lost User
    loginLostUser,
    registerLostUser,
    isLostUser,

    // Admin
    loginAdmin,
    isAdmin,

    // Common
    logout,

    loading
  };


  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};