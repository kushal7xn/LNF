const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../database');
const { authenticateToken, requireFinder } = require('../middleware/auth');

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'item-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Post a found item
router.post('/', authenticateToken, requireFinder, upload.single('photo'), (req, res) => {
  const { category, color, location_found, date_found, secret_detail } = req.body;
  const finder_id = req.user.id;

  if (!category || !color || !location_found || !date_found || !secret_detail) {
    return res.status(400).json({ error: 'All fields including secret detail are required' });
  }

  const photo_url = req.file ? `/uploads/${req.file.filename}` : null;

  db.run(
    `INSERT INTO items (finder_id, category, color, location_found, date_found, photo_url, secret_detail)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [finder_id, category, color, location_found, date_found, photo_url, secret_detail],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to post item' });
      }

      res.json({
        id: this.lastID,
        message: 'Item posted successfully and is pending approval'
      });
    }
  );
});

// Get approved items (public search) - NEVER include secret_detail
router.get('/search', (req, res) => {
  const { category, color, location, date_from, date_to, page = 1, limit = 10 } = req.query;
  
  let query = `
    SELECT i.id, i.category, i.color, i.location_found, i.date_found, i.photo_url, i.status
    FROM items i
    WHERE i.status = 'approved' AND i.returned = FALSE
  `;
  
  const params = [];
  
  if (category) {
    query += ' AND i.category LIKE ?';
    params.push(`%${category}%`);
  }
  
  if (location) {
    query += ' AND i.location_found LIKE ?';
    params.push(`%${location}%`);
  }

  if (color) {
    query += ' AND i.color LIKE ?';
    params.push(`%${color}%`);
  }
  
  if (date_from) {
    query += ' AND i.date_found >= ?';
    params.push(date_from);
  }
  
  if (date_to) {
    query += ' AND i.date_found <= ?';
    params.push(date_to);
  }
  
  query += ' ORDER BY i.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Search failed' });
    }

    res.json(rows);
  });
});

// Get single item details (public) - NEVER include secret_detail
router.get('/:id', (req, res) => {
  const itemId = req.params.id;

  db.get(
    `SELECT i.id, i.category, i.color, i.location_found, i.date_found, i.photo_url, i.created_at,
            i.status
     FROM items i
     WHERE i.id = ? AND i.status = 'approved'`,
    [itemId],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch item' });
      }

      if (!row) {
        return res.status(404).json({ error: 'Item not found or not approved' });
      }

      res.json(row);
    }
  );
});

// Get user's own posted items
router.get('/user/mine', authenticateToken, requireFinder, (req, res) => {
  db.all(
    `SELECT i.*, ca.attempt_count, ca.is_correct
     FROM items i
     LEFT JOIN claim_attempts ca ON i.id = ca.item_id AND ca.user_id = i.claimed_by
     WHERE i.finder_id = ?
     ORDER BY i.created_at DESC`,
    [req.user.id],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch items' });
      }

      // Don't expose secret_detail even to the finder in this endpoint
      const safeItems = rows.map(item => {
        const { secret_detail, ...safeItem } = item;
        return safeItem;
      });

      res.json(safeItems);
    }
  );
});

module.exports = router;
