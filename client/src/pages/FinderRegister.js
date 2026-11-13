import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const FinderRegister = () => {

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { registerFinder } = useAuth();
  const navigate = useNavigate();


  const handleChange = (e) => {

    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });

  };


  const handleSubmit = async (e) => {

    e.preventDefault();

    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    const result = await registerFinder(
      formData.username,
      formData.email,
      formData.password
    );

    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
    }

    setLoading(false);
  };


  return (
    <div className="auth-page">

      <div className="auth-container">

        <h2>Finder Registration</h2>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}


        <form onSubmit={handleSubmit} className="auth-form">

          <div className="form-group">

            <label>Username:</label>

            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              disabled={loading}
            />

          </div>


          <div className="form-group">

            <label>Email:</label>

            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
            />

          </div>


          <div className="form-group">

            <label>Password:</label>

            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength="6"
              disabled={loading}
            />

          </div>


          <div className="form-group">

            <label>Confirm Password:</label>

            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              disabled={loading}
            />

          </div>


          <button
            type="submit"
            disabled={loading}
            className="auth-button"
          >
            {loading
              ? 'Creating account...'
              : 'Register as Finder'}
          </button>

        </form>


        <div className="auth-links">

          <p>
            Already have a finder account?{' '}
            <Link to="/finder/login">
              Finder Login
            </Link>
          </p>

          <p>
            Looking for a lost item?{' '}
            <Link to="/register">
              Lost User Registration
            </Link>
          </p>

        </div>

      </div>

    </div>
  );
};

export default FinderRegister;