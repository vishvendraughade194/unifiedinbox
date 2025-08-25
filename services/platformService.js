const TelegramBot = require('node-telegram-bot-api');
const { google } = require('googleapis');
const axios = require('axios');
const winston = require('winston');

// Configure logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'platform-service' },
  transports: [
    new winston.transports.File({ filename: 'logs/platform-service.log' }),
    new winston.transports.Console()
  ]
});

class PlatformService {
  constructor() {
    this.platforms = new Map();
    this.webhooks = new Map();
    this.initializePlatforms();
  }

  initializePlatforms() {
    // Initialize Telegram
    if (process.env.TELEGRAM_BOT_TOKEN) {
      try {
        const telegramBot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { 
          polling: false,
          webHook: {
            port: process.env.PORT || 3000,
            host: process.env.HOST || 'localhost'
          }
        });
        
        this.platforms.set('telegram', {
          instance: telegramBot,
          config: {
            name: 'Telegram',
            icon: '📨',
            color: '#0088CC',
            features: ['send', 'receive', 'attachments', 'groups'],
            status: 'connected'
          },
          methods: {
            sendMessage: this.sendTelegramMessage.bind(this),
            getUpdates: this.getTelegramUpdates.bind(this),
            setWebhook: this.setTelegramWebhook.bind(this)
          }
        });
        logger.info('Telegram platform initialized successfully');
      } catch (error) {
        logger.error('Failed to initialize Telegram platform:', error);
      }
    }

    // Initialize Gmail
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
      );
      
      this.platforms.set('gmail', {
        instance: oauth2Client,
        config: {
          name: 'Gmail',
          icon: '📧',
          color: '#EA4335',
          features: ['send', 'receive', 'attachments', 'threading'],
          status: 'configured'
        },
        methods: {
          sendEmail: this.sendGmailMessage.bind(this),
          getEmails: this.getGmailMessages.bind(this),
          authenticate: this.authenticateGmail.bind(this)
        }
      });
      logger.info('Gmail platform initialized successfully');
    }

    // Initialize WhatsApp (Business API)
    if (process.env.WHATSAPP_ACCESS_TOKEN) {
      this.platforms.set('whatsapp', {
        instance: {
          accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
          phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
          apiVersion: 'v18.0'
        },
        config: {
          name: 'WhatsApp',
          icon: '💬',
          color: '#25D366',
          features: ['send', 'receive', 'attachments', 'business'],
          status: 'connected'
        },
        methods: {
          sendMessage: this.sendWhatsAppMessage.bind(this),
          getMessages: this.getWhatsAppMessages.bind(this),
          setWebhook: this.setWhatsAppWebhook.bind(this)
        }
      });
      logger.info('WhatsApp platform initialized successfully');
    }

    // Initialize Instagram Graph API
    if (process.env.INSTAGRAM_ACCESS_TOKEN) {
      this.platforms.set('instagram', {
        instance: {
          accessToken: process.env.INSTAGRAM_ACCESS_TOKEN,
          appId: process.env.INSTAGRAM_APP_ID,
          appSecret: process.env.INSTAGRAM_APP_SECRET,
          apiVersion: 'v18.0'
        },
        config: {
          name: 'Instagram',
          icon: '📸',
          color: '#E4405F',
          features: ['send', 'receive', 'attachments', 'stories'],
          status: 'connected'
        },
        methods: {
          sendDirectMessage: this.sendInstagramMessage.bind(this),
          getDirectMessages: this.getInstagramMessages.bind(this),
          setWebhook: this.setInstagramWebhook.bind(this)
        }
      });
      logger.info('Instagram platform initialized successfully');
    }

    // Initialize Twitter/X API v2
    if (process.env.TWITTER_BEARER_TOKEN) {
      this.platforms.set('twitter', {
        instance: {
          bearerToken: process.env.TWITTER_BEARER_TOKEN,
          apiKey: process.env.TWITTER_API_KEY,
          apiSecret: process.env.TWITTER_API_SECRET,
          accessToken: process.env.TWITTER_ACCESS_TOKEN,
          accessTokenSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
          apiVersion: 'v2'
        },
        config: {
          name: 'X (Twitter)',
          icon: '🐦',
          color: '#1DA1F2',
          features: ['send', 'receive', 'attachments', 'threads'],
          status: 'connected'
        },
        methods: {
          sendDirectMessage: this.sendTwitterMessage.bind(this),
          getDirectMessages: this.getTwitterMessages.bind(this),
          setWebhook: this.setTwitterWebhook.bind(this)
        }
      });
      logger.info('Twitter/X platform initialized successfully');
    }

    // Set default status for unconfigured platforms
    const allPlatforms = ['telegram', 'gmail', 'whatsapp', 'instagram', 'twitter'];
    allPlatforms.forEach(platform => {
      if (!this.platforms.has(platform)) {
        this.platforms.set(platform, {
          instance: null,
          config: {
            name: this.getPlatformDisplayName(platform),
            icon: this.getPlatformIcon(platform),
            color: this.getPlatformColor(platform),
            features: [],
            status: 'not_configured'
          },
          methods: {}
        });
      }
    });
  }

  getPlatformDisplayName(platform) {
    const names = {
      telegram: 'Telegram',
      gmail: 'Gmail',
      whatsapp: 'WhatsApp',
      instagram: 'Instagram',
      twitter: 'X (Twitter)'
    };
    return names[platform] || platform;
  }

  getPlatformIcon(platform) {
    const icons = {
      telegram: '📨',
      gmail: '📧',
      whatsapp: '💬',
      instagram: '📸',
      twitter: '🐦'
    };
    return icons[platform] || '📱';
  }

  getPlatformColor(platform) {
    const colors = {
      telegram: '#0088CC',
      gmail: '#EA4335',
      whatsapp: '#25D366',
      instagram: '#E4405F',
      twitter: '#1DA1F2'
    };
    return colors[platform] || '#666666';
  }

  // Telegram Methods
  async sendTelegramMessage(chatId, text, options = {}) {
    try {
      const platform = this.platforms.get('telegram');
      if (!platform || !platform.instance) {
        throw new Error('Telegram platform not configured');
      }

      const result = await platform.instance.sendMessage(chatId, text, options);
      logger.info(`Telegram message sent to ${chatId}`);
      return result;
    } catch (error) {
      logger.error('Error sending Telegram message:', error);
      throw error;
    }
  }

  async getTelegramUpdates(offset = 0, limit = 100) {
    try {
      const platform = this.platforms.get('telegram');
      if (!platform || !platform.instance) {
        throw new Error('Telegram platform not configured');
      }

      const updates = await platform.instance.getUpdates({ offset, limit });
      return updates;
    } catch (error) {
      logger.error('Error getting Telegram updates:', error);
      throw error;
    }
  }

  async setTelegramWebhook(url, secret) {
    try {
      const platform = this.platforms.get('telegram');
      if (!platform || !platform.instance) {
        throw new Error('Telegram platform not configured');
      }

      const result = await platform.instance.setWebhook(url, { secret_token: secret });
      logger.info('Telegram webhook set successfully');
      return result;
    } catch (error) {
      logger.error('Error setting Telegram webhook:', error);
      throw error;
    }
  }

  // Gmail Methods
  async sendGmailMessage(to, subject, body, options = {}) {
    try {
      const platform = this.platforms.get('gmail');
      if (!platform || !platform.instance) {
        throw new Error('Gmail platform not configured');
      }

      const gmail = google.gmail({ version: 'v1', auth: platform.instance });
      
      const message = {
        to,
        subject,
        text: body,
        ...options
      };

      const encodedMessage = Buffer.from(JSON.stringify(message)).toString('base64');
      const result = await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage
        }
      });

      logger.info(`Gmail message sent to ${to}`);
      return result;
    } catch (error) {
      logger.error('Error sending Gmail message:', error);
      throw error;
    }
  }

  async getGmailMessages(query = '', maxResults = 10) {
    try {
      const platform = this.platforms.get('gmail');
      if (!platform || !platform.instance) {
        throw new Error('Gmail platform not configured');
      }

      const gmail = google.gmail({ version: 'v1', auth: platform.instance });
      
      const result = await gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults
      });

      return result.data;
    } catch (error) {
      logger.error('Error getting Gmail messages:', error);
      throw error;
    }
  }

  async authenticateGmail(code) {
    try {
      const platform = this.platforms.get('gmail');
      if (!platform || !platform.instance) {
        throw new Error('Gmail platform not configured');
      }

      const { tokens } = await platform.instance.getToken(code);
      platform.instance.setCredentials(tokens);
      
      logger.info('Gmail authentication successful');
      return tokens;
    } catch (error) {
      logger.error('Error authenticating Gmail:', error);
      throw error;
    }
  }

  // WhatsApp Methods
  async sendWhatsAppMessage(to, text, options = {}) {
    try {
      const platform = this.platforms.get('whatsapp');
      if (!platform || !platform.instance) {
        throw new Error('WhatsApp platform not configured');
      }

      const { accessToken, phoneNumberId, apiVersion } = platform.instance;
      const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;

      const messageData = {
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: text },
        ...options
      };

      const response = await axios.post(url, messageData, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      logger.info(`WhatsApp message sent to ${to}`);
      return response.data;
    } catch (error) {
      logger.error('Error sending WhatsApp message:', error);
      throw error;
    }
  }

  async getWhatsAppMessages(phoneNumberId, limit = 10) {
    try {
      const platform = this.platforms.get('whatsapp');
      if (!platform || !platform.instance) {
        throw new Error('WhatsApp platform not configured');
      }

      const { accessToken, apiVersion } = platform.instance;
      const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;

      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        params: { limit }
      });

      return response.data;
    } catch (error) {
      logger.error('Error getting WhatsApp messages:', error);
      throw error;
    }
  }

  async setWhatsAppWebhook(url, verifyToken) {
    try {
      const platform = this.platforms.get('whatsapp');
      if (!platform || !platform.instance) {
        throw new Error('WhatsApp platform not configured');
      }

      const { accessToken, phoneNumberId, apiVersion } = platform.instance;
      const webhookUrl = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/subscribed_apps`;

      const response = await axios.post(webhookUrl, {
        access_token: accessToken,
        callback_url: url,
        verify_token: verifyToken
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      logger.info('WhatsApp webhook set successfully');
      return response.data;
    } catch (error) {
      logger.error('Error setting WhatsApp webhook:', error);
      throw error;
    }
  }

  // Instagram Methods
  async sendInstagramMessage(recipientId, text, options = {}) {
    try {
      const platform = this.platforms.get('instagram');
      if (!platform || !platform.instance) {
        throw new Error('Instagram platform not configured');
      }

      const { accessToken, appId, apiVersion } = platform.instance;
      const url = `https://graph.facebook.com/${apiVersion}/${appId}/messages`;

      const messageData = {
        recipient_type: 'instagram',
        message: {
          text
        },
        ...options
      };

      const response = await axios.post(url, messageData, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      logger.info(`Instagram message sent to ${recipientId}`);
      return response.data;
    } catch (error) {
      logger.error('Error sending Instagram message:', error);
      throw error;
    }
  }

  async getInstagramMessages(limit = 10) {
    try {
      const platform = this.platforms.get('instagram');
      if (!platform || !platform.instance) {
        throw new Error('Instagram platform not configured');
      }

      const { accessToken, appId, apiVersion } = platform.instance;
      const url = `https://graph.facebook.com/${apiVersion}/${appId}/conversations`;

      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        params: { limit }
      });

      return response.data;
    } catch (error) {
      logger.error('Error getting Instagram messages:', error);
      throw error;
    }
  }

  async setInstagramWebhook(url, verifyToken) {
    try {
      const platform = this.platforms.get('instagram');
      if (!platform || !platform.instance) {
        throw new Error('Instagram platform not configured');
      }

      const { accessToken, appId, apiVersion } = platform.instance;
      const webhookUrl = `https://graph.facebook.com/${apiVersion}/${appId}/subscriptions`;

      const response = await axios.post(webhookUrl, {
        access_token: accessToken,
        callback_url: url,
        verify_token: verifyToken,
        object: 'instagram',
        fields: ['messages', 'messaging_postbacks']
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      logger.info('Instagram webhook set successfully');
      return response.data;
    } catch (error) {
      logger.error('Error setting Instagram webhook:', error);
      throw error;
    }
  }

  // Twitter/X Methods
  async sendTwitterMessage(recipientId, text, options = {}) {
    try {
      const platform = this.platforms.get('twitter');
      if (!platform || !platform.instance) {
        throw new Error('Twitter/X platform not configured');
      }

      const { bearerToken, apiVersion } = platform.instance;
      const url = `https://api.twitter.com/${apiVersion}/direct_messages/events/new.json`;

      const messageData = {
        event: {
          type: 'message_create',
          message_create: {
            target: { recipient_id: recipientId },
            message_data: { text }
          }
        },
        ...options
      };

      const response = await axios.post(url, messageData, {
        headers: {
          'Authorization': `Bearer ${bearerToken}`,
          'Content-Type': 'application/json'
        }
      });

      logger.info(`Twitter/X message sent to ${recipientId}`);
      return response.data;
    } catch (error) {
      logger.error('Error sending Twitter/X message:', error);
      throw error;
    }
  }

  async getTwitterMessages(limit = 10) {
    try {
      const platform = this.platforms.get('twitter');
      if (!platform || !platform.instance) {
        throw new Error('Twitter/X platform not configured');
      }

      const { bearerToken, apiVersion } = platform.instance;
      const url = `https://api.twitter.com/${apiVersion}/direct_messages/events/list.json`;

      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${bearerToken}`
        },
        params: { count: limit }
      });

      return response.data;
    } catch (error) {
      logger.error('Error getting Twitter/X messages:', error);
      throw error;
    }
  }

  async setTwitterWebhook(url, env) {
    try {
      const platform = this.platforms.get('twitter');
      if (!platform || !platform.instance) {
        throw new Error('Twitter/X platform not configured');
      }

      const { bearerToken, apiVersion } = platform.instance;
      const webhookUrl = `https://api.twitter.com/${apiVersion}/account_activity/all/${env}/webhooks.json`;

      const response = await axios.post(webhookUrl, {
        url,
        env
      }, {
        headers: {
          'Authorization': `Bearer ${bearerToken}`,
          'Content-Type': 'application/json'
        }
      });

      logger.info('Twitter/X webhook set successfully');
      return response.data;
    } catch (error) {
      logger.error('Error setting Twitter/X webhook:', error);
      throw error;
    }
  }

  // Platform Status Methods
  async getPlatformStatus(platformName) {
    const platform = this.platforms.get(platformName);
    if (!platform) {
      return { status: 'not_found', message: 'Platform not found' };
    }

    try {
      // Test platform connectivity
      let status = 'unknown';
      let message = 'Status check not implemented';

      switch (platformName) {
        case 'telegram':
          if (platform.instance) {
            const me = await platform.instance.getMe();
            status = 'connected';
            message = `Connected as @${me.username}`;
          }
          break;
        case 'gmail':
          if (platform.instance && platform.instance.credentials) {
            status = 'authenticated';
            message = 'Gmail API authenticated';
          } else {
            status = 'configured';
            message = 'Gmail API configured but not authenticated';
          }
          break;
        case 'whatsapp':
          if (platform.instance && platform.instance.accessToken) {
            status = 'connected';
            message = 'WhatsApp Business API connected';
          }
          break;
        case 'instagram':
          if (platform.instance && platform.instance.accessToken) {
            status = 'connected';
            message = 'Instagram Graph API connected';
          }
          break;
        case 'twitter':
          if (platform.instance && platform.instance.bearerToken) {
            status = 'connected';
            message = 'Twitter API v2 connected';
          }
          break;
      }

      return { status, message };
    } catch (error) {
      logger.error(`Error checking ${platformName} status:`, error);
      return { status: 'error', message: error.message };
    }
  }

  async getAllPlatformStatuses() {
    const statuses = {};
    for (const [platformName, platform] of this.platforms) {
      statuses[platformName] = await this.getPlatformStatus(platformName);
    }
    return statuses;
  }

  // Webhook Management
  async registerWebhook(platform, url, secret) {
    try {
      switch (platform) {
        case 'telegram':
          return await this.setTelegramWebhook(url, secret);
        case 'whatsapp':
          return await this.setWhatsAppWebhook(url, secret);
        case 'instagram':
          return await this.setInstagramWebhook(url, secret);
        case 'twitter':
          return await this.setTwitterWebhook(url, 'development');
        default:
          throw new Error(`Unsupported platform: ${platform}`);
      }
    } catch (error) {
      logger.error(`Error registering webhook for ${platform}:`, error);
      throw error;
    }
  }

  // Utility Methods
  getPlatforms() {
    return Array.from(this.platforms.entries()).map(([key, platform]) => ({
      name: key,
      ...platform.config,
      hasInstance: !!platform.instance
    }));
  }

  getPlatform(platformName) {
    return this.platforms.get(platformName);
  }

  isPlatformConfigured(platformName) {
    const platform = this.platforms.get(platformName);
    return platform && platform.instance && platform.config.status !== 'not_configured';
  }
}

module.exports = new PlatformService();
