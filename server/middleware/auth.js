const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';


// =====================================================
// VERIFY JWT
// =====================================================

const authenticateToken = (req, res, next) => {

  const authHeader = req.headers['authorization'];

  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: 'Access token required'
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {

    if (err) {
      return res.status(403).json({
        error: 'Invalid token'
      });
    }

    req.user = user;

    next();
  });
};


// =====================================================
// ADMIN
// =====================================================

const requireAdmin = (req, res, next) => {

  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Admin access required'
    });
  }

  next();
};


// =====================================================
// FINDER
// =====================================================

const requireFinder = (req, res, next) => {

  if (!req.user || req.user.role !== 'finder') {
    return res.status(403).json({
      error: 'Finder access required'
    });
  }

  next();
};


// =====================================================
// LOST USER
// =====================================================

const requireLostUser = (req, res, next) => {

  if (!req.user || req.user.role !== 'lost_user') {
    return res.status(403).json({
      error: 'Lost user access required'
    });
  }

  next();
};


// =====================================================
// GENERATE TOKEN
// =====================================================

const generateToken = (user) => {

  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    },
    JWT_SECRET,
    {
      expiresIn: '24h'
    }
  );
};


module.exports = {
  authenticateToken,
  requireAdmin,
  requireFinder,
  requireLostUser,
  generateToken,
  JWT_SECRET
};