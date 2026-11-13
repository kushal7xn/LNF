import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

import Navbar from './components/Navbar';

import AdminLogin from './pages/AdminLogin';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';

import FinderLogin from './pages/FinderLogin';
import FinderRegister from './pages/FinderRegister';

import PostItem from './pages/PostItem';
import ItemDetails from './pages/ItemDetails';

import AdminDashboard from './pages/AdminDashboard';

import MyItems from './pages/MyItems';
import MyClaims from './pages/MyClaims';
import Handovers from './pages/Handovers';
import Messages from './pages/Messages';

import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

import './App.css';


function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const handleInternalNavigation = (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const anchor = event.target.closest?.('a[href]');
    if (!anchor || anchor.target || anchor.hasAttribute('download')) return;

    const destination = new URL(anchor.href, window.location.href);
    if (destination.origin !== window.location.origin) return;
    if (destination.pathname === location.pathname && destination.search === location.search) return;

    event.preventDefault();
    event.stopPropagation();
    navigate(`${destination.pathname}${destination.search}${destination.hash}`, { viewTransition: true });
  };

  return (
    <div className="App" onClickCapture={handleInternalNavigation}>
      <Navbar />
      <main className="main-content">
        <div key={location.pathname} className="route-content">
          <Routes location={location}>

              {/* =========================
                  HOME
              ========================= */}

              <Route
                path="/"
                element={<Home />}
              />


              {/* =========================
                  LOST USER AUTHENTICATION
              ========================= */}

              <Route
                path="/login"
                element={<Login />}
              />

              <Route
                path="/register"
                element={<Register />}
              />


              {/* =========================
                  FINDER AUTHENTICATION
              ========================= */}

              <Route
                path="/finder/login"
                element={<FinderLogin />}
              />

              <Route
                path="/finder/register"
                element={<FinderRegister />}
              />


              {/* =========================
                  PUBLIC ITEM DETAILS
              ========================= */}

              <Route
                path="/item/:id"
                element={<ItemDetails />}
              />


              {/* =========================
                  FINDER - POST ITEM
              ========================= */}

              <Route path="/post" element={
                <ProtectedRoute allowedRoles={['finder']}>
                  <PostItem />
                </ProtectedRoute>
              } />


              {/* =========================
                  FINDER - MY ITEMS
              ========================= */}

              <Route path="/my-items" element={
                <ProtectedRoute allowedRoles={['finder']}>
                  <MyItems />
                </ProtectedRoute>
              } />


              {/* =========================
                  LOST USER - MY CLAIMS
              ========================= */}

              <Route path="/my-claims" element={
                <ProtectedRoute allowedRoles={['lost_user']}>
                  <MyClaims />
                </ProtectedRoute>
              } />


              {/* =========================
                  HANDOVERS
              ========================= */}

              <Route path="/messages/:itemId" element={
                <ProtectedRoute>
                  <Messages />
                </ProtectedRoute>
              } />


              {/* =========================
                  MESSAGES
              ========================= */}

              <Route
                path="/handovers"
                element={
                  <ProtectedRoute allowedRoles={['finder', 'lost_user']}>
                    <Handovers />
                  </ProtectedRoute>
                }
              />


              {/* =========================
                  ADMIN
              ========================= */}

              <Route
                path="/admin/login"
                element={<AdminLogin />}
              />
              
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                }
              />

          </Routes>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppLayout />
      </Router>
    </AuthProvider>
  );
}

export default App;
