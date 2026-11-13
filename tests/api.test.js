const request = require('supertest');
const express = require('express');
const cors = require('cors');
const authRoutes = require('../server/routes/auth');
const itemRoutes = require('../server/routes/items');
const claimRoutes = require('../server/routes/claims');
const adminRoutes = require('../server/routes/admin');
const messageRoutes = require('../server/routes/messages');

// Create test app
const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/claims', claimRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/messages', messageRoutes);

describe('Authentication API', () => {
  let testUser = {
    username: 'testuser' + Date.now(),
    email: 'test' + Date.now() + '@example.com',
    password: 'testpass123'
  };

  describe('POST /api/auth/lost/register', () => {
    test('should register a new user', async () => {
      const res = await request(app)
        .post('/api/auth/lost/register')
        .send(testUser)
        .expect(200);

      expect(res.body).toHaveProperty('user');
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.email).toBe(testUser.email);
      expect(res.body.user.username).toBe(testUser.username);
      expect(res.body.user.role).toBe('lost_user');
    });

    test('should not register user with existing email', async () => {
      await request(app)
        .post('/api/auth/lost/register')
        .send(testUser)
        .expect(400);
    });

    test('should not register user with invalid data', async () => {
      await request(app)
        .post('/api/auth/lost/register')
        .send({
          username: '',
          email: 'invalid-email',
          password: '123'  // too short
        })
        .expect(400);
    });
  });

  describe('POST /api/auth/lost/login', () => {
    test('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/lost/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect(200);

      expect(res.body).toHaveProperty('user');
      expect(res.body).toHaveProperty('token');
    });

    test('should not login with invalid credentials', async () => {
      await request(app)
        .post('/api/auth/lost/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword'
        })
        .expect(401);
    });
  });

  test('rejects a lost-user account at the finder login endpoint', async () => {
    await request(app)
      .post('/api/auth/finder/login')
      .send({ email: testUser.email, password: testUser.password })
      .expect(403);
  });
});

describe('Items API', () => {
  test('should get approved items without authentication', async () => {
    const res = await request(app)
      .get('/api/items/search')
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });

  test('should not post item without authentication', async () => {
    await request(app)
      .post('/api/items')
      .send({
        category: 'Test Item',
        color: 'Blue',
        location_found: 'Test Location',
        date_found: '2023-01-01',
        secret_detail: 'Test Secret'
      })
      .expect(401);
  });
});

describe('Security Tests', () => {
  test('rejects a finder from posting a claim', async () => {
    const finder = {
      username: 'finder' + Date.now(),
      email: 'finder' + Date.now() + '@example.com',
      password: 'testpass123'
    };
    const registration = await request(app).post('/api/auth/finder/register').send(finder).expect(200);
    await request(app)
      .post('/api/claims/1')
      .set('Authorization', `Bearer ${registration.body.token}`)
      .send({ answer: 'anything' })
      .expect(403);
  });
  test('should not expose secret details in public search', async () => {
    const res = await request(app)
      .get('/api/items/search')
      .expect(200);

    // Check that no item in the response has a secret_detail field
    res.body.forEach(item => {
      expect(item).not.toHaveProperty('secret_detail');
    });
  });

  test('should not expose secret details in single item view', async () => {
    // First get any item ID from search
    const searchRes = await request(app)
      .get('/api/items/search')
      .expect(200);

    if (searchRes.body.length > 0) {
      const itemId = searchRes.body[0].id;
      
      const res = await request(app)
        .get(`/api/items/${itemId}`)
        .expect(200);

      expect(res.body).not.toHaveProperty('secret_detail');
    }
  });
});

describe('End-to-end return flow', () => {
  test('returns a found item to its verified owner', async () => {
    const unique = Date.now();
    const finder = { username: `finder-flow-${unique}`, email: `finder-flow-${unique}@example.com`, password: 'testpass123' };
    const owner = { username: `owner-flow-${unique}`, email: `owner-flow-${unique}@example.com`, password: 'testpass123' };
    const finderRegistration = await request(app).post('/api/auth/finder/register').send(finder).expect(200);
    const ownerRegistration = await request(app).post('/api/auth/lost/register').send(owner).expect(200);
    const adminLogin = await request(app).post('/api/admin/login')
      .send({ email: 'admin@lostandfound.com', password: 'admin123' }).expect(200);

    const posted = await request(app).post('/api/items')
      .set('Authorization', `Bearer ${finderRegistration.body.token}`)
      .send({
        category: 'Example Blue Backpack', color: 'Blue', location_found: 'Library front desk',
        date_found: '2026-09-12', secret_detail: 'A small silver star keychain in the front pocket'
      }).expect(200);
    const itemId = posted.body.id;

    await request(app).post(`/api/admin/approve/${itemId}`)
      .set('Authorization', `Bearer ${adminLogin.body.token}`).expect(200);
    const visibleItem = await request(app).get(`/api/items/${itemId}`).expect(200);
    expect(visibleItem.body).not.toHaveProperty('secret_detail');

    const claim = await request(app).post(`/api/claims/${itemId}`)
      .set('Authorization', `Bearer ${ownerRegistration.body.token}`)
      .send({ answer: 'A small silver star keychain in the front pocket' }).expect(200);
    await request(app).post(`/api/admin/verify-claim/${claim.body.attempt_id}`)
      .set('Authorization', `Bearer ${adminLogin.body.token}`)
      .send({ is_correct: true }).expect(200);

    const finderHandovers = await request(app).get('/api/messages/handovers')
      .set('Authorization', `Bearer ${finderRegistration.body.token}`).expect(200);
    expect(finderHandovers.body.map(item => item.id)).toContain(itemId);
    await request(app).post(`/api/messages/item/${itemId}`)
      .set('Authorization', `Bearer ${ownerRegistration.body.token}`)
      .send({ content: 'I can collect it at the library desk.' }).expect(200);
    await request(app).post(`/api/messages/item/${itemId}/complete`)
      .set('Authorization', `Bearer ${finderRegistration.body.token}`).expect(200);

    const searchAfterReturn = await request(app).get('/api/items/search').expect(200);
    expect(searchAfterReturn.body.map(item => item.id)).not.toContain(itemId);
  });
});
