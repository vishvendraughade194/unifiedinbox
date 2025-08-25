const express = require('express');
const router = express.Router();
const TelegramBot = require('node-telegram-bot-api');
const crypto = require('crypto');

// Initialize Telegram bot
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });

// Verify webhook signature
function verifyWebhook(req, res, next) {
  const signature = req.headers['x-telegram-bot-api-signature'];
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  
  if (!signature || !secret) {
    return res.status(401).json({ error: 'Missing signature or secret' });
  }
  
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(req.body))
    .digest('hex');
    
  if (signature !== expectedSignature) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  next();
}

// Handle incoming Telegram messages
router.post('/webhook', verifyWebhook, async (req, res) => {
  try {
    const { message, callback_query } = req.body;
    
    if (message) {
      await handleIncomingMessage(message);
    } else if (callback_query) {
      await handleCallbackQuery(callback_query);
    }
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Process incoming message
async function handleIncomingMessage(message) {
  const {
    message_id,
    from,
    chat,
    text,
    photo,
    document,
    voice,
    video,
    audio,
    sticker,
    date
  } = message;
  
  // Create message object for your database
  const messageData = {
    id: `telegram_${message_id}`,
    platform: 'telegram',
    platformMessageId: message_id,
    senderId: from.id.toString(),
    senderName: `${from.first_name}${from.last_name ? ' ' + from.last_name : ''}`,
    senderUsername: from.username || null,
    chatId: chat.id.toString(),
    chatType: chat.type,
    text: text || '',
    timestamp: new Date(date * 1000),
    status: 'unread',
    attachments: [],
    metadata: {
      telegram: {
        from,
        chat,
        date
      }
    }
  };
  
  // Handle different types of content
  if (photo) {
    messageData.attachments.push({
      type: 'image',
      name: 'Photo',
      url: photo[photo.length - 1].file_id,
      size: photo[photo.length - 1].file_size
    });
  }
  
  if (document) {
    messageData.attachments.push({
      type: 'document',
      name: document.file_name || 'Document',
      url: document.file_id,
      size: document.file_size
    });
  }
  
  if (voice) {
    messageData.attachments.push({
      type: 'voice',
      name: 'Voice Message',
      url: voice.file_id,
      size: voice.file_size,
      duration: voice.duration
    });
  }
  
  // Save to database (you'll need to implement this)
  await saveMessage(messageData);
  
  // Send confirmation to user
  await bot.sendMessage(chat.id, '✅ Message received in your unified inbox!');
  
  console.log(`📨 Telegram message received from ${messageData.senderName}: ${text}`);
}

// Handle callback queries (button clicks)
async function handleCallbackQuery(callbackQuery) {
  const { id, data, message, from } = callbackQuery;
  
  try {
    await bot.answerCallbackQuery(id);
    
    if (data === 'mark_read') {
      // Mark message as read
      await markMessageAsRead(message.message_id);
      await bot.editMessageText('✅ Marked as read', {
        chat_id: message.chat.id,
        message_id: message.message_id
      });
    }
    
  } catch (error) {
    console.error('Callback query error:', error);
  }
}

// Save message to database
async function saveMessage(messageData) {
  try {
    // TODO: Implement database save
    // For now, we'll just log it
    console.log('💾 Saving message:', messageData);
    
    // You can implement this with your message service
    // await messageService.createMessage(messageData);
    
  } catch (error) {
    console.error('Failed to save message:', error);
  }
}

// Mark message as read
async function markMessageAsRead(messageId) {
  try {
    // TODO: Implement database update
    console.log('📖 Marking message as read:', messageId);
    
    // You can implement this with your message service
    // await messageService.updateMessageStatus(messageId, 'read');
    
  } catch (error) {
    console.error('Failed to mark message as read:', error);
  }
}

// Send message via Telegram
router.post('/send', async (req, res) => {
  try {
    const { chatId, text, replyToMessageId } = req.body;
    
    if (!chatId || !text) {
      return res.status(400).json({ error: 'Missing chatId or text' });
    }
    
    const options = {};
    if (replyToMessageId) {
      options.reply_to_message_id = replyToMessageId;
    }
    
    const sentMessage = await bot.sendMessage(chatId, text, options);
    
    res.json({
      success: true,
      messageId: sentMessage.message_id,
      timestamp: sentMessage.date
    });
    
  } catch (error) {
    console.error('Failed to send Telegram message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Get bot info
router.get('/info', async (req, res) => {
  try {
    const botInfo = await bot.getMe();
    res.json({
      success: true,
      bot: botInfo
    });
  } catch (error) {
    console.error('Failed to get bot info:', error);
    res.status(500).json({ error: 'Failed to get bot info' });
  }
});

// Set webhook
router.post('/set-webhook', async (req, res) => {
  try {
    const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL;
    const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
    
    if (!webhookUrl || !secret) {
      return res.status(400).json({ error: 'Missing webhook URL or secret' });
    }
    
    const result = await bot.setWebhook(webhookUrl, {
      secret_token: secret
    });
    
    res.json({
      success: true,
      webhookSet: result,
      webhookUrl
    });
    
  } catch (error) {
    console.error('Failed to set webhook:', error);
    res.status(500).json({ error: 'Failed to set webhook' });
  }
});

module.exports = router;
