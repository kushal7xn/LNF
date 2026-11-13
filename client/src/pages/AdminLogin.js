import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminLogin = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginAdmin } = useAuth();
  const navigate = useNavigate();

  const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await loginAdmin(formData.email, formData.password);
      if (result.success) navigate('/admin');
      else setError(result.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="login-page login-admin-page">
      <div className="login-card login-admin">
        <aside className="login-story">
          <Link to="/" className="login-brand"><span className="brand-mark">↗</span> wayback</Link>
          <div className="login-art" aria-hidden="true"><span className="login-art-orbit" /><span className="login-art-token">✳</span><span className="login-art-card">TRUST<br /><i>in good hands</i></span></div>
          <div className="login-story-copy"><span className="login-kicker">COMMUNITY CARE, BEHIND THE SCENES</span><h1>Keep every<br /><em>good thing going.</em></h1><p>Review reports, support safe handovers, and help this community return what matters.</p></div>
          <div className="login-story-foot"><span>03 / 03</span><span>Wayback administrator access</span></div>
        </aside>
        <div className="login-panel">
          <div className="login-panel-heading"><span className="login-icon">⌑</span><span className="login-kicker">RESTRICTED ACCESS</span><h2>Administrator sign in.</h2><p>Use your authorized administrator account to continue.</p></div>
          {error && <div className="error-message" role="alert">{error}</div>}
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group"><label htmlFor="admin-login-email">Email address</label><input type="email" id="admin-login-email" name="email" autoComplete="username" value={formData.email} onChange={handleChange} required disabled={loading} /></div>
            <div className="form-group"><label htmlFor="admin-login-password">Password</label><input type="password" id="admin-login-password" name="password" autoComplete="current-password" value={formData.password} onChange={handleChange} required disabled={loading} /></div>
            <button type="submit" disabled={loading} className="login-submit">{loading ? 'Checking access…' : 'Sign in securely'} <span aria-hidden="true">→</span></button>
          </form>
          <div className="login-admin-note"><span>◇</span> This area is only for authorized administrators.</div>
          <div className="login-switch"><Link to="/">← Back to Wayback</Link></div>
          <div className="login-alt"><span>Here to find or return an item?</span><Link to="/login">Community sign in <span>↗</span></Link></div>
        </div>
      </div>
    </section>
  );
};

export default AdminLogin;
