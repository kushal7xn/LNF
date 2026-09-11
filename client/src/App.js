import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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


function App() {
  return (
    <AuthProvider>

      <Router>

        <div className="App">

          <Navbar />

          <main className="main-content">

            <Routes>

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

          </main>

        </div>

      </Router>

    </AuthProvider>
  );
}

export default App;
