# Deployment Guide

This guide covers how to deploy the Lost & Found application to various platforms.

## Production Checklist

Before deploying, ensure you have:

- [ ] Changed default JWT_SECRET in production
- [ ] Updated admin credentials
- [ ] Configured proper CORS origins
- [ ] Set NODE_ENV=production
- [ ] Built the React frontend
- [ ] Tested the application thoroughly

## Local Production Build

### 1. Build the Frontend
```bash
cd client
npm run build
```

### 2. Set Production Environment
Create `.env.production`:
```
NODE_ENV=production
PORT=5000
JWT_SECRET=your-super-secure-production-jwt-secret-key
```

### 3. Start in Production Mode
```bash
NODE_ENV=production npm run server
```

The server will serve the built React app from `client/build`.

## Deployment Options

### Option 1: Heroku (Free/Paid)

1. **Prepare for Heroku:**
   ```bash
   # Create Procfile
   echo "web: node server/server.js" > Procfile
   
   # Add heroku-postbuild script to package.json
   ```

2. **Update package.json:**
   ```json
   {
     "scripts": {
       "heroku-postbuild": "cd client && npm install && npm run build",
       "start": "node server/server.js"
     }
   }
   ```

3. **Deploy to Heroku:**
   ```bash
   # Install Heroku CLI and login
   npm install -g heroku
   heroku login
   
   # Create app
   heroku create your-lost-found-app
   
   # Set environment variables
   heroku config:set NODE_ENV=production
   heroku config:set JWT_SECRET=your-secure-jwt-secret
   
   # Deploy
   git add .
   git commit -m "Deploy to Heroku"
   git push heroku main
   ```

### Option 2: Railway (Modern Alternative)

1. **Connect GitHub repo** at railway.app
2. **Set environment variables:**
   - `NODE_ENV=production`
   - `JWT_SECRET=your-secure-jwt-secret`
3. **Railway auto-detects** Node.js and builds automatically

### Option 3: DigitalOcean App Platform

1. **Create app** from GitHub repo
2. **Configure build settings:**
   - Build Command: `npm install && cd client && npm install && npm run build`
   - Run Command: `node server/server.js`
3. **Set environment variables**

### Option 4: Render (Free Tier Available)

1. **Connect GitHub repo** at render.com
2. **Web Service settings:**
   - Build Command: `npm install && cd client && npm install && npm run build`
   - Start Command: `node server/server.js`
3. **Add environment variables**

### Option 5: Netlify + Separate Backend

**Frontend (Netlify):**
```bash
cd client
npm run build
# Upload dist folder to Netlify
```

**Backend (Railway/Heroku):**
Deploy backend separately and update frontend API URLs.

## Production Configuration

### 1. Update CORS for Production
In `server/server.js`:
```javascript
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://your-domain.com'
    : 'http://localhost:3000'
}));
```

### 2. Database for Production

**SQLite (Current):**
- Works for small-medium traffic
- Database file persists with the application
- Simple, no external dependencies

**PostgreSQL (Recommended for Scale):**
```bash
npm install pg
```

Update `database.js` for PostgreSQL:
```javascript
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
});
```

### 3. File Storage for Production

**Current (Local Storage):**
- Files stored in `server/uploads/`
- Works for single-server deployments

**Cloud Storage (Recommended):**
```bash
npm install aws-sdk multer-s3
```

Update file upload to use S3:
```javascript
const multerS3 = require('multer-s3');
const AWS = require('aws-sdk');
```

## Environment Variables

Set these in production:

```env
NODE_ENV=production
PORT=5000
JWT_SECRET=your-super-secure-jwt-secret-at-least-32-characters
DATABASE_URL=postgres://... # if using PostgreSQL
AWS_ACCESS_KEY_ID=... # if using S3
AWS_SECRET_ACCESS_KEY=... # if using S3
AWS_REGION=... # if using S3
S3_BUCKET=... # if using S3
```

## Security for Production

### 1. JWT Secret
Generate a secure random key:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Rate Limiting
Already configured in the app (100 requests per 15 minutes).

### 3. HTTPS
Most platforms (Heroku, Railway, Render) provide HTTPS automatically.

### 4. Content Security Policy
Add to `server/server.js`:
```javascript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  }
}));
```

## Monitoring & Maintenance

### 1. Logging
Add production logging:
```bash
npm install winston
```

### 2. Health Check Endpoint
Add to `server/server.js`:
```javascript
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString() 
  });
});
```

### 3. Database Backups
For SQLite:
```bash
# Backup database file regularly
cp server/lost_found.db backups/lost_found_$(date +%Y%m%d).db
```

## Scaling Considerations

### 1. Database
- SQLite: Good for < 1000 concurrent users
- PostgreSQL: Better for high traffic
- Consider read replicas for heavy read workloads

### 2. File Storage
- Local storage: Limited by server disk space
- Cloud storage (S3/Cloudinary): Unlimited, CDN benefits

### 3. Session Management
- Current JWT approach scales well
- Consider Redis for session storage if needed

### 4. Caching
Add Redis caching for frequently accessed data:
```bash
npm install redis
```

## Performance Optimization

### 1. Frontend
```bash
cd client
npm run build # Creates optimized production build
```

### 2. Backend
- Enable gzip compression
- Add database indexes
- Implement API caching

### 3. CDN
Serve static assets through CDN for global users.

## Troubleshooting Production Issues

### Common Issues:

1. **Database Connection Errors**
   - Check DATABASE_URL format
   - Verify database server accessibility

2. **File Upload Failures**
   - Check disk space
   - Verify upload directory permissions
   - Check file size limits

3. **JWT Token Issues**
   - Verify JWT_SECRET is set
   - Check token expiration time

4. **CORS Errors**
   - Update CORS origin settings
   - Verify frontend/backend URLs

### Debug Commands:
```bash
# Check logs
heroku logs --tail  # for Heroku
railway logs        # for Railway

# Check environment variables
heroku config       # for Heroku
railway variables   # for Railway
```

## Post-Deployment Steps

1. **Test all functionality** using the TESTING.md guide
2. **Monitor error rates** and performance
3. **Set up monitoring** (UptimeRobot, etc.)
4. **Configure backups** for database
5. **Document any platform-specific configurations**

## Cost Estimates

### Free Tiers:
- **Render**: 750 hours/month free
- **Railway**: $5 credit monthly
- **Heroku**: Limited free dyno hours

### Paid Tiers:
- **Heroku Hobby**: $7/month
- **Railway Pro**: $20/month
- **DigitalOcean**: $5-25/month

Choose based on expected traffic and feature requirements.