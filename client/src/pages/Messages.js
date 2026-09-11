import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from '../config/axios';

const Messages = () => {
  const { itemId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [item, setItem] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const fetchMessages = useCallback(async () => {
    try {
      const response = await axios.get(`/api/messages/item/${itemId}`);
      setItem(response.data.item);
      setMessages(response.data.messages);
      setError('');
    } catch (error) {
      if (error.response?.status === 403) {
        setError('You are not authorized to view messages for this item.');
      } else {
        setError('Error loading messages');
      }
    } finally {
      setLoading(false);
    }
  }, [itemId]);

  useEffect(() => {
    fetchMessages();
    // Poll for new messages every 5 seconds
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      await axios.post(`/api/messages/item/${itemId}`, {
        content: newMessage.trim()
      });
      
      setNewMessage('');
      fetchMessages(); // Refresh messages
    } catch (error) {
      setError('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleMarkReturned = async () => {
    if (!window.confirm('Mark this item as successfully returned? This action cannot be undone and will close this conversation.')) {
      return;
    }

    try {
      await axios.post(`/api/messages/item/${itemId}/complete`);
      alert('Item marked as returned successfully!');
      navigate('/handovers');
    } catch (error) {
      alert('Error marking item as returned: ' + (error.response?.data?.error || 'Unknown error'));
    }
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return <div className="loading">Loading messages...</div>;
  }

  if (error && !item) {
    return (
      <div className="error-page">
        <h2>Access Denied</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/handovers')}>← Back to Handovers</button>
      </div>
    );
  }

  const isOwner = item && user && item.finder_id === user.id;
  const otherParty = isOwner ? 'claimant' : 'finder';

  return (
    <div className="messages-page">
      <div className="container">
        <div className="messages-header">
          <button onClick={() => navigate('/handovers')} className="back-btn">
            ← Back to Handovers
          </button>
          
          {item && (
            <div className="conversation-info">
              <h3>{item.category} - {item.color}</h3>
              <p><strong>Found at:</strong> {item.location_found}</p>
              <p><strong>Date found:</strong> {formatDate(item.date_found)}</p>
              <div className="participants">
                <span>Conversation between finder and verified claimant</span>
                {isOwner && (
                  <button onClick={handleMarkReturned} className="mark-returned-btn">
                    ✅ Mark as Returned
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="messages-container">
          <div className="messages-list">
            {messages.length === 0 ? (
              <div className="no-messages">
                <p>No messages yet. Start the conversation!</p>
                <div className="conversation-tips">
                  <h4>Tips for successful handover:</h4>
                  <ul>
                    <li>Agree on a safe, public meeting location</li>
                    <li>Set a specific time that works for both parties</li>
                    <li>Exchange contact information if needed</li>
                    <li>Verify the item details before handing over</li>
                  </ul>
                </div>
              </div>
            ) : (
              messages.map(message => (
                <div 
                  key={message.id} 
                  className={`message ${message.sender_id === user.id ? 'own-message' : 'other-message'}`}
                >
                  <div className="message-header">
                    <span className="sender">{message.sender_username}</span>
                    <span className="timestamp">{formatDateTime(message.created_at)}</span>
                  </div>
                  <div className="message-content">
                    {message.content}
                  </div>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleSendMessage} className="message-form">
            <div className="message-input-container">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={`Type your message to the ${otherParty}...`}
                disabled={sending}
                rows="3"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
              />
              <button type="submit" disabled={sending || !newMessage.trim()}>
                {sending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </form>

          {error && <div className="error-message">{error}</div>}
        </div>

        <div className="handover-guidelines">
          <h4>🔒 Safety Guidelines</h4>
          <ul>
            <li>Meet in a well-lit, public place</li>
            <li>Bring a friend if possible</li>
            <li>Trust your instincts - if something feels wrong, don't proceed</li>
            <li>Verify item details before completing the handover</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Messages;
