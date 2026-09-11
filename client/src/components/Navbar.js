import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout, isAdmin, isFinder, isLostUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          Lost & Found
        </Link>
        
        <div className="nav-menu">
          <Link to="/" className="nav-link">Search Items</Link>
          
          {user ? (
            <>
              {isFinder() && <>
                <Link to="/post" className="nav-link">Post Found Item</Link>
                <Link to="/my-items" className="nav-link">My Items</Link>
              </>}
              {isLostUser() && <Link to="/my-claims" className="nav-link">My Claims</Link>}
              {(isFinder() || isLostUser()) && <Link to="/handovers" className="nav-link">Handovers</Link>}
              {isAdmin() && (
                <Link to="/admin" className="nav-link admin-link">Admin</Link>
              )}
              <div className="nav-user">
                <span>Hello, {user.username}</span>
                <button onClick={handleLogout} className="logout-btn">Logout</button>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">Login</Link>
              <Link to="/register" className="nav-link">Register</Link>
              <Link to="/finder/login" className="nav-link">Finder Login</Link>
              <Link to="/admin/login" className="nav-link">Admin Login</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
