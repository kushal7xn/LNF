import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout, isAdmin, isFinder, isLostUser } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo"><span className="brand-mark">↗</span><span>wayback<small>LOST & FOUND, FOUND AGAIN</small></span></Link>
        <div className="nav-menu">
          <Link to="/" className="nav-link">Explore</Link>
          {user ? <>
            {isFinder() && <><Link to="/post" className="nav-link">Post an item</Link><Link to="/my-items" className="nav-link">My listings</Link></>}
            {isLostUser() && <Link to="/my-claims" className="nav-link">My claims</Link>}
            {(isFinder() || isLostUser()) && <Link to="/handovers" className="nav-link">Handovers</Link>}
            {isAdmin() && <Link to="/admin" className="nav-link">Admin</Link>}
            <div className="nav-user"><span className="nav-avatar">{(user.username || 'U').slice(0, 1).toUpperCase()}</span><span className="user-greeting">{user.username}</span><button onClick={handleLogout} className="logout-btn">Log out</button></div>
          </> : <>
            <Link to="/login" className="nav-link">I lost something</Link>
            <Link to="/finder/login" className="nav-link">I found something</Link>
            <Link to="/register" className="nav-join">Join the community <span>↗</span></Link>
            <Link to="/admin/login" className="admin-entry" aria-label="Admin login">•••</Link>
          </>}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
