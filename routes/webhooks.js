const express = require('express');
const router = express.Router();
const platformService = require('../services/platformService');
const messageService = require('../services/messageService');
const winston = require('winston');

// Configure logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'webhook-routes' },
  transports: [
    new winston.transports.File({ filename: 'logs/webhook-routes.log' }),
    new winston.transports.Console()
  ]
});

// =============================================================================
// TELEGRAM WEBHOOK
// =============================================================================
router.post('/telegram', async (req, res) => {
  try {
    const { message, edited_message, channel_post, edited_channel_post } = req.body;
    
    if (!message && !edited_message && !channel_post && !edited_channel_post) {
      return res.status(200).json({ ok: true, message: 'No message content' });
    }

    const msg = message || edited_message || channel_post || edited_channel_post;
    
    // Create unified message format
    const unifiedMessage = {
      platform: 'telegram',
      sender: msg.from.username || msg.from.first_name || 'Unknown',
      senderId: msg.from.id.toString(),
      recipient: msg.chat.username || msg.chat.title || 'Unknown',
      recipientId: msg.chat.id.toString(),
      text: msg.text || msg.caption || '',
      timestamp: new Date(msg.date * 1000),
      type: 'message',
      platformMessageId: msg.message_id.toString(),
      metadata: {
        chatType: msg.chat.type,
        isEdited: !!edited_message || !!edited_channel_post,
        hasMedia: !!(msg.photo || msg.video || msg.document || msg.audio || msg.voice)
      }
    };

    // Handle media attachments
    if (msg.photo || msg.video || msg.document || msg.audio || msg.voice) {
      unifiedMessage.attachments = [];
      
      if (msg.photo) {
        unifiedMessage.attachments.push({
          type: 'image',
          url: msg.photo[msg.photo.length - 1].file_id, // Get highest quality
          platform: 'telegram'
        });
      }
      
      if (msg.video) {
        unifiedMessage.attachments.push({
          type: 'video',
          url: msg.video.file_id,
          platform: 'telegram'
        });
      }
      
      if (msg.document) {
        unifiedMessage.attachments.push({
          type: 'document',
          url: msg.document.file_id,
          filename: msg.document.file_name,
          platform: 'telegram'
        });
      }
    }

    // Store message
    const savedMessage = await messageService.createMessage(unifiedMessage);
    
    // Emit real-time update
    req.app.get('io').to('platform:telegram').emit('message:new', savedMessage);
    
    logger.info(`Telegram message processed: ${savedMessage.id}`);
    res.status(200).json({ ok: true, messageId: savedMessage.id });
    
  } catch (error) {
    logger.error('Error processing Telegram webhook:', error);
    res.status(500).json({ ok: false, error: 'Internal server error' });
  }
});

// =============================================================================
// WHATSAPP WEBHOOK
// =============================================================================
router.get('/whatsapp', (req, res) => {
  try {
    const { 'hub.mode': mode, 'hub.verify_token': token, 'hub.challenge': challenge } = req.query;
    
    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      logger.info('WhatsApp webhook verified successfully');
      res.status(200).send(challenge);
    } else {
      logger.warn('WhatsApp webhook verification failed');
      res.status(403).send('Forbidden');
    }
  } catch (error) {
    logger.error('Error verifying WhatsApp webhook:', error);
    res.status(500).send('Internal server error');
  }
});

router.post('/whatsapp', async (req, res) => {
  try {
    const { object, entry } = req.body;
    
    if (object !== 'whatsapp_business_account') {
      return res.status(200).json({ ok: true, message: 'Not a WhatsApp message' });
    }

    for (const entryItem of entry) {
      for (const change of entryItem.changes) {
        if (change.value?.messages) {
          for (const message of change.value.messages) {
            // Create unified message format
            const unifiedMessage = {
              platform: 'whatsapp',
              sender: message.from,
              senderId: message.from,
              recipient: change.value.metadata.phone_number_id,
              recipientId: change.value.metadata.phone_number_id,
              text: message.text?.body || '',
              timestamp: new Date(parseInt(message.timestamp) * 1000),
              type: 'message',
              platformMessageId: message.id,
              metadata: {
                messageType: message.type,
                phoneNumberId: change.value.metadata.phone_number_id
              }
            };

            // Handle media attachments
            if (message.image || message.video || message.document || message.audio) {
              unifiedMessage.attachments = [];
              
              if (message.image) {
                unifiedMessage.attachments.push({
                  type: 'image',
                  url: message.image.id,
                  platform: 'whatsapp'
                });
              }
              
              if (message.video) {
                unifiedMessage.attachments.push({
                  type: 'video',
                  url: message.video.id,
                  platform: 'whatsapp'
                });
              }
              
              if (message.document) {
                unifiedMessage.attachments.push({
                  type: 'document',
                  url: message.document.id,
                  filename: message.document.filename,
                  platform: 'whatsapp'
                });
              }
            }

            // Store message
            const savedMessage = await messageService.createMessage(unifiedMessage);
            
            // Emit real-time update
            req.app.get('io').to('platform:whatsapp').emit('message:new', savedMessage);
            
            logger.info(`WhatsApp message processed: ${savedMessage.id}`);
          }
        }
      }
    }
    
    res.status(200).json({ ok: true });
    
  } catch (error) {
    logger.error('Error processing WhatsApp webhook:', error);
    res.status(500).json({ ok: false, error: 'Internal server error' });
  }
});

// =============================================================================
// INSTAGRAM WEBHOOK
// =============================================================================
router.get('/instagram', (req, res) => {
  try {
    const { 'hub.mode': mode, 'hub.verify_token': token, 'hub.challenge': challenge } = req.query;
    
    if (mode === 'subscribe' && token === process.env.INSTAGRAM_VERIFY_TOKEN) {
      logger.info('Instagram webhook verified successfully');
      res.status(200).send(challenge);
    } else {
      logger.warn('Instagram webhook verification failed');
      res.status(403).send('Forbidden');
    }
  } catch (error) {
    logger.error('Error verifying Instagram webhook:', error);
    res.status(500).send('Internal server error');
  }
});

router.post('/instagram', async (req, res) => {
  try {
    const { object, entry } = req.body;
    
    if (object !== 'instagram') {
      return res.status(200).json({ ok: true, message: 'Not an Instagram message' });
    }

    for (const entryItem of entry) {
      for (const change of entryItem.changes) {
        if (change.value?.messages) {
          for (const message of change.value.messages) {
            // Create unified message format
            const unifiedMessage = {
              platform: 'instagram',
              sender: message.from?.username || 'Unknown',
              senderId: message.from?.id?.toString() || 'Unknown',
              recipient: change.value.metadata?.instagram_business_account_id || 'Unknown',
              recipientId: change.value.metadata?.instagram_business_account_id || 'Unknown',
              text: message.text || '',
              timestamp: new Date(parseInt(message.timestamp) * 1000),
              type: 'message',
              platformMessageId: message.id,
              metadata: {
                messageType: message.type,
                instagramBusinessAccountId: change.value.metadata?.instagram_business_account_id
              }
            };

            // Store message
            const savedMessage = await messageService.createMessage(unifiedMessage);
            
            // Emit real-time update
            req.app.get('io').to('platform:instagram').emit('message:new', savedMessage);
            
            logger.info(`Instagram message processed: ${savedMessage.id}`);
          }
        }
      }
    }
    
    res.status(200).json({ ok: true });
    
  } catch (error) {
    logger.error('Error processing Instagram webhook:', error);
    res.status(500).json({ ok: false, error: 'Internal server error' });
  }
});

// =============================================================================
// TWITTER WEBHOOK
// =============================================================================
router.get('/twitter', (req, res) => {
  try {
    const { crc_token } = req.query;
    
    if (crc_token) {
      const response = platformService.verifyTwitterWebhook(crc_token);
      logger.info('Twitter webhook verified successfully');
      res.status(200).json(response);
    } else {
      logger.warn('Twitter webhook verification failed - no crc_token');
      res.status(400).send('Bad Request');
    }
  } catch (error) {
    logger.error('Error verifying Twitter webhook:', error);
    res.status(500).send('Internal server error');
  }
});

router.post('/twitter', async (req, res) => {
  try {
    const { direct_message_events, users } = req.body;
    
    if (!direct_message_events || !users) {
      return res.status(200).json({ ok: true, message: 'No direct message events' });
    }

    for (const dmEvent of direct_message_events) {
      if (dmEvent.type === 'message_create') {
        const message = dmEvent.message_create;
        const sender = users.find(u => u.id === message.sender_id);
        const recipient = users.find(u => u.id === message.target.recipient_id);
        
        // Create unified message format
        const unifiedMessage = {
          platform: 'twitter',
          sender: sender?.username || 'Unknown',
          senderId: sender?.id || 'Unknown',
          recipient: recipient?.username || 'Unknown',
          recipientId: recipient?.id || 'Unknown',
          text: message.message_data?.text || '',
          timestamp: new Date(parseInt(dmEvent.created_timestamp)),
          type: 'message',
          platformMessageId: dmEvent.id,
          metadata: {
            messageType: 'direct_message',
            senderId: message.sender_id,
            recipientId: message.target.recipient_id
          }
        };

        // Store message
        const savedMessage = await messageService.createMessage(unifiedMessage);
        
        // Emit real-time update
        req.app.get('io').to('platform:twitter').emit('message:new', savedMessage);
        
        logger.info(`Twitter message processed: ${savedMessage.id}`);
      }
    }
    
    res.status(200).json({ ok: true });
    
  } catch (error) {
    logger.error('Error processing Twitter webhook:', error);
    res.status(500).json({ ok: false, error: 'Internal server error' });
  }
});

// =============================================================================
// GMAIL WEBHOOK (PUSH NOTIFICATIONS)
// =============================================================================
router.post('/gmail', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message?.data) {
      return res.status(200).json({ ok: true, message: 'No message data' });
    }

    // Gmail push notifications contain encoded message data
    const messageData = JSON.parse(Buffer.from(message.data, 'base64').toString());
    
    // Create unified message format
    const unifiedMessage = {
      platform: 'gmail',
      sender: messageData.from || 'Unknown',
      senderId: messageData.from || 'Unknown',
      recipient: messageData.to || 'Unknown',
      recipientId: messageData.to || 'Unknown',
      text: messageData.snippet || '',
      subject: messageData.subject || '',
      timestamp: new Date(parseInt(messageData.internalDate)),
      type: 'email',
      platformMessageId: messageData.id,
      metadata: {
        messageType: 'email',
        threadId: messageData.threadId,
        labelIds: messageData.labelIds || []
      }
    };

    // Store message
    const savedMessage = await messageService.createMessage(unifiedMessage);
    
    // Emit real-time update
    req.app.get('io').to('platform:gmail').emit('message:new', savedMessage);
    
    logger.info(`Gmail message processed: ${savedMessage.id}`);
    res.status(200).json({ ok: true, messageId: savedMessage.id });
    
  } catch (error) {
    logger.error('Error processing Gmail webhook:', error);
    res.status(500).json({ ok: false, error: 'Internal server error' });
  }
});

// =============================================================================
// WEBHOOK STATUS & MANAGEMENT
// =============================================================================
router.get('/status', async (req, res) => {
  try {
    const platforms = platformService.getAllPlatforms();
    const webhookStatus = {};
    
    for (const platform of platforms) {
      webhookStatus[platform.name] = {
        status: platform.status,
        webhookConfigured: !!process.env[`${platform.name.toUpperCase()}_WEBHOOK_URL`],
        lastActivity: new Date().toISOString() // This would be tracked in production
      };
    }
    
    res.json({
      ok: true,
      webhooks: webhookStatus,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Error getting webhook status:', error);
    res.status(500).json({ ok: false, error: 'Internal server error' });
  }
});

// =============================================================================
// WEBHOOK TESTING
// =============================================================================
router.post('/test/:platform', async (req, res) => {
  try {
    const { platform } = req.params;
    const testMessage = req.body;
    
    if (!platformService.platforms.has(platform)) {
      return res.status(400).json({ ok: false, error: `Platform ${platform} not supported` });
    }
    
    // Create a test message
    const unifiedMessage = {
      platform,
      sender: testMessage.sender || 'Test User',
      senderId: testMessage.senderId || 'test_123',
      recipient: testMessage.recipient || 'You',
      recipientId: testMessage.recipientId || 'you_123',
      text: testMessage.text || 'This is a test message',
      timestamp: new Date(),
      type: 'test',
      platformMessageId: `test_${Date.now()}`,
      metadata: { isTest: true }
    };
    
    // Store message
    const savedMessage = await messageService.createMessage(unifiedMessage);
    
    // Emit real-time update
    req.app.get('io').to(`platform:${platform}`).emit('message:new', savedMessage);
    
    logger.info(`Test message sent for platform ${platform}: ${savedMessage.id}`);
    res.json({ ok: true, messageId: savedMessage.id, platform });
    
  } catch (error) {
    logger.error('Error sending test message:', error);
    res.status(500).json({ ok: false, error: 'Internal server error' });
  }
});

module.exports = router;
