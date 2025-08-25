# 🚀 Deployment Guide

This guide covers deploying your Unified Messaging Dashboard to various platforms.

## 📋 Prerequisites

- Node.js 18+ installed
- Git repository set up
- Platform API keys configured (see setup instructions)
- Domain name (for production)

## 🐳 Docker Deployment (Recommended)

### 1. Build and Run with Docker Compose

```bash
# Clone repository
git clone <your-repo>
cd unifiedinbox

# Run setup script
node setup.js

# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f app
```

### 2. Production Docker Deployment

```bash
# Build production image
docker build -t unified-messaging-dashboard:latest .

# Run with environment variables
docker run -d \
  --name unified-inbox \
  -p 3000:3000 \
  --env-file .env \
  -v $(pwd)/logs:/app/logs \
  -v $(pwd)/uploads:/app/uploads \
  unified-messaging-dashboard:latest
```

## ☁️ Cloud Platform Deployment

### Vercel (Frontend)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Railway (Backend)

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

### Render

1. Connect your GitHub repository
2. Set build command: `npm install`
3. Set start command: `npm start`
4. Add environment variables from `.env`
5. Deploy

### Heroku

```bash
# Install Heroku CLI
npm install -g heroku

# Create app
heroku create your-unified-inbox

# Add MongoDB addon
heroku addons:create mongolab:sandbox

# Add Redis addon
heroku addons:create heroku-redis:hobby-dev

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-secret-here

# Deploy
git push heroku main
```

## 🗄️ Database Setup

### MongoDB Atlas (Cloud)

1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create new cluster
3. Set up database access (username/password)
4. Set up network access (IP whitelist)
5. Get connection string
6. Update `MONGODB_URI` in environment

### Redis Cloud

1. Create account at [Redis Cloud](https://redis.com/try-free/)
2. Create database
3. Get connection details
4. Update `REDIS_URL` in environment

## 🔐 SSL/HTTPS Setup

### Let's Encrypt (Free)

```bash
# Install Certbot
sudo apt install certbot

# Get certificate
sudo certbot certonly --standalone -d yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Cloudflare (Recommended)

1. Add domain to Cloudflare
2. Update nameservers
3. Enable SSL/TLS encryption mode: Full
4. Set up page rules for HTTPS redirect

## 📱 Platform Webhook Configuration

### Telegram

```bash
# Set webhook
curl -F "url=https://yourdomain.com/api/webhooks/telegram" \
     -F "secret_token=your-secret" \
     "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook"
```

### WhatsApp

1. Go to WhatsApp Business API dashboard
2. Set webhook URL: `https://yourdomain.com/api/webhooks/whatsapp`
3. Set verify token
4. Test webhook

### Instagram

1. Go to Facebook Developer Console
2. Set webhook URL: `https://yourdomain.com/api/webhooks/instagram`
3. Subscribe to relevant events
4. Verify webhook

### Twitter

1. Go to Twitter Developer Portal
2. Set webhook URL: `https://yourdomain.com/api/webhooks/twitter`
3. Enable environment
4. Test webhook

## 🔄 CI/CD Pipeline

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: npm test
        
      - name: Deploy to server
        run: |
          # Add your deployment commands here
          echo "Deploying to production..."
```

### Environment Variables

Set these in your deployment platform:

```bash
# Required
NODE_ENV=production
JWT_SECRET=your-super-secret-key
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/unified-inbox

# Platform APIs
TELEGRAM_BOT_TOKEN=your_token
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
WHATSAPP_ACCESS_TOKEN=your_token
INSTAGRAM_ACCESS_TOKEN=your_token
TWITTER_BEARER_TOKEN=your_token

# Webhook URLs (update with your domain)
TELEGRAM_WEBHOOK_URL=https://yourdomain.com/api/webhooks/telegram
WHATSAPP_WEBHOOK_URL=https://yourdomain.com/api/webhooks/whatsapp
INSTAGRAM_WEBHOOK_URL=https://yourdomain.com/api/webhooks/instagram
TWITTER_WEBHOOK_URL=https://yourdomain.com/api/webhooks/twitter
```

## 📊 Monitoring & Logging

### Application Monitoring

```bash
# Health check endpoint
curl https://yourdomain.com/api/health

# View logs
docker-compose logs -f app
# or
tail -f logs/app.log
```

### Performance Monitoring

- **Uptime**: UptimeRobot, Pingdom
- **Performance**: New Relic, DataDog
- **Logs**: Loggly, Papertrail
- **Errors**: Sentry, Rollbar

## 🔒 Security Checklist

- [ ] HTTPS enabled
- [ ] JWT secrets are strong and unique
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] Input validation enabled
- [ ] File upload restrictions
- [ ] Environment variables secured
- [ ] Database access restricted
- [ ] Regular security updates
- [ ] Backup strategy in place

## 🚨 Troubleshooting

### Common Issues

1. **Webhook not receiving messages**
   - Check webhook URL is accessible
   - Verify platform API keys
   - Check server logs for errors

2. **Database connection failed**
   - Verify MongoDB URI
   - Check network access
   - Ensure database is running

3. **Platform authentication failed**
   - Verify OAuth credentials
   - Check redirect URIs
   - Ensure scopes are correct

### Debug Mode

```bash
# Enable debug logging
export DEBUG=*
export LOG_LEVEL=debug

# Start with debug
npm run dev
```

## 📈 Scaling

### Horizontal Scaling

```bash
# Scale with Docker Compose
docker-compose up -d --scale app=3

# Load balancer configuration
# Use nginx or HAProxy for multiple instances
```

### Database Scaling

- **MongoDB**: Use replica sets for read scaling
- **Redis**: Use Redis Cluster for high availability
- **Connection Pooling**: Configure appropriate pool sizes

## 🔄 Backup Strategy

### Database Backup

```bash
# MongoDB backup
mongodump --uri="mongodb://localhost:27017/unified-inbox" --out=./backup

# Redis backup
redis-cli BGSAVE
cp /var/lib/redis/dump.rdb ./backup/
```

### Automated Backups

```bash
# Add to crontab
0 2 * * * /usr/local/bin/backup-script.sh
```

## 📞 Support

- **Documentation**: [Full API docs](https://docs.yourdomain.com)
- **Issues**: [GitHub Issues](https://github.com/yourusername/unifiedinbox/issues)
- **Community**: [Discord Server](https://discord.gg/your-server)

---

**Happy Deploying! 🎉**
