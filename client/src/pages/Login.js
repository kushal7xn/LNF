import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { loginLostUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');
    setLoading(true);

    try {
      const result = await loginLostUser(email, password);
      if (result.success) {
        navigate('/');
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Invalid email or password'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="login-page">
      <div className="login-card login-lost">
        <aside className="login-story">
          <Link to="/" className="login-brand"><span className="brand-mark">↗</span> wayback</Link>
          <div className="login-art" aria-hidden="true"><span className="login-art-orbit" /><span className="login-art-token">✳</span><span className="login-art-card">FOUND<br /><i>with care</i></span></div>
          <div className="login-story-copy"><span className="login-kicker">A LITTLE HOPE, RIGHT HERE</span><h1>Somewhere,<br /><em>it’s waiting.</em></h1><p>Find the thing you lost, and the person who took the time to bring it back.</p></div>
          <div className="login-story-foot"><span>01 / 03</span><span>Lost & found, found again</span></div>
        </aside>
        <div className="login-panel">
          <div className="login-panel-heading"><span className="login-icon">⌕</span><span className="login-kicker">WELCOME BACK</span><h2>Find your way back.</h2><p>Sign in to see whether your lost item has been found.</p></div>

        {error && <div className="error-message" role="alert">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="lost-login-email">Email address</label>
            <input
              id="lost-login-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="lost-login-password">Password</label>
            <input
              id="lost-login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" disabled={loading} className="login-submit">
            {loading ? 'Signing you in…' : 'Sign in'} <span aria-hidden="true">→</span>
          </button>
        </form>

        <div className="login-switch">New to Wayback? <Link to="/register">Create an account</Link></div>
        <div className="login-alt"><span>Found something instead?</span><Link to="/finder/login">Sign in as a finder <span>↗</span></Link></div>
        <Link to="/admin/login" className="login-admin-link">Administrator sign in</Link>
      </div>
    </div>
    </section>
  );
};

export default Login;
