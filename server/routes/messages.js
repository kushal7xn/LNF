const express = require('express');
const db = require('../database');
const { authenticateToken, requireFinder, requireLostUser } = require('../middleware/auth');

const router = express.Router();

// Get messages for a verified handover
router.get('/item/:itemId', authenticateToken, (req, res) => {
  const itemId = req.params.itemId;
  const userId = req.user.id;

  // First check if user is authorized to see messages for this item
  db.get(
    `SELECT i.*, ca.user_id as claimant_id
     FROM items i
     LEFT JOIN claim_attempts ca ON i.id = ca.item_id AND ca.user_id = i.claimed_by
     WHERE i.id = ? AND i.verified_correct = 1 AND i.manual_resolution = 0
     AND (i.finder_id = ? OR ca.user_id = ?)`,
    [itemId, userId, userId],
    (err, item) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to check authorization' });
      }

      if (!item) {
        return res.status(403).json({ error: 'Not authorized to view messages for this item' });
      }

      // Get messages
      db.all(
        `SELECT m.*, s.username as sender_username, r.username as receiver_username
         FROM messages m
         JOIN users s ON m.sender_id = s.id
         JOIN users r ON m.receiver_id = r.id
         WHERE m.item_id = ?
         ORDER BY m.created_at ASC`,
        [itemId],
        (err, messages) => {
          if (err) {
            return res.status(500).json({ error: 'Failed to fetch messages' });
          }

          res.json({
            item: {
              id: item.id,
              category: item.category,
              color: item.color,
              location_found: item.location_found,
              finder_id: item.finder_id,
              claimant_id: item.claimant_id
            },
            messages
          });
        }
      );
    }
  );
});

// Send a message in handover
router.post('/item/:itemId', authenticateToken, (req, res) => {
  const itemId = req.params.itemId;
  const senderId = req.user.id;
  const { content } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Message content is required' });
  }

  // Check authorization and get receiver
  db.get(
    `SELECT i.finder_id, ca.user_id as claimant_id
     FROM items i
     JOIN claim_attempts ca ON i.id = ca.item_id AND ca.user_id = i.claimed_by
     WHERE i.id = ? AND i.verified_correct = 1 AND i.manual_resolution = 0
     AND (i.finder_id = ? OR ca.user_id = ?)`,
    [itemId, senderId, senderId],
    (err, item) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to check authorization' });
      }

      if (!item) {
        return res.status(403).json({ error: 'Not authorized to send messages for this item' });
      }

      // Determine receiver
      const receiverId = senderId === item.finder_id ? item.claimant_id : item.finder_id;

      // Insert message
      db.run(
        'INSERT INTO messages (item_id, sender_id, receiver_id, content) VALUES (?, ?, ?, ?)',
        [itemId, senderId, receiverId, content.trim()],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to send message' });
          }

          res.json({
            message_id: this.lastID,
            message: 'Message sent successfully'
          });
        }
      );
    }
  );
});

// Mark item as returned (complete handover)
router.post('/item/:itemId/complete', authenticateToken, requireFinder, (req, res) => {
  const itemId = req.params.itemId;
  const userId = req.user.id;

  // Check if user is the finder and item is verified correct
  db.get(
    'SELECT * FROM items WHERE id = ? AND finder_id = ? AND verified_correct = 1 AND manual_resolution = 0',
    [itemId, userId],
    (err, item) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to check item' });
      }

      if (!item) {
        return res.status(403).json({ error: 'Not authorized or item not ready for completion' });
      }

      if (item.returned) {
        return res.status(400).json({ error: 'Item already marked as returned' });
      }

      // Mark as returned
      db.run(
        'UPDATE items SET returned = 1, status = \'returned\' WHERE id = ?',
        [itemId],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to mark item as returned' });
          }

          res.json({ message: 'Item marked as successfully returned' });
        }
      );
    }
  );
});

// Get handover-ready items for user (as finder or claimant)
router.get('/handovers', authenticateToken, (req, res) => {
  const userId = req.user.id;

  db.all(
    `SELECT DISTINCT i.*, 
            CASE 
              WHEN i.finder_id = ? THEN 'finder'
              ELSE 'claimant'
            END as user_role,
            f.username as finder_username,
            c.username as claimant_username
     FROM items i
     JOIN users f ON i.finder_id = f.id
     JOIN claim_attempts ca ON i.id = ca.item_id AND ca.user_id = i.claimed_by
     JOIN users c ON ca.user_id = c.id
     WHERE i.verified_correct = 1 AND i.manual_resolution = 0 AND i.returned = 0
     AND (i.finder_id = ? OR ca.user_id = ?)
     ORDER BY i.created_at DESC`,
    [userId, userId, userId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch handovers' });
      }

      res.json(rows);
    }
  );
});

module.exports = router;
