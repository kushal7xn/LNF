import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from '../config/axios';

const MyItems = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyItems();
  }, []);

  const fetchMyItems = async () => {
    try {
      const response = await axios.get('/api/items/user/mine');
      setItems(response.data);
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      pending: 'status-pending',
      approved: 'status-approved',
      rejected: 'status-rejected'
    };
    
    return <span className={`status-badge ${statusClasses[status]}`}>{status.toUpperCase()}</span>;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return <div className="loading">Loading your items...</div>;
  }

  return (
    <div className="my-items-page">
      <div className="container">
        <div className="page-header">
          <h2>My Posted Items</h2>
          <Link to="/post" className="post-new-btn">Post New Item</Link>
        </div>

        {items.length === 0 ? (
          <div className="no-items">
            <p>You haven't posted any items yet.</p>
            <Link to="/post">Post your first found item</Link>
          </div>
        ) : (
          <div className="items-list">
            {items.map(item => (
              <div key={item.id} className="item-row">
                <div className="item-main">
                  {item.photo_url && (
                    <img 
                      src={`http://localhost:5000${item.photo_url}`} 
                      alt={item.category}
                      className="item-thumbnail"
                    />
                  )}
                  <div className="item-details">
                    <h4>{item.category} - {item.color}</h4>
                    <p><strong>Location:</strong> {item.location_found}</p>
                    <p><strong>Date found:</strong> {formatDate(item.date_found)}</p>
                    <p><strong>Posted:</strong> {formatDate(item.created_at)}</p>
                  </div>
                </div>

                <div className="item-status">
                  {getStatusBadge(item.status)}

                  {item.status === 'pending' && (
                    <p className="pending-review-note">
                      This listing is awaiting admin approval and won’t appear in public search until it’s approved.
                    </p>
                  )}
                  
                  {item.status === 'rejected' && item.rejection_reason && (
                    <div className="rejection-reason">
                      <strong>Reason:</strong> {item.rejection_reason}
                    </div>
                  )}
                  
                  {item.status === 'approved' && (
                    <div className="item-stats">
                      {item.claimed_by && item.verified_correct ? (
                        <div className="claimed-status">
                          ✅ Claimed & Verified
                          {item.returned ? (
                            <div className="returned-status">📦 Returned</div>
                          ) : (
                            <Link to={`/messages/${item.id}`} className="message-btn">
                              💬 Messages
                            </Link>
                          )}
                        </div>
                      ) : item.claimed_by ? (
                        <div className="pending-verification">
                          ⏳ Claim pending verification
                        </div>
                      ) : (
                        <div className="available-status">
                          🔍 Available for claims
                          <Link to={`/item/${item.id}`} className="view-btn">View Public Page</Link>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyItems;
