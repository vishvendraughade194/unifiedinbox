#!/usr/bin/env node

/**
 * Unified Messaging Dashboard Setup Script
 * This script helps you configure all platform integrations
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

console.log(`
🚀 Unified Messaging Dashboard Setup
====================================

This script will help you configure your unified messaging dashboard
with all the necessary platform integrations.

Let's get started!
`);

async function setup() {
  try {
    // Check if .env exists
    const envPath = path.join(process.cwd(), '.env');
    const envExists = fs.existsSync(envPath);
    
    if (envExists) {
      const overwrite = await question('\n.env file already exists. Overwrite? (y/N): ');
      if (overwrite.toLowerCase() !== 'y') {
        console.log('Setup cancelled. Your existing .env file was preserved.');
        rl.close();
        return;
      }
    }
    
    console.log('\n📋 Let\'s configure your environment variables...\n');
    
    // Server configuration
    console.log('🔧 Server Configuration');
    console.log('=======================');
    
    const port = await question('Server port (default: 3000): ') || '3000';
    const host = await question('Server host (default: localhost): ') || 'localhost';
    const nodeEnv = await question('Environment (development/production): ') || 'development';
    
    // Database configuration
    console.log('\n🗄️  Database Configuration');
    console.log('==========================');
    
    const mongoUri = await question('MongoDB URI (default: mongodb://localhost:27017/unified-inbox): ') || 'mongodb://localhost:27017/unified-inbox';
    const redisUrl = await question('Redis URL (optional, default: redis://localhost:6379): ') || 'redis://localhost:6379';
    
    // JWT configuration
    console.log('\n🔐 JWT Configuration');
    console.log('=====================');
    
    const jwtSecret = await question('JWT Secret (generate a strong random string): ');
    if (!jwtSecret) {
      console.log('❌ JWT Secret is required!');
      rl.close();
      return;
    }
    
    const jwtExpires = await question('JWT Expires In (default: 7d): ') || '7d';
    const refreshSecret = await question('Refresh Token Secret (generate another strong random string): ');
    if (!refreshSecret) {
      console.log('❌ Refresh Token Secret is required!');
      rl.close();
      return;
    }
    
    // Platform configurations
    console.log('\n📱 Platform Configuration');
    console.log('==========================');
    
    console.log('\n📨 Telegram Bot Setup:');
    console.log('1. Message @BotFather on Telegram');
    console.log('2. Use /newbot command');
    console.log('3. Follow the instructions to create your bot');
    console.log('4. Copy the bot token provided\n');
    
    const telegramToken = await question('Telegram Bot Token: ');
    const telegramWebhook = await question('Telegram Webhook URL (default: https://yourdomain.com/api/webhooks/telegram): ') || 'https://yourdomain.com/api/webhooks/telegram';
    
    console.log('\n📧 Gmail API Setup:');
    console.log('1. Go to Google Cloud Console (https://console.cloud.google.com/)');
    console.log('2. Create a new project or select existing');
    console.log('3. Enable Gmail API');
    console.log('4. Create OAuth 2.0 credentials');
    console.log('5. Add redirect URI: http://localhost:3000/api/auth/google/callback\n');
    
    const googleClientId = await question('Google Client ID: ');
    const googleClientSecret = await question('Google Client Secret: ');
    const googleRedirectUri = await question('Google Redirect URI (default: http://localhost:3000/api/auth/google/callback): ') || 'http://localhost:3000/api/auth/google/callback';
    const googleApiKey = await question('Google API Key (optional): ');
    
    console.log('\n💬 WhatsApp Business API Setup:');
    console.log('1. Apply for WhatsApp Business API access');
    console.log('2. Get access token and phone number ID');
    console.log('3. Configure webhook verification\n');
    
    const whatsappToken = await question('WhatsApp Access Token: ');
    const whatsappPhoneId = await question('WhatsApp Phone Number ID: ');
    const whatsappVerifyToken = await question('WhatsApp Webhook Verify Token: ');
    const whatsappWebhook = await question('WhatsApp Webhook URL (default: https://yourdomain.com/api/webhooks/whatsapp): ') || 'https://yourdomain.com/api/webhooks/whatsapp';
    
    console.log('\n📷 Instagram Graph API Setup:');
    console.log('1. Create Facebook App (https://developers.facebook.com/)');
    console.log('2. Add Instagram Basic Display');
    console.log('3. Generate access token\n');
    
    const instagramAppId = await question('Instagram App ID: ');
    const instagramAppSecret = await question('Instagram App Secret: ');
    const instagramToken = await question('Instagram Access Token: ');
    const instagramWebhook = await question('Instagram Webhook URL (default: https://yourdomain.com/api/webhooks/instagram): ') || 'https://yourdomain.com/api/webhooks/instagram';
    
    console.log('\n🐦 Twitter API v2 Setup:');
    console.log('1. Apply for Twitter Developer Account');
    console.log('2. Create app and get API keys');
    console.log('3. Enable OAuth 2.0 and DM permissions\n');
    
    const twitterApiKey = await question('Twitter API Key: ');
    const twitterApiSecret = await question('Twitter API Secret: ');
    const twitterAccessToken = await question('Twitter Access Token: ');
    const twitterAccessTokenSecret = await question('Twitter Access Token Secret: ');
    const twitterBearerToken = await question('Twitter Bearer Token: ');
    const twitterWebhook = await question('Twitter Webhook URL (default: https://yourdomain.com/api/webhooks/twitter): ') || 'https://yourdomain.com/api/webhooks/twitter';
    
    // File upload configuration
    console.log('\n📁 File Upload Configuration');
    console.log('=============================');
    
    const maxFileSize = await question('Max file size in bytes (default: 10485760 - 10MB): ') || '10485760';
    const uploadPath = await question('Upload path (default: ./uploads): ') || './uploads';
    const allowedFileTypes = await question('Allowed file types (default: image/jpeg,image/png,image/gif,application/pdf,text/plain): ') || 'image/jpeg,image/png,image/gif,application/pdf,text/plain';
    
    // Generate .env content
    const envContent = `# Unified Messaging Dashboard Environment Configuration
# Generated by setup script on ${new Date().toISOString()}

# =============================================================================
# SERVER CONFIGURATION
# =============================================================================
NODE_ENV=${nodeEnv}
PORT=${port}
HOST=${host}

# =============================================================================
# DATABASE CONFIGURATION
# =============================================================================
MONGODB_URI=${mongoUri}
REDIS_URL=${redisUrl}

# =============================================================================
# JWT & AUTHENTICATION
# =============================================================================
JWT_SECRET=${jwtSecret}
JWT_EXPIRES_IN=${jwtExpires}
REFRESH_TOKEN_SECRET=${refreshSecret}
REFRESH_TOKEN_EXPIRES_IN=30d

# =============================================================================
# TELEGRAM BOT API
# =============================================================================
TELEGRAM_BOT_TOKEN=${telegramToken}
TELEGRAM_WEBHOOK_URL=${telegramWebhook}
TELEGRAM_WEBHOOK_SECRET=${jwtSecret}

# =============================================================================
# GMAIL API (GOOGLE)
# =============================================================================
GOOGLE_CLIENT_ID=${googleClientId}
GOOGLE_CLIENT_SECRET=${googleClientSecret}
GOOGLE_REDIRECT_URI=${googleRedirectUri}
${googleApiKey ? `GOOGLE_API_KEY=${googleApiKey}` : ''}

# =============================================================================
# WHATSAPP BUSINESS API
# =============================================================================
WHATSAPP_ACCESS_TOKEN=${whatsappToken}
WHATSAPP_PHONE_NUMBER_ID=${whatsappPhoneId}
WHATSAPP_VERIFY_TOKEN=${whatsappVerifyToken}
WHATSAPP_WEBHOOK_URL=${whatsappWebhook}

# =============================================================================
# INSTAGRAM GRAPH API
# =============================================================================
INSTAGRAM_APP_ID=${instagramAppId}
INSTAGRAM_APP_SECRET=${instagramAppSecret}
INSTAGRAM_ACCESS_TOKEN=${instagramToken}
INSTAGRAM_WEBHOOK_URL=${instagramWebhook}

# =============================================================================
# TWITTER API v2
# =============================================================================
TWITTER_API_KEY=${twitterApiKey}
TWITTER_API_SECRET=${twitterApiSecret}
TWITTER_ACCESS_TOKEN=${twitterAccessToken}
TWITTER_ACCESS_TOKEN_SECRET=${twitterAccessTokenSecret}
TWITTER_BEARER_TOKEN=${twitterBearerToken}
TWITTER_WEBHOOK_URL=${twitterWebhook}

# =============================================================================
# FILE UPLOAD & STORAGE
# =============================================================================
MAX_FILE_SIZE=${maxFileSize}
UPLOAD_PATH=${uploadPath}
ALLOWED_FILE_TYPES=${allowedFileTypes}

# =============================================================================
# LOGGING & MONITORING
# =============================================================================
LOG_LEVEL=info
LOG_FILE_PATH=./logs
ENABLE_REQUEST_LOGGING=true

# =============================================================================
# SECURITY & RATE LIMITING
# =============================================================================
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
CORS_ORIGIN=http://localhost:${port},https://yourdomain.com

# =============================================================================
# DEVELOPMENT OVERRIDES
# =============================================================================
ENABLE_MOCK_DATA=false
ENABLE_API_LOGGING=false
`;

    // Write .env file
    fs.writeFileSync(envPath, envContent);
    
    // Create necessary directories
    const dirs = ['logs', 'uploads'];
    dirs.forEach(dir => {
      const dirPath = path.join(process.cwd(), dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`✅ Created directory: ${dir}`);
      }
    });
    
    console.log('\n🎉 Setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Install dependencies: npm install');
    console.log('2. Start MongoDB and Redis (if using locally)');
    console.log('3. Run the application: npm run dev');
    console.log('4. Visit http://localhost:' + port);
    console.log('\n⚠️  Important:');
    console.log('- Keep your .env file secure and never commit it to version control');
    console.log('- Update webhook URLs to your actual domain when deploying');
    console.log('- Test each platform connection individually');
    
    // Generate random secrets if not provided
    if (!jwtSecret || jwtSecret.length < 32) {
      console.log('\n🔐 Security Warning:');
      console.log('Your JWT secret is too short. Consider generating a stronger one:');
      console.log('node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
    }
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  } finally {
    rl.close();
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n\nSetup cancelled by user.');
  rl.close();
  process.exit(0);
});

// Start setup
setup();
