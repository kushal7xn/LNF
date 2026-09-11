const db = require('./database');
const bcrypt = require('bcryptjs');

console.log('Initializing database...');


// =====================================================
// ADMIN USER
// =====================================================

const adminPassword = bcrypt.hashSync('admin123', 10);

db.run(
  `INSERT OR IGNORE INTO users
   (username, email, password_hash, role)
   VALUES (?, ?, ?, ?)`,
  [
    'admin',
    'admin@lostandfound.com',
    adminPassword,
    'admin'
  ],
  (err) => {
    if (err) {
      console.error('Error creating admin user:', err);
    } else {
      console.log(
        '✅ Admin user created/verified: admin@lostandfound.com / admin123'
      );
    }
  }
);


// =====================================================
// TEST LOST USER
// =====================================================

const lostUserPassword = bcrypt.hashSync('test123', 10);

db.run(
  `INSERT OR IGNORE INTO users
   (username, email, password_hash, role)
   VALUES (?, ?, ?, ?)`,
  [
    'testlostuser',
    'lostuser@example.com',
    lostUserPassword,
    'lost_user'
  ],
  (err) => {
    if (err) {
      console.error('Error creating test lost user:', err);
    } else {
      console.log(
        '✅ Test lost user created/verified: lostuser@example.com / test123'
      );
    }
  }
);


// =====================================================
// TEST FINDER
// =====================================================

const finderPassword = bcrypt.hashSync('test123', 10);

db.run(
  `INSERT OR IGNORE INTO users
   (username, email, password_hash, role)
   VALUES (?, ?, ?, ?)`,
  [
    'testfinder',
    'finder@example.com',
    finderPassword,
    'finder'
  ],
  (err) => {
    if (err) {
      console.error('Error creating test finder:', err);
    } else {
      console.log(
        '✅ Test finder created/verified: finder@example.com / test123'
      );
    }
  }
);


console.log('✅ Database initialized successfully!');

console.log('\n🔑 Login Credentials:');

console.log(
  'Admin: admin@lostandfound.com / admin123'
);

console.log(
  'Lost User: lostuser@example.com / test123'
);

console.log(
  'Finder: finder@example.com / test123'
);


// Give the database operations a moment to finish
setTimeout(() => {
  process.exit(0);
}, 500);