import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from '../config/axios';

const Handovers = () => {
  const [handovers, setHandovers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHandovers();
  }, []);

  const fetchHandovers = async () => {
    try {
      const response = await axios.get('/api/messages/handovers');
      setHandovers(response.data);
    } catch (error) {
      console.error('Error fetching handovers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkReturned = async (itemId) => {
    if (!window.confirm('Mark this item as successfully returned? This action cannot be undone.')) {
      return;
    }

    try {
      await axios.post(`/api/messages/item/${itemId}/complete`);
      // Refresh the list
      fetchHandovers();
    } catch (error) {
      alert('Error marking item as returned: ' + (error.response?.data?.error || 'Unknown error'));
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return <div className="loading">Loading handovers...</div>;
  }

  return (
    <div className="handovers-page">
      <div className="container">
        <h2>Active Handovers</h2>
        <p className="page-description">
          Items with verified claims ready for handover between finder and claimant.
        </p>

        {handovers.length === 0 ? (
          <div className="no-handovers">
            <p>No active handovers at the moment.</p>
            {/* Show different messages based on user role */}
            <div className="handover-help">
              <h4>How handovers work:</h4>
              <ul>
                <li><strong>As a finder:</strong> When someone's claim is verified by admin, you can communicate here to arrange pickup</li>
                <li><strong>As a claimant:</strong> When your claim is verified, you can contact the finder to arrange pickup</li>
                <li><strong>Mark as returned:</strong> Only the finder can mark an item as successfully returned</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="handovers-list">
            {handovers.map(item => (
              <div key={item.id} className="handover-card">
                <div className="handover-header">
                  {item.photo_url && (
                    <img 
                      src={`http://localhost:5000${item.photo_url}`} 
                      alt={item.category}
                      className="item-thumbnail"
                    />
                  )}
                  <div className="item-info">
                    <h4>{item.category} - {item.color}</h4>
                    <p><strong>Found at:</strong> {item.location_found}</p>
                    <p><strong>Date found:</strong> {formatDate(item.date_found)}</p>
                  </div>
                  <div className="role-badge">
                    You are the {item.user_role}
                  </div>
                </div>

                <div className="handover-participants">
                  <div className="participant">
                    <strong>Finder:</strong> {item.finder_username}
                  </div>
                  <div className="participant">
                    <strong>Claimant:</strong> {item.claimant_username}
                  </div>
                </div>

                <div className="handover-actions">
                  <Link to={`/messages/${item.id}`} className="message-btn">
                    💬 Open Chat
                  </Link>
                  
                  {item.user_role === 'finder' && !item.returned && (
                    <button 
                      onClick={() => handleMarkReturned(item.id)}
                      className="mark-returned-btn"
                    >
                      ✅ Mark as Returned
                    </button>
                  )}

                  {item.returned && (
                    <span className="returned-badge">📦 Completed</span>
                  )}
                </div>

                <div className="handover-status">
                  {item.returned ? (
                    <div className="status-completed">
                      ✅ Item successfully returned on {formatDate(item.updated_at)}
                    </div>
                  ) : (
                    <div className="status-active">
                      🔄 Handover in progress - Use chat to coordinate pickup
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

export default Handovers;