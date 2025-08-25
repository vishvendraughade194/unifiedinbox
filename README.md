# 🚀 Unified Messaging Dashboard

A powerful, real-time messaging dashboard that integrates **Telegram**, **Gmail**, **WhatsApp**, **Instagram**, and **X (Twitter)** into a single, unified interface.

## ✨ Features

### 🔌 **Multi-Platform Integration**
- **Telegram**: Full bot API integration with webhook support
- **Gmail**: OAuth 2.0 authentication with Gmail API
- **WhatsApp**: Business API integration for messaging
- **Instagram**: Graph API for direct messaging
- **X (Twitter)**: API v2 for direct messages and interactions

### 💬 **Unified Messaging**
- **Centralized Inbox**: View all messages from all platforms in one place
- **Real-time Updates**: Live message synchronization via WebSockets
- **Conversation Management**: Group related messages into conversations
- **Cross-platform Search**: Search across all platforms simultaneously
- **Message Threading**: Maintain conversation context across platforms

### 🎨 **Modern UI/UX**
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Dark/Light Themes**: Customizable appearance
- **Real-time Notifications**: Desktop and sound alerts
- **Drag & Drop**: Easy file attachments and organization
- **Keyboard Shortcuts**: Power user navigation

### 🔒 **Security & Privacy**
- **OAuth 2.0 Authentication**: Secure platform connections
- **JWT Tokens**: Secure session management
- **Rate Limiting**: API abuse prevention
- **Data Encryption**: Secure message storage
- **GDPR Compliance**: Data privacy controls

### 🤖 **AI-Powered Intelligence**
- **Smart Message Categorization**: Automatic classification using NLP
- **Sentiment Analysis**: Detect message tone and emotion
- **Smart Reply Suggestions**: AI-generated contextual responses
- **Keyword Extraction**: Identify important terms and topics
- **Demo Mode**: Test AI features without API keys

## 🏗️ Architecture

### **Frontend**
- **HTML5/CSS3**: Modern, semantic markup with CSS Grid/Flexbox
- **Vanilla JavaScript**: No framework dependencies for maximum performance
- **Socket.IO Client**: Real-time communication
- **GSAP Animations**: Smooth, professional animations

### **Backend**
- **Node.js**: High-performance JavaScript runtime
- **Express.js**: Fast, unopinionated web framework
- **Socket.IO**: Real-time bidirectional communication
- **MongoDB**: Scalable document database
- **Redis**: High-performance caching and session storage

### **Services**
- **Platform Service**: Manages all platform integrations
- **Message Service**: Handles message processing and storage
- **Webhook Service**: Processes incoming platform notifications
- **Authentication Service**: Manages user sessions and platform auth

## 🚀 Quick Start

### **Prerequisites**
- Node.js 16+ 
- MongoDB 5+
- Redis 6+
- Platform API credentials (see configuration below)

### **Installation**

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/unified-messaging-dashboard.git
   cd unified-messaging-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp env.example .env
   # Edit .env with your platform credentials
   # Note: OpenAI API key is optional - AI features work without it
   ```

4. **Start the application**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   
   # Docker deployment
   npm run docker:up
   ```

5. **Access the dashboard**
   ```
   http://localhost:3000
   ```

## ⚙️ Configuration

### **Environment Variables**

#### **Server Configuration**
```env
NODE_ENV=development
PORT=3000
HOST=localhost
```

#### **Database Configuration**
```env
MONGODB_URI=mongodb://localhost:27017/unified-inbox
REDIS_URL=redis://localhost:6379
```

#### **Authentication**
```env
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_SECRET=your-refresh-token-secret
```

#### **Platform APIs**

**Telegram Bot API**
```env
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_WEBHOOK_URL=https://yourdomain.com/api/webhooks/telegram
TELEGRAM_WEBHOOK_SECRET=your_webhook_secret
```

**Gmail API**
```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
```

**WhatsApp Business API**
```env
WHATSAPP_ACCESS_TOKEN=your_whatsapp_access_token
WHATSAPP_PHONE_NUMBER_ID=your_whatsapp_phone_number_id
WHATSAPP_VERIFY_TOKEN=your_webhook_verify_token
```

**Instagram Graph API**
```env
INSTAGRAM_APP_ID=your_instagram_app_id
INSTAGRAM_APP_SECRET=your_instagram_app_secret
INSTAGRAM_ACCESS_TOKEN=your_instagram_access_token
```

**Twitter API v2**
```env
TWITTER_API_KEY=your_twitter_api_key
TWITTER_API_SECRET=your_twitter_api_secret
TWITTER_ACCESS_TOKEN=your_twitter_access_token
TWITTER_BEARER_TOKEN=your_twitter_bearer_token
```

#### **AI & Machine Learning (Optional)**
```env
# OpenAI API Key for advanced AI features
# Without this, the system uses fallback methods (rule-based + TF-IDF)
OPENAI_API_KEY=your_openai_api_key_here
```

## 🔧 Platform Setup

### **1. Telegram Bot Setup**
1. Create a bot via [@BotFather](https://t.me/botfather)
2. Get your bot token
3. Set webhook URL in your environment
4. Configure webhook secret for security

### **2. Gmail API Setup**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Gmail API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs

### **3. WhatsApp Business API**
1. Apply for [WhatsApp Business API](https://developers.facebook.com/docs/whatsapp/)
2. Get approval from Meta

3. Configure webhook endpoints
4. Set up message templates

### **4. Instagram Graph API**
1. Create a [Facebook App](https://developers.facebook.com/)
2. Add Instagram Basic Display
3. Configure permissions for messaging
4. Generate access tokens

### **5. Twitter API v2**
1. Apply for [Twitter Developer Account](https://developer.twitter.com/)
2. Create an app in the developer portal
3. Generate API keys and tokens
4. Configure webhook endpoints

## 📱 Usage

### **Dashboard Overview**
- **Sidebar**: Platform filters and connection status
- **Conversations Panel**: List of all conversations
- **Messages Panel**: View and reply to messages
- **Compose Modal**: Send new messages to any platform

### **Key Features**
- **Platform Filtering**: View messages by specific platform
- **Real-time Updates**: Messages appear instantly
- **Search**: Find messages across all platforms
- **Conversation View**: Threaded message display
- **File Attachments**: Support for images, documents, and media

### **Keyboard Shortcuts**
- `Ctrl/Cmd + N`: New conversation
- `Ctrl/Cmd + F`: Search messages
- `Ctrl/Cmd + R`: Refresh messages
- `Ctrl/Cmd + ,`: Open settings
- `Esc`: Close modals

## 🚀 Deployment

### **Docker Deployment**
```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### **Production Deployment**
1. **Environment Setup**
   ```bash
   NODE_ENV=production
   PORT=80
   HOST=0.0.0.0
   ```

2. **SSL Configuration**
   - Use reverse proxy (Nginx/Apache)
   - Configure Let's Encrypt certificates
   - Set up secure webhook URLs

3. **Scaling**
   - Use PM2 for process management
   - Implement load balancing
   - Set up Redis clustering

## 🔍 API Reference

### **Authentication Endpoints**
```
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh
GET  /api/auth/google
GET  /api/auth/google/callback
```

### **Message Endpoints**
```
GET    /api/messages
POST   /api/messages
GET    /api/messages/:id
PUT    /api/messages/:id
DELETE /api/messages/:id
```

### **Platform Endpoints**
```
GET    /api/platforms
GET    /api/platforms/:name/status
POST   /api/platforms/:name/webhook
```

### **Webhook Endpoints**
```
POST /api/webhooks/telegram
POST /api/webhooks/whatsapp
POST /api/webhooks/instagram
POST /api/webhooks/twitter
```

## 🧪 Testing

### **Run Tests**
```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e
```

### **Test Coverage**
```bash
npm run test:coverage
```

## 📊 Monitoring & Logging

### **Logging**
- **Winston**: Structured logging with multiple transports
- **File Rotation**: Automatic log file management
- **Error Tracking**: Detailed error reporting

### **Health Checks**
```
GET /api/health
GET /api/health/platforms
GET /api/health/database
```

### **Metrics**
- Message throughput
- Platform response times
- Error rates
- User activity

## 🔒 Security Considerations

### **Data Protection**
- **Encryption at Rest**: Database encryption
- **Encryption in Transit**: HTTPS/TLS
- **Access Control**: Role-based permissions
- **Audit Logging**: Complete activity tracking

### **API Security**
- **Rate Limiting**: Prevent abuse
- **Input Validation**: Sanitize all inputs
- **CORS Configuration**: Restrict origins
- **Helmet.js**: Security headers

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**
3. **Make your changes**
4. **Add tests**
5. **Submit a pull request**

### **Development Guidelines**
- Follow ESLint configuration
- Write meaningful commit messages
- Update documentation
- Add tests for new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### **Documentation**
- [API Reference](docs/API.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)

### **Community**
- [GitHub Issues](https://github.com/yourusername/unified-messaging-dashboard/issues)
- [Discussions](https://github.com/yourusername/unified-messaging-dashboard/discussions)
- [Wiki](https://github.com/yourusername/unified-messaging-dashboard/wiki)

### **Contact**
- **Email**: support@yourdomain.com
- **Discord**: [Join our server](https://discord.gg/yourinvite)

## 🎯 Roadmap

### **v1.1.0** (Next Release)
- [ ] Voice message support
- [ ] Video calling integration
- [ ] Advanced search filters
- [ ] Message scheduling

### **v1.2.0** (Future)
- [ ] Mobile app (React Native)
- [ ] AI-powered message categorization
- [ ] Advanced analytics dashboard
- [ ] Multi-language support

### **v2.0.0** (Major Release)
- [ ] Enterprise features
- [ ] Team collaboration tools
- [ ] Advanced security features
- [ ] API marketplace

---

**Built with ❤️ by the Unified Inbox Team**

*Transform your messaging experience with the power of unified communication.* .
