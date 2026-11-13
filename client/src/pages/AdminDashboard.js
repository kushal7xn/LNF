import React, { useState, useEffect } from 'react';
import axios from '../config/axios';

const AdminDashboard = () => {
  const [stats, setStats] = useState({});
  const [pendingItems, setPendingItems] = useState([]);
  const [pendingClaims, setPendingClaims] = useState([]);
  const [manualResolutions, setManualResolutions] = useState([]);
  const [activeTab, setActiveTab] = useState('items');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, itemsRes, claimsRes, resolutionsRes] = await Promise.all([
        axios.get('/api/admin/stats'),
        axios.get('/api/admin/pending'),
        axios.get('/api/admin/claims'),
        axios.get('/api/admin/manual-resolutions')
      ]);

      setStats(statsRes.data);
      setPendingItems(itemsRes.data);
      setPendingClaims(claimsRes.data);
      setManualResolutions(resolutionsRes.data);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveClaim = async (itemId, claimId) => {
    if (!window.confirm('Choose this claimant for the handover?')) return;
    try {
      await axios.post(`/api/admin/resolve-claim/${itemId}`, { claim_id: claimId });
      fetchDashboardData();
    } catch (error) {
      alert('Error resolving claim: ' + (error.response?.data?.error || 'Unknown error'));
    }
  };

  const handleApproveItem = async (itemId) => {
    try {
      await axios.post(`/api/admin/approve/${itemId}`);
      fetchDashboardData(); // Refresh data
    } catch (error) {
      alert('Error approving item: ' + (error.response?.data?.error || 'Unknown error'));
    }
  };

  const handleRejectItem = async (itemId) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    try {
      await axios.post(`/api/admin/reject/${itemId}`, { reason });
      fetchDashboardData(); // Refresh data
    } catch (error) {
      alert('Error rejecting item: ' + (error.response?.data?.error || 'Unknown error'));
    }
  };

  const handleVerifyClaim = async (attemptId, isCorrect) => {
    const action = isCorrect ? 'approve' : 'reject';
    if (!window.confirm(`Are you sure you want to ${action} this claim?`)) return;

    try {
      const response = await axios.post(`/api/admin/verify-claim/${attemptId}`, {
        is_correct: isCorrect
      });

      if (response.data.requires_manual_resolution) {
        alert('Multiple correct claims detected for this item. Please review manually.');
      }

      fetchDashboardData(); // Refresh data
    } catch (error) {
      if (error.response?.data?.requires_manual_resolution) {
        alert('Multiple correct claims detected for this item. Please review manually and contact support.');
      } else {
        alert('Error verifying claim: ' + (error.response?.data?.error || 'Unknown error'));
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return <div className="loading">Loading admin dashboard...</div>;
  }

  return (
    <div className="admin-dashboard">
      <div className="container">
        <h2>Admin Dashboard</h2>

        {/* Statistics */}
        <div className="admin-stats">
          <div className="stat-card">
            <h4>Pending Items</h4>
            <div className="stat-number">{stats.pending || 0}</div>
          </div>
          <div className="stat-card">
            <h4>Approved Items</h4>
            <div className="stat-number">{stats.approved || 0}</div>
          </div>
          <div className="stat-card">
            <h4>Claimed Items</h4>
            <div className="stat-number">{stats.claimed || 0}</div>
          </div>
          <div className="stat-card">
            <h4>Returned Items</h4>
            <div className="stat-number">{stats.returned || 0}</div>
          </div>
          <div className="stat-card">
            <h4>Pending Verifications</h4>
            <div className="stat-number">{stats.pending_verifications || 0}</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="admin-tabs">
          <button 
            className={`tab-btn ${activeTab === 'items' ? 'active' : ''}`}
            onClick={() => setActiveTab('items')}
          >
            Pending Items ({pendingItems.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'claims' ? 'active' : ''}`}
            onClick={() => setActiveTab('claims')}
          >
            Pending Claims ({pendingClaims.length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'resolution' ? 'active' : ''}`}
            onClick={() => setActiveTab('resolution')}
          >
            Manual Resolution ({manualResolutions.length})
          </button>
        </div>

        {/* Pending Items Tab */}
        {activeTab === 'items' && (
          <div className="admin-section">
            <h3>Items Awaiting Approval</h3>
            {pendingItems.length === 0 ? (
              <p>No pending items to review.</p>
            ) : (
              <div className="admin-items-list">
                {pendingItems.map(item => (
                  <div key={item.id} className="admin-item-card">
                    <div className="item-header">
                      <h4>{item.category} - {item.color}</h4>
                      <div className="item-meta">
                        Posted by {item.finder_username} ({item.finder_email})
                        <br />
                        {formatDateTime(item.created_at)}
                      </div>
                    </div>

                    <div className="item-details">
                      {item.photo_url && (
                        <img 
                          src={`http://localhost:5000${item.photo_url}`} 
                          alt={item.category}
                          className="admin-item-image"
                        />
                      )}
                      <div className="item-info">
                        <p><strong>Location found:</strong> {item.location_found}</p>
                        <p><strong>Date found:</strong> {formatDate(item.date_found)}</p>
                        <div className="secret-detail">
                          <strong>Secret detail:</strong>
                          <div className="secret-content">{item.secret_detail}</div>
                        </div>
                      </div>
                    </div>

                    <div className="admin-actions">
                      <button 
                        onClick={() => handleApproveItem(item.id)}
                        className="approve-btn"
                      >
                        ✅ Approve
                      </button>
                      <button 
                        onClick={() => handleRejectItem(item.id)}
                        className="reject-btn"
                      >
                        ❌ Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Pending Claims Tab */}
        {activeTab === 'claims' && (
          <div className="admin-section">
            <h3>Claims Awaiting Verification</h3>
            {pendingClaims.length === 0 ? (
              <p>No pending claims to verify.</p>
            ) : (
              <div className="admin-claims-list">
                {pendingClaims.map(claim => (
                  <div key={claim.id} className="admin-claim-card">
                    <div className="claim-header">
                      <h4>{claim.category} - {claim.color}</h4>
                      <div className="claim-meta">
                        Claimed by {claim.claimant_username}
                        <br />
                        Found by {claim.finder_username} at {claim.location_found}
                        <br />
                        Claim submitted: {formatDateTime(claim.created_at)}
                      </div>
                    </div>

                    <div className="claim-comparison">
                      <div className="answer-section">
                        <h5>Claimant's Answer:</h5>
                        <div className="answer-box claimant-answer">
                          {claim.answer}
                        </div>
                      </div>

                      <div className="secret-section">
                        <h5>Finder's Secret Detail:</h5>
                        <div className="answer-box secret-detail">
                          {claim.secret_detail}
                        </div>
                      </div>
                    </div>

                    <div className="verification-actions">
                      <button 
                        onClick={() => handleVerifyClaim(claim.id, true)}
                        className="correct-btn"
                      >
                        ✅ CORRECT - Approve Claim
                      </button>
                      <button 
                        onClick={() => handleVerifyClaim(claim.id, false)}
                        className="incorrect-btn"
                      >
                        ❌ INCORRECT - Reject Claim
                      </button>
                    </div>

                    <div className="verification-warning">
                      <strong>⚠️ Important:</strong> This is a binary decision. Compare the claimant's answer 
                      with the finder's secret detail. Only approve if they clearly match and demonstrate 
                      ownership of the item.
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'resolution' && (
          <div className="admin-section">
            <h3>Multiple Correct Claimants</h3>
            <p>Choose one verified claimant to continue to handover.</p>
            {manualResolutions.length === 0 ? <p>No manual resolutions required.</p> : (
              <div className="admin-claims-list">
                {manualResolutions.map(claim => (
                  <div key={claim.claim_id} className="admin-claim-card">
                    <h4>{claim.category} - {claim.color} (Item #{claim.item_id})</h4>
                    <p><strong>Claimant:</strong> {claim.claimant_username}</p>
                    <p><strong>Answer:</strong> {claim.answer}</p>
                    <button onClick={() => handleResolveClaim(claim.item_id, claim.claim_id)} className="correct-btn">
                      Choose this claimant
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
