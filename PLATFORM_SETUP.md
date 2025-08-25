# 🔧 Platform Setup Guide

Complete setup instructions for all messaging platforms integrated in the Unified Messaging Dashboard.

## 📋 Prerequisites

Before setting up any platform, ensure you have:

- ✅ Node.js 16+ installed
- ✅ MongoDB running locally or cloud instance
- ✅ Redis server running
- ✅ Domain name with SSL certificate (for production)
- ✅ Basic understanding of API authentication

---

## 📱 Telegram Bot Setup

### **Step 1: Create Telegram Bot**

1. **Open Telegram** and search for `@BotFather`
2. **Send command**: `/newbot`
3. **Choose bot name**: Enter a display name (e.g., "My Unified Inbox Bot")
4. **Choose username**: Enter a unique username ending with "bot" (e.g., "myunifiedinbox_bot")
5. **Save the token**: Copy the HTTP API token provided

### **Step 2: Configure Environment**

Add to your `.env` file:
```env
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_WEBHOOK_URL=https://yourdomain.com/api/webhooks/telegram
TELEGRAM_WEBHOOK_SECRET=your_secure_webhook_secret
```

### **Step 3: Set Webhook**

```bash
# Start your server first
npm start

# Set webhook (replace with your actual values)
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://yourdomain.com/api/webhooks/telegram",
    "secret_token": "your_secure_webhook_secret"
  }'
```

### **Step 4: Test Integration**

1. Send a message to your bot on Telegram
2. Check your dashboard for incoming messages
3. Try replying from the dashboard

### **Features Available**
- ✅ Receive messages from users
- ✅ Send text messages
- ✅ Support for photos, documents, voice messages
- ✅ Group chat support
- ✅ Real-time updates

---

## 📧 Gmail API Setup

### **Step 1: Google Cloud Console Setup**

1. **Go to** [Google Cloud Console](https://console.cloud.google.com/)
2. **Create new project** or select existing one
3. **Enable APIs**:
   - Gmail API
   - Google+ API (if needed)
4. **Go to Credentials** section

### **Step 2: Create OAuth 2.0 Credentials**

1. **Click "Create Credentials"** → "OAuth 2.0 Client IDs"
2. **Configure consent screen**:
   - User Type: External
   - App name: "Unified Inbox"
   - User support email: your email
   - Developer contact: your email
3. **Create OAuth client ID**:
   - Application type: Web application
   - Name: "Unified Inbox Web Client"
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/google/callback` (development)
     - `https://yourdomain.com/api/auth/google/callback` (production)

### **Step 3: Configure Environment**

Add to your `.env` file:
```env
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
GOOGLE_API_KEY=your_google_api_key
```

### **Step 4: Test Authentication**

1. Start your server
2. Navigate to `/api/auth/google`
3. Complete OAuth flow
4. Check dashboard for Gmail connection status

### **Features Available**
- ✅ Read emails from Gmail
- ✅ Send new emails
- ✅ Reply to emails
- ✅ Support for attachments
- ✅ Thread management

---

## 💬 WhatsApp Business API Setup

### **Step 1: Apply for WhatsApp Business API**

1. **Go to** [Meta for Developers](https://developers.facebook.com/)
2. **Create app** or use existing Facebook app
3. **Add WhatsApp product** to your app
4. **Complete business verification** (required for approval)

### **Step 2: Configure WhatsApp Business**

1. **Set up business profile**:
   - Business name
   - Business description
   - Business address
   - Business website
2. **Add phone number**:
   - Use business phone number
   - Verify ownership via SMS/call
3. **Configure webhook**:
   - Webhook URL: `https://yourdomain.com/api/webhooks/whatsapp`
   - Verify token: Create a secure random string

### **Step 3: Configure Environment**

Add to your `.env` file:
```env
WHATSAPP_ACCESS_TOKEN=your_whatsapp_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_VERIFY_TOKEN=your_webhook_verify_token
WHATSAPP_WEBHOOK_URL=https://yourdomain.com/api/webhooks/whatsapp
```

### **Step 4: Set Webhook**

```bash
# Verify webhook (WhatsApp will call this)
GET /api/webhooks/whatsapp?hub.mode=subscribe&hub.challenge=CHALLENGE_ACCEPTED&hub.verify_token=YOUR_VERIFY_TOKEN

# Webhook endpoint for incoming messages
POST /api/webhooks/whatsapp
```

### **Features Available**
- ✅ Send text messages
- ✅ Send media messages
- ✅ Receive incoming messages
- ✅ Message status updates
- ✅ Business messaging features

---

## 📸 Instagram Graph API Setup

### **Step 1: Facebook App Setup**

1. **Go to** [Facebook Developers](https://developers.facebook.com/)
2. **Create app** or use existing app
3. **Add Instagram Basic Display** product
4. **Configure Instagram Basic Display**:
   - Valid OAuth Redirect URIs
   - Deauthorize Callback URL
   - Data Deletion Request URL

### **Step 2: Instagram Account Connection**

1. **Connect Instagram account** to your app
2. **Request permissions**:
   - `instagram_basic`
   - `instagram_manage_comments`
   - `instagram_manage_insights`
3. **Generate access token**

### **Step 3: Configure Environment**

Add to your `.env` file:
```env
INSTAGRAM_APP_ID=your_facebook_app_id
INSTAGRAM_APP_SECRET=your_facebook_app_secret
INSTAGRAM_ACCESS_TOKEN=your_instagram_access_token
INSTAGRAM_WEBHOOK_URL=https://yourdomain.com/api/webhooks/instagram
```

### **Step 4: Set Webhook**

```bash
# Instagram webhook endpoint
POST /api/webhooks/instagram
```

### **Features Available**
- ✅ Send direct messages
- ✅ Receive direct messages
- ✅ View message history
- ✅ Business account features

---

## 🐦 Twitter API v2 Setup

### **Step 1: Twitter Developer Account**

1. **Apply for** [Twitter Developer Account](https://developer.twitter.com/)
2. **Complete application**:
   - Explain your use case
   - Describe how you'll use the API
   - Provide examples of your project
3. **Wait for approval** (can take 1-2 weeks)

### **Step 2: Create Twitter App**

1. **Go to** [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. **Create new app**:
   - App name: "Unified Inbox"
   - App description: "Unified messaging dashboard"
3. **Configure app permissions**:
   - Read and Write permissions
   - Direct message access

### **Step 3: Generate Tokens**

1. **Create OAuth 2.0 tokens**:
   - Client ID
   - Client Secret
   - Bearer Token
2. **Create user access tokens**:
   - Access Token
   - Access Token Secret

### **Step 4: Configure Environment**

Add to your `.env` file:
```env
TWITTER_API_KEY=your_twitter_api_key
TWITTER_API_SECRET=your_twitter_api_secret
TWITTER_ACCESS_TOKEN=your_twitter_access_token
TWITTER_ACCESS_TOKEN_SECRET=your_twitter_access_token_secret
TWITTER_BEARER_TOKEN=your_twitter_bearer_token
TWITTER_WEBHOOK_URL=https://yourdomain.com/api/webhooks/twitter
```

### **Step 5: Set Webhook**

```bash
# Twitter webhook endpoint
POST /api/webhooks/twitter
```

### **Features Available**
- ✅ Send direct messages
- ✅ Receive direct messages
- ✅ Message threading
- ✅ Media support

---

## 🔐 Security Best Practices

### **Webhook Security**

1. **Use HTTPS** for all webhook URLs
2. **Implement signature verification**:
   - Telegram: `secret_token`
   - WhatsApp: `hub.verify_token`
   - Instagram: Webhook verification
   - Twitter: CRC token verification

3. **Rate limiting** on webhook endpoints
4. **Input validation** for all incoming data

### **API Key Security**

1. **Never commit** API keys to version control
2. **Use environment variables** for all secrets
3. **Rotate keys** regularly
4. **Monitor API usage** for anomalies

### **Data Privacy**

1. **Encrypt sensitive data** at rest
2. **Implement data retention** policies
3. **GDPR compliance** for EU users
4. **User consent** for data collection

---

## 🧪 Testing Your Setup

### **Health Check Endpoints**

```bash
# Overall system health
GET /api/health

# Platform-specific status
GET /api/platforms/telegram/status
GET /api/platforms/gmail/status
GET /api/platforms/whatsapp/status
GET /api/platforms/instagram/status
GET /api/platforms/twitter/status
```

### **Test Message Sending**

```bash
# Send test message via Telegram
POST /api/messages
{
  "platform": "telegram",
  "recipientId": "your_chat_id",
  "text": "Test message from Unified Inbox"
}

# Send test email via Gmail
POST /api/messages
{
  "platform": "gmail",
  "recipient": "test@example.com",
  "subject": "Test Email",
  "text": "Test message from Unified Inbox"
}
```

### **Webhook Testing**

Use tools like [ngrok](https://ngrok.com/) for local testing:

```bash
# Install ngrok
npm install -g ngrok

# Start tunnel
ngrok http 3000

# Use the HTTPS URL for webhook testing
# https://abc123.ngrok.io/api/webhooks/telegram
```

---

## 🚨 Troubleshooting

### **Common Issues**

#### **Telegram**
- **Bot not responding**: Check webhook URL and token
- **Messages not received**: Verify webhook is set correctly
- **Permission denied**: Ensure bot has necessary permissions

#### **Gmail**
- **Authentication failed**: Check OAuth credentials and redirect URI
- **API quota exceeded**: Monitor usage and implement rate limiting
- **Scope issues**: Ensure Gmail API is enabled

#### **WhatsApp**
- **Webhook verification failed**: Check verify token
- **Message not sent**: Verify phone number ID and access token
- **Business approval pending**: Wait for Meta approval

#### **Instagram**
- **Permission denied**: Check app permissions and access token
- **Webhook not working**: Verify webhook configuration
- **Rate limiting**: Implement proper rate limiting

#### **Twitter**
- **API access denied**: Wait for developer account approval
- **Rate limit exceeded**: Implement exponential backoff
- **Webhook setup failed**: Check app permissions

### **Debug Mode**

Enable debug logging in your `.env`:

```env
LOG_LEVEL=debug
ENABLE_API_LOGGING=true
```

### **Log Files**

Check log files for detailed error information:

```bash
# View platform service logs
tail -f logs/platform-service.log

# View message service logs
tail -f logs/message-service.log

# View webhook logs
tail -f logs/webhook-service.log
```

---

## 📚 Additional Resources

### **Official Documentation**
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Gmail API](https://developers.google.com/gmail/api)
- [WhatsApp Business API](https://developers.facebook.com/docs/whatsapp/)
- [Instagram Graph API](https://developers.facebook.com/docs/instagram-api/)
- [Twitter API v2](https://developer.twitter.com/en/docs/twitter-api)

### **Community Support**
- [GitHub Issues](https://github.com/yourusername/unified-messaging-dashboard/issues)
- [Discord Server](https://discord.gg/yourinvite)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/unified-inbox)

### **Development Tools**
- [Postman](https://www.postman.com/) - API testing
- [ngrok](https://ngrok.com/) - Local webhook testing
- [MongoDB Compass](https://www.mongodb.com/products/compass) - Database management
- [Redis Insight](https://redis.com/redis-enterprise/redis-insight/) - Redis management

---

## ✅ Setup Checklist

### **Before Starting**
- [ ] Node.js 16+ installed
- [ ] MongoDB running
- [ ] Redis server running
- [ ] Domain with SSL (production)
- [ ] Environment file created

### **Platform Setup**
- [ ] Telegram bot created and configured
- [ ] Gmail API enabled and OAuth configured
- [ ] WhatsApp Business API approved and configured
- [ ] Instagram Graph API configured
- [ ] Twitter API v2 approved and configured

### **Testing**
- [ ] All platforms show "Connected" status
- [ ] Can send test messages from each platform
- [ ] Can receive messages from each platform
- [ ] Webhooks are working correctly
- [ ] Real-time updates are functioning

### **Security**
- [ ] All API keys are in environment variables
- [ ] Webhook verification is implemented
- [ ] Rate limiting is configured
- [ ] HTTPS is enforced (production)
- [ ] Input validation is working

---

**Need help?** Check our [troubleshooting guide](TROUBLESHOOTING.md) or [create an issue](https://github.com/yourusername/unified-messaging-dashboard/issues) on GitHub.
