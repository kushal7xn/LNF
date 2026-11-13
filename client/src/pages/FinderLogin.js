import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const FinderLogin = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginFinder } = useAuth();
  const navigate = useNavigate();

  const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await loginFinder(formData.email, formData.password);
      if (result.success) navigate('/');
      else setError(result.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="login-page">
      <div className="login-card login-finder">
        <aside className="login-story">
          <Link to="/" className="login-brand"><span className="brand-mark">↗</span> wayback</Link>
          <div className="login-art" aria-hidden="true"><span className="login-art-orbit" /><span className="login-art-token">✳</span><span className="login-art-card">FOUND<br /><i>with care</i></span></div>
          <div className="login-story-copy"><span className="login-kicker">A KINDNESS THAT COMES AROUND</span><h1>You found it.<br /><em>Now let’s reunite it.</em></h1><p>Good people make this community work. Sign in and help one more thing find its way home.</p></div>
          <div className="login-story-foot"><span>02 / 03</span><span>Lost & found, found again</span></div>
        </aside>
        <div className="login-panel">
          <div className="login-panel-heading"><span className="login-icon">✳</span><span className="login-kicker">THE GOOD THING YOU DID</span><h2>Welcome, finder.</h2><p>Sign in to manage your found-item listings and handovers.</p></div>
          {error && <div className="error-message" role="alert">{error}</div>}
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group"><label htmlFor="finder-login-email">Email address</label><input type="email" id="finder-login-email" name="email" autoComplete="email" value={formData.email} onChange={handleChange} required disabled={loading} /></div>
            <div className="form-group"><label htmlFor="finder-login-password">Password</label><input type="password" id="finder-login-password" name="password" autoComplete="current-password" value={formData.password} onChange={handleChange} required disabled={loading} /></div>
            <button type="submit" disabled={loading} className="login-submit">{loading ? 'Signing you in…' : 'Sign in'} <span aria-hidden="true">→</span></button>
          </form>
          <div className="login-switch">New to Wayback? <Link to="/finder/register">Create a finder account</Link></div>
          <div className="login-alt"><span>Looking for something you lost?</span><Link to="/login">Sign in as a lost user <span>↗</span></Link></div>
        </div>
      </div>
    </section>
  );
};

export default FinderLogin;
