const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../database');
const {
  authenticateToken,
  requireAdmin,
  generateToken
} = require('../middleware/auth');

const router = express.Router();


// =====================================================
// ADMIN LOGIN
// =====================================================

router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      error: 'Email and password are required'
    });
  }

  db.get(
    'SELECT * FROM users WHERE email = ?',
    [email],
    (err, user) => {

      if (err) {
        return res.status(500).json({
          error: 'Admin login failed'
        });
      }

      if (!user) {
        return res.status(401).json({
          error: 'Invalid admin credentials'
        });
      }

      // IMPORTANT:
      // Only an account whose role is admin can use
      // the admin login.

      if (user.role !== 'admin') {
        return res.status(403).json({
          error: 'Admin access required'
        });
      }

      if (!bcrypt.compareSync(password, user.password_hash)) {
        return res.status(401).json({
          error: 'Invalid admin credentials'
        });
      }

      const admin = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      };

      const token = generateToken(admin);

      res.json({
        user: admin,
        token
      });
    }
  );
});


// =====================================================
// GET ALL PENDING ITEMS FOR APPROVAL
// =====================================================

router.get('/pending', authenticateToken, requireAdmin, (req, res) => {

  db.all(
    `SELECT i.*, 
            u.username as finder_username,
            u.email as finder_email
     FROM items i
     JOIN users u ON i.finder_id = u.id
     WHERE i.status = 'pending'
     ORDER BY i.created_at ASC`,
    (err, rows) => {

      if (err) {
        return res.status(500).json({
          error: 'Failed to fetch pending items'
        });
      }

      res.json(rows);
    }
  );
});


// =====================================================
// APPROVE AN ITEM
// =====================================================

router.post('/approve/:id', authenticateToken, requireAdmin, (req, res) => {

  const itemId = req.params.id;

  db.run(
    'UPDATE items SET status = ? WHERE id = ? AND status = ?',
    ['approved', itemId, 'pending'],
    function(err) {

      if (err) {
        return res.status(500).json({
          error: 'Failed to approve item'
        });
      }

      if (this.changes === 0) {
        return res.status(404).json({
          error: 'Item not found or already processed'
        });
      }

      res.json({
        message: 'Item approved successfully'
      });
    }
  );
});


// =====================================================
// REJECT AN ITEM
// =====================================================

router.post('/reject/:id', authenticateToken, requireAdmin, (req, res) => {

  const itemId = req.params.id;
  const { reason } = req.body;

  if (!reason) {
    return res.status(400).json({
      error: 'Rejection reason is required'
    });
  }

  db.run(
    `UPDATE items
     SET status = ?, rejection_reason = ?
     WHERE id = ? AND status = ?`,
    ['rejected', reason, itemId, 'pending'],
    function(err) {

      if (err) {
        return res.status(500).json({
          error: 'Failed to reject item'
        });
      }

      if (this.changes === 0) {
        return res.status(404).json({
          error: 'Item not found or already processed'
        });
      }

      res.json({
        message: 'Item rejected successfully'
      });
    }
  );
});


// =====================================================
// GET PENDING CLAIM VERIFICATIONS
// =====================================================

router.get('/claims', authenticateToken, requireAdmin, (req, res) => {

  db.all(
    `SELECT ca.*,
            i.category,
            i.color,
            i.location_found,
            i.secret_detail,
            u.username as claimant_username,
            f.username as finder_username
     FROM claim_attempts ca
     JOIN items i ON ca.item_id = i.id
     JOIN users u ON ca.user_id = u.id
     JOIN users f ON i.finder_id = f.id
     WHERE ca.is_correct IS NULL
     ORDER BY ca.created_at ASC`,
    (err, rows) => {

      if (err) {
        return res.status(500).json({
          error: 'Failed to fetch claims'
        });
      }

      res.json(rows);
    }
  );
});


// =====================================================
// VERIFY CLAIM
// STRICTLY CORRECT / INCORRECT
// =====================================================

router.post('/verify-claim/:id', authenticateToken, requireAdmin, (req, res) => {
  const { is_correct } = req.body;
  if (typeof is_correct !== 'boolean') {
    return res.status(400).json({ error: 'is_correct must be true or false' });
  }

  db.get(
    `SELECT ca.id, ca.item_id, ca.user_id, ca.is_correct
     FROM claim_attempts ca WHERE ca.id = ?`,
    [req.params.id],
    (err, claim) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch claim details' });
      if (!claim) return res.status(404).json({ error: 'Claim attempt not found' });
      if (claim.is_correct !== null) return res.status(409).json({ error: 'Claim has already been verified' });

      db.run('UPDATE claim_attempts SET is_correct = ? WHERE id = ?', [is_correct, claim.id], (updateErr) => {
        if (updateErr) return res.status(500).json({ error: 'Failed to update claim' });
        if (!is_correct) return res.json({ message: 'Claim marked as incorrect' });

        db.get(
          'SELECT COUNT(*) AS count FROM claim_attempts WHERE item_id = ? AND is_correct = 1',
          [claim.item_id],
          (countErr, result) => {
            if (countErr) return res.status(500).json({ error: 'Failed to check verified claims' });
            const multipleCorrect = result.count > 1;
            db.run(
              `UPDATE items
               SET status = 'claimed', verified_correct = 1,
                   claimed_by = CASE WHEN ? THEN claimed_by ELSE ? END,
                   manual_resolution = ?
               WHERE id = ?`,
              [multipleCorrect, claim.user_id, multipleCorrect, claim.item_id],
              (itemErr) => {
                if (itemErr) return res.status(500).json({ error: 'Failed to update item status' });
                if (multipleCorrect) {
                  return res.status(409).json({
                    error: 'Multiple correct claims detected. Manual resolution required.',
                    requires_manual_resolution: true
                  });
                }
                res.json({ message: 'Claim verified as correct. Item ready for handover.', handover_ready: true });
              }
            );
          }
        );
      });
    }
  );
});

router.get('/manual-resolutions', authenticateToken, requireAdmin, (req, res) => {
  db.all(
    `SELECT i.id AS item_id, i.category, i.color, ca.id AS claim_id, ca.answer,
            u.username AS claimant_username
     FROM items i JOIN claim_attempts ca ON ca.item_id = i.id
     JOIN users u ON u.id = ca.user_id
     WHERE i.manual_resolution = 1 AND ca.is_correct = 1
     ORDER BY i.id, ca.created_at`,
    (err, rows) => err ? res.status(500).json({ error: 'Failed to fetch manual resolutions' }) : res.json(rows)
  );
});

router.post('/resolve-claim/:itemId', authenticateToken, requireAdmin, (req, res) => {
  const { claim_id } = req.body;
  if (!Number.isInteger(claim_id)) return res.status(400).json({ error: 'A valid claim_id is required' });
  db.get(
    'SELECT user_id FROM claim_attempts WHERE id = ? AND item_id = ? AND is_correct = 1',
    [claim_id, req.params.itemId],
    (err, claim) => {
      if (err) return res.status(500).json({ error: 'Failed to resolve claim' });
      if (!claim) return res.status(404).json({ error: 'Verified claim not found for this item' });
      db.run(
        `UPDATE items SET status = 'claimed', claimed_by = ?, verified_correct = 1,
         manual_resolution = 0 WHERE id = ? AND manual_resolution = 1`,
        [claim.user_id, req.params.itemId],
        function(updateErr) {
          if (updateErr) return res.status(500).json({ error: 'Failed to resolve claim' });
          if (!this.changes) return res.status(409).json({ error: 'Item does not require manual resolution' });
          res.json({ message: 'Claim resolved. Handover is ready.' });
        }
      );
    }
  );
});


// =====================================================
// ADMIN DASHBOARD STATISTICS
// =====================================================

router.get('/stats', authenticateToken, requireAdmin, (req, res) => {
  db.get(
    `SELECT
       (SELECT COUNT(*) FROM items WHERE status = 'pending') AS pending,
       (SELECT COUNT(*) FROM items WHERE status = 'approved') AS approved,
       (SELECT COUNT(*) FROM items WHERE status = 'claimed') AS claimed,
       (SELECT COUNT(*) FROM items WHERE returned = 1) AS returned,
       (SELECT COUNT(*) FROM claim_attempts WHERE is_correct IS NULL) AS pending_verifications`,
    (err, stats) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch stats' });
      res.json(stats);
    }
  );
});


module.exports = router;
