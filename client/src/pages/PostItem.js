import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../config/axios';

const PostItem = () => {
  const [formData, setFormData] = useState({
    category: '',
    color: '',
    location_found: '',
    date_found: '',
    secret_detail: ''
  });
  const [photo, setPhoto] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePhotoChange = (e) => {
    setPhoto(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const submitData = new FormData();
    Object.keys(formData).forEach(key => {
      submitData.append(key, formData[key]);
    });
    
    if (photo) {
      submitData.append('photo', photo);
    }

    try {
      await axios.post('/api/items', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setSuccess('Item posted successfully! It will be visible after admin approval.');
      
      // Reset form
      setFormData({
        category: '',
        color: '',
        location_found: '',
        date_found: '',
        secret_detail: ''
      });
      setPhoto(null);
      
      // Navigate to my items page after a delay
      setTimeout(() => {
        navigate('/my-items');
      }, 2000);

    } catch (error) {
      setError(error.response?.data?.error || 'Failed to post item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="post-item-page">
      <div className="container">
        <h2>Post a Found Item</h2>
        <p className="instruction">
          Fill out all the details about the item you found. Include a secret detail that only 
          the real owner would know - this helps verify legitimate claims.
        </p>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleSubmit} className="post-form">
          <div className="form-group">
            <label htmlFor="category">Item Category *</label>
            <input
              type="text"
              id="category"
              name="category"
              placeholder="e.g., Phone, Keys, Wallet, Jewelry"
              value={formData.category}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="color">Color *</label>
            <input
              type="text"
              id="color"
              name="color"
              placeholder="e.g., Black, Red, Silver"
              value={formData.color}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="location_found">Location Found *</label>
            <input
              type="text"
              id="location_found"
              name="location_found"
              placeholder="e.g., Central Park near the fountain, Mall food court"
              value={formData.location_found}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="date_found">Date Found *</label>
            <input
              type="date"
              id="date_found"
              name="date_found"
              value={formData.date_found}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="photo">Photo</label>
            <input
              type="file"
              id="photo"
              accept="image/*"
              onChange={handlePhotoChange}
              disabled={loading}
            />
            <small>Upload a photo of the item (optional, but recommended)</small>
          </div>

          <div className="form-group secret-detail">
            <label htmlFor="secret_detail">Secret Identifying Detail *</label>
            <textarea
              id="secret_detail"
              name="secret_detail"
              placeholder="Describe a detail only the real owner would know (e.g., serial number, contents of a wallet, unique scratches, engravings, etc.)"
              value={formData.secret_detail}
              onChange={handleChange}
              required
              disabled={loading}
              rows="4"
            />
            <div className="secret-warning">
              ⚠️ This detail will NEVER be shown publicly. Only admins can see this to verify claims.
            </div>
          </div>

          <button type="submit" disabled={loading} className="submit-button">
            {loading ? 'Posting Item...' : 'Post Found Item'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PostItem;