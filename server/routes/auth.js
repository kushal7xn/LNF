const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../database');
const { generateToken } = require('../middleware/auth');

const router = express.Router();


// =====================================================
// FINDER REGISTER
// =====================================================

router.post('/finder/register', (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({
      error: 'All fields are required'
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      error: 'Password must be at least 6 characters'
    });
  }

  const passwordHash = bcrypt.hashSync(password, 10);

  db.run(
    `INSERT INTO users
     (username, email, password_hash, role)
     VALUES (?, ?, ?, ?)`,
    [username, email, passwordHash, 'finder'],
    function (err) {

      if (err) {
        if (err.code === 'SQLITE_CONSTRAINT') {
          return res.status(400).json({
            error: 'Username or email already exists'
          });
        }

        return res.status(500).json({
          error: 'Registration failed'
        });
      }

      const user = {
        id: this.lastID,
        username,
        email,
        role: 'finder'
      };

      const token = generateToken(user);

      res.json({
        user,
        token
      });
    }
  );
});


// =====================================================
// LOST USER REGISTER
// =====================================================

router.post('/lost/register', (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({
      error: 'All fields are required'
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      error: 'Password must be at least 6 characters'
    });
  }

  const passwordHash = bcrypt.hashSync(password, 10);

  db.run(
    `INSERT INTO users
     (username, email, password_hash, role)
     VALUES (?, ?, ?, ?)`,
    [username, email, passwordHash, 'lost_user'],
    function (err) {

      if (err) {
        if (err.code === 'SQLITE_CONSTRAINT') {
          return res.status(400).json({
            error: 'Username or email already exists'
          });
        }

        return res.status(500).json({
          error: 'Registration failed'
        });
      }

      const user = {
        id: this.lastID,
        username,
        email,
        role: 'lost_user'
      };

      const token = generateToken(user);

      res.json({
        user,
        token
      });
    }
  );
});


// =====================================================
// FINDER LOGIN
// =====================================================

router.post('/finder/login', (req, res) => {
  loginUser(req, res, 'finder');
});


// =====================================================
// LOST USER LOGIN
// =====================================================

router.post('/lost/login', (req, res) => {
  loginUser(req, res, 'lost_user');
});


// =====================================================
// COMMON LOGIN FUNCTION
// =====================================================

function loginUser(req, res, requiredRole) {

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
          error: 'Login failed'
        });
      }

      if (!user) {
        return res.status(401).json({
          error: 'Invalid credentials'
        });
      }

      if (!bcrypt.compareSync(password, user.password_hash)) {
        return res.status(401).json({
          error: 'Invalid credentials'
        });
      }

      // IMPORTANT:
      // Make sure a finder cannot login through lost-user login
      // and vice versa.

      if (user.role !== requiredRole) {
        return res.status(403).json({
          error: `This account is not registered as a ${requiredRole === 'finder' ? 'finder' : 'lost user'}`
        });
      }

      const safeUser = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      };

      const token = generateToken(safeUser);

      res.json({
        user: safeUser,
        token
      });
    }
  );
}


module.exports = router;