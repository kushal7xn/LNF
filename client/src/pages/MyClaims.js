import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from '../config/axios';

const MyClaims = () => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyClaims();
  }, []);

  const fetchMyClaims = async () => {
    try {
      const response = await axios.get('/api/claims/mine');
      setClaims(response.data);
    } catch (error) {
      console.error('Error fetching claims:', error);
    } finally {
      setLoading(false);
    }
  };

  const getClaimStatus = (claim) => {
    if (claim.is_correct === null) {
      return <span className="status-badge status-pending">PENDING REVIEW</span>;
    } else if (claim.is_correct) {
      return <span className="status-badge status-approved">VERIFIED CORRECT</span>;
    } else {
      return <span className="status-badge status-rejected">INCORRECT</span>;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return <div className="loading">Loading your claims...</div>;
  }

  // Group claims by item
  const groupedClaims = claims.reduce((acc, claim) => {
    if (!acc[claim.item_id]) {
      acc[claim.item_id] = {
        item: {
          id: claim.item_id,
          category: claim.category,
          color: claim.color,
          location_found: claim.location_found,
          date_found: claim.date_found,
          photo_url: claim.photo_url,
          status: claim.item_status,
          returned: claim.returned
        },
        claims: []
      };
    }
    acc[claim.item_id].claims.push(claim);
    return acc;
  }, {});

  return (
    <div className="my-claims-page">
      <div className="container">
        <h2>My Claims</h2>

        {Object.keys(groupedClaims).length === 0 ? (
          <div className="no-claims">
            <p>You haven't made any claims yet.</p>
            <Link to="/">Search for items to claim</Link>
          </div>
        ) : (
          <div className="claims-list">
            {Object.values(groupedClaims).map(group => (
              <div key={group.item.id} className="claim-group">
                <div className="item-header">
                  <div className="item-info">
                    {group.item.photo_url && (
                      <img 
                        src={`http://localhost:5000${group.item.photo_url}`} 
                        alt={group.item.category}
                        className="item-thumbnail"
                      />
                    )}
                    <div>
                      <h4>{group.item.category} - {group.item.color}</h4>
                      <p><strong>Found at:</strong> {group.item.location_found}</p>
                      <p><strong>Date found:</strong> {formatDate(group.item.date_found)}</p>
                      <Link to={`/item/${group.item.id}`} className="view-item-btn">
                        View Item Details
                      </Link>
                    </div>
                  </div>

                  {/* Show overall status */}
                  <div className="item-claim-status">
                    {group.claims.some(c => c.is_correct === true) ? (
                      <div className="verified-claim">
                        ✅ Your claim was verified!
                        {group.item.returned ? (
                          <div className="returned-status">📦 Item returned</div>
                        ) : (
                          <Link to={`/messages/${group.item.id}`} className="message-btn">
                            💬 Contact Finder
                          </Link>
                        )}
                      </div>
                    ) : group.claims.some(c => c.is_correct === null) ? (
                      <div className="pending-status">⏳ Verification pending</div>
                    ) : (
                      <div className="rejected-status">❌ Claim not verified</div>
                    )}
                  </div>
                </div>

                <div className="claims-history">
                  <h5>Claim Attempts ({group.claims.length}/5)</h5>
                  <div className="claims-list-inner">
                    {group.claims.map((claim, index) => (
                      <div key={claim.id} className="claim-attempt">
                        <div className="claim-header">
                          <span className="attempt-number">Attempt #{index + 1}</span>
                          <span className="claim-date">{formatDateTime(claim.created_at)}</span>
                          {getClaimStatus(claim)}
                        </div>
                        <div className="claim-answer">
                          <strong>Your answer:</strong> {claim.answer}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyClaims;