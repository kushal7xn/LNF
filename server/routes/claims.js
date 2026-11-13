const express = require('express');
const db = require('../database');
const { authenticateToken, requireLostUser } = require('../middleware/auth');

const router = express.Router();

const MAX_ATTEMPTS = 5;

// Submit a claim attempt
router.post('/:itemId', authenticateToken, requireLostUser, (req, res) => {
  const itemId = req.params.itemId;
  const userId = req.user.id;
  const { answer } = req.body;

  if (!answer || !answer.trim()) {
    return res.status(400).json({ error: 'Answer is required' });
  }

  // Check if item exists and is approved
  db.get(
    'SELECT * FROM items WHERE id = ? AND status = ? AND returned = FALSE',
    [itemId, 'approved'],
    (err, item) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to check item' });
      }

      if (!item) {
        return res.status(404).json({ error: 'Item not found or not available for claiming' });
      }

      if (item.finder_id === userId) {
        return res.status(400).json({ error: 'You cannot claim your own item' });
      }

      // Check current attempt count for this user and item
      db.get(
        'SELECT COUNT(*) as attempt_count FROM claim_attempts WHERE item_id = ? AND user_id = ?',
        [itemId, userId],
        (err, result) => {
          if (err) {
            return res.status(500).json({ error: 'Failed to check attempt count' });
          }

          if (result.attempt_count >= MAX_ATTEMPTS) {
            return res.status(429).json({ 
              error: `Maximum ${MAX_ATTEMPTS} attempts reached for this item`,
              max_attempts_reached: true
            });
          }

          // Check if there's already a pending claim from this user
          db.get(
            'SELECT * FROM claim_attempts WHERE item_id = ? AND user_id = ? AND is_correct IS NULL',
            [itemId, userId],
            (err, pendingClaim) => {
              if (err) {
                return res.status(500).json({ error: 'Failed to check pending claims' });
              }

              if (pendingClaim) {
                return res.status(400).json({ 
                  error: 'You already have a pending claim for this item',
                  pending_verification: true
                });
              }

              // Submit new claim attempt
              db.run(
                'INSERT INTO claim_attempts (item_id, user_id, answer) VALUES (?, ?, ?)',
                [itemId, userId, answer.trim()],
                function(err) {
                  if (err) {
                    return res.status(500).json({ error: 'Failed to submit claim' });
                  }

                  const newAttemptCount = result.attempt_count + 1;
                  const remainingAttempts = MAX_ATTEMPTS - newAttemptCount;

                  res.json({
                    message: 'Claim submitted for admin verification',
                    attempt_id: this.lastID,
                    attempts_used: newAttemptCount,
                    attempts_remaining: remainingAttempts,
                    pending_verification: true
                  });
                }
              );
            }
          );
        }
      );
    }
  );
});

// Get user's claim attempts for an item
router.get('/item/:itemId/attempts', authenticateToken, requireLostUser, (req, res) => {
  const itemId = req.params.itemId;
  const userId = req.user.id;

  db.all(
    `SELECT ca.id, ca.answer, ca.is_correct, ca.created_at,
            (SELECT COUNT(*) FROM claim_attempts WHERE item_id = ? AND user_id = ?) as total_attempts
     FROM claim_attempts ca
     WHERE ca.item_id = ? AND ca.user_id = ?
     ORDER BY ca.created_at DESC`,
    [itemId, userId, itemId, userId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch attempts' });
      }

      const totalAttempts = rows.length > 0 ? rows[0].total_attempts : 0;
      const remainingAttempts = Math.max(0, MAX_ATTEMPTS - totalAttempts);
      const maxReached = totalAttempts >= MAX_ATTEMPTS;

      res.json({
        attempts: rows,
        total_attempts: totalAttempts,
        remaining_attempts: remainingAttempts,
        max_attempts: MAX_ATTEMPTS,
        max_attempts_reached: maxReached
      });
    }
  );
});

// Get user's all claim attempts
router.get('/mine', authenticateToken, requireLostUser, (req, res) => {
  const userId = req.user.id;

  db.all(
    `SELECT ca.*, i.category, i.color, i.location_found, i.date_found, i.photo_url,
            i.status as item_status, i.returned
     FROM claim_attempts ca
     JOIN items i ON ca.item_id = i.id
     WHERE ca.user_id = ?
     ORDER BY ca.created_at DESC`,
    [userId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch claims' });
      }

      res.json(rows);
    }
  );
});

// Check if user can claim an item
router.get('/item/:itemId/can-claim', authenticateToken, requireLostUser, (req, res) => {
  const itemId = req.params.itemId;
  const userId = req.user.id;

  db.get(
    'SELECT COUNT(*) as attempt_count FROM claim_attempts WHERE item_id = ? AND user_id = ?',
    [itemId, userId],
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to check claim eligibility' });
      }

      const canClaim = result.attempt_count < MAX_ATTEMPTS;
      const remainingAttempts = Math.max(0, MAX_ATTEMPTS - result.attempt_count);

      res.json({
        can_claim: canClaim,
        attempts_used: result.attempt_count,
        remaining_attempts: remainingAttempts,
        max_attempts: MAX_ATTEMPTS
      });
    }
  );
});

module.exports = router;
