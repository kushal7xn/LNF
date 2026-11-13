import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from '../config/axios';

const ItemDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [item, setItem] = useState(null);
  const [claimInfo, setClaimInfo] = useState(null);
  const [claimAnswer, setClaimAnswer] = useState('');
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchItem = useCallback(async () => {
    try {
      const response = await axios.get(`/api/items/${id}`);
      setItem(response.data);
    } catch (error) {
      setError('Item not found or not approved');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchClaimInfo = useCallback(async () => {
    try {
      const response = await axios.get(`/api/claims/item/${id}/can-claim`);
      setClaimInfo(response.data);
    } catch (error) {
      console.error('Error fetching claim info:', error);
    }
  }, [id]);

  useEffect(() => {
    fetchItem();
    if (user) {
      fetchClaimInfo();
    }
  }, [fetchClaimInfo, fetchItem, user]);

  const handleClaim = async (e) => {
    e.preventDefault();
    if (!claimAnswer.trim()) {
      setError('Please provide an answer');
      return;
    }

    setClaiming(true);
    setError('');
    setSuccess('');

    try {
      await axios.post(`/api/claims/${id}`, {
        answer: claimAnswer
      });

      setSuccess('Claim submitted successfully! An admin will verify your answer.');
      setClaimAnswer('');
      
      // Refresh claim info
      fetchClaimInfo();
      
    } catch (error) {
      if (error.response?.data?.max_attempts_reached) {
        setError(`Maximum attempts reached. You cannot claim this item anymore.`);
      } else if (error.response?.data?.pending_verification) {
        setError('You already have a pending claim for this item.');
      } else {
        setError(error.response?.data?.error || 'Failed to submit claim');
      }
    } finally {
      setClaiming(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return <div className="loading">Loading item details...</div>;
  }

  if (error && !item) {
    return (
      <div className="error-page">
        <h2>Item Not Found</h2>
        <p>{error}</p>
        <Link to="/">← Back to Search</Link>
      </div>
    );
  }

  return (
    <div className="item-details-page">
      <div className="container">
        <Link to="/" className="back-link">← Back to Search</Link>
        
        <div className="item-details">
          <h2>{item.category} - {item.color}</h2>
          
          <div className="item-content">
            {item.photo_url && (
              <div className="item-photo">
                <img 
                  src={`http://localhost:5000${item.photo_url}`} 
                  alt={item.category}
                />
              </div>
            )}
            
            <div className="item-info">
              <div className="info-row">
                <strong>Category:</strong> {item.category}
              </div>
              <div className="info-row">
                <strong>Color:</strong> {item.color}
              </div>
              <div className="info-row">
                <strong>Found at:</strong> {item.location_found}
              </div>
              <div className="info-row">
                <strong>Date found:</strong> {formatDate(item.date_found)}
              </div>
              <div className="info-row">
                <strong>Posted on:</strong> {formatDate(item.created_at)}
              </div>
            </div>
          </div>

          {user?.role === 'lost_user' ? (
            <div className="claim-section">
              <h3>Think this is your item?</h3>
              
              {claimInfo && claimInfo.max_attempts_reached ? (
                <div className="max-attempts-warning">
                  You have reached the maximum number of claim attempts (5) for this item.
                </div>
              ) : (
                <>
                  {claimInfo && (
                    <div className="claim-info">
                      <p>Attempts used: {claimInfo.attempts_used} / {claimInfo.max_attempts}</p>
                      <p>Remaining attempts: {claimInfo.remaining_attempts}</p>
                    </div>
                  )}
                  
                  <form onSubmit={handleClaim} className="claim-form">
                    <div className="form-group">
                      <label htmlFor="claimAnswer">Enter the secret detail you believe identifies this item:</label>
                      <textarea
                        id="claimAnswer"
                        value={claimAnswer}
                        onChange={(e) => setClaimAnswer(e.target.value)}
                        placeholder="Enter your answer"
                        required
                        disabled={claiming}
                        rows="4"
                      />
                    </div>
                    
                    <button type="submit" disabled={claiming || !claimInfo?.can_claim}>
                      {claiming ? 'Submitting Claim...' : 'Submit Claim'}
                    </button>
                  </form>
                </>
              )}

              {error && <div className="error-message">{error}</div>}
              {success && <div className="success-message">{success}</div>}
              
              <div className="claim-warning">
                <p><strong>Important:</strong></p>
                <ul>
                  <li>Only provide details that genuinely prove you own this item</li>
                  <li>You have a maximum of 5 attempts to claim any item</li>
                  <li>False claims may result in account suspension</li>
                  <li>An admin will verify your answer before approving the claim</li>
                </ul>
              </div>
            </div>
          ) : user ? (
            <div className="login-prompt"><p>Only Lost Users can submit claims for items.</p></div>
          ) : (
            <div className="login-prompt">
              <p>You must be logged in to claim items.</p>
              <Link to="/login">Login</Link> or <Link to="/register">Register</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ItemDetails;
