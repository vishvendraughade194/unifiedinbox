const winston = require('winston');
const platformService = require('./platformService');
const aiService = require('./aiService');

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'message-service' },
  transports: [
    new winston.transports.File({ filename: 'logs/message-service.log' }),
    new winston.transports.Console()
  ]
});

class MessageService {
  constructor() {
    this.messages = new Map(); // In-memory storage (replace with database in production)
    this.conversations = new Map();
    this.messageCounter = 0;
    this.conversationCounter = 0;
  }

  // Create a new message
  async createMessage(messageData) {
    try {
      const messageId = `msg_${++this.messageCounter}`;
      const timestamp = new Date();
      
      // Normalize platform-specific data
      const normalizedMessage = this.normalizeMessageData(messageData);
      
      // AI-powered categorization
      let aiAnalysis = null;
      if (normalizedMessage.text) {
        try {
          aiAnalysis = await aiService.categorizeMessage(normalizedMessage.text, normalizedMessage.platform);
        } catch (error) {
          logger.warn('AI categorization failed, using default category:', error.message);
        }
      }
      
      const message = {
        id: messageId,
        platform: normalizedMessage.platform,
        sender: normalizedMessage.sender,
        senderId: normalizedMessage.senderId,
        recipient: normalizedMessage.recipient,
        recipientId: normalizedMessage.recipientId,
        text: normalizedMessage.text,
        subject: normalizedMessage.subject,
        timestamp,
        status: 'unread',
        type: normalizedMessage.type || 'message',
        attachments: normalizedMessage.attachments || [],
        metadata: normalizedMessage.metadata || {},
        threadId: normalizedMessage.threadId,
        conversationId: normalizedMessage.conversationId,
        platformMessageId: normalizedMessage.platformMessageId,
        isIncoming: normalizedMessage.isIncoming || false,
        priority: aiAnalysis?.priority || 'normal',
        // AI Analysis fields
        aiCategory: aiAnalysis?.category || 'general',
        aiConfidence: aiAnalysis?.confidence || 0,
        aiSentiment: aiAnalysis?.sentiment || 'neutral',
        aiKeywords: aiAnalysis?.keywords || [],
        aiSuggestedReplies: aiAnalysis?.suggestedReplies || [],
        aiInsights: aiAnalysis?.aiInsights || {}
      };

      // Store message
      this.messages.set(messageId, message);
      
      // Update conversation
      await this.updateConversation(message);
      
      logger.info(`Message created: ${messageId} from ${messageData.platform}`);
      
      return message;
    } catch (error) {
      logger.error('Error creating message:', error);
      throw error;
    }
  }

  // Normalize message data from different platforms
  normalizeMessageData(messageData) {
    const normalized = { ...messageData };
    
    // Platform-specific normalization
    switch (messageData.platform) {
      case 'gmail':
        normalized.type = 'email';
        normalized.subject = messageData.subject || 'No Subject';
        normalized.isIncoming = messageData.isIncoming !== false;
        break;
      case 'telegram':
        normalized.type = 'chat';
        normalized.isIncoming = messageData.isIncoming !== false;
        break;
      case 'whatsapp':
        normalized.type = 'chat';
        normalized.isIncoming = messageData.isIncoming !== false;
        break;
      case 'instagram':
        normalized.type = 'direct_message';
        normalized.isIncoming = messageData.isIncoming !== false;
        break;
      case 'twitter':
        normalized.type = 'direct_message';
        normalized.isIncoming = messageData.isIncoming !== false;
        break;
    }

    // Set default values
    normalized.text = normalized.text || '';
    normalized.attachments = normalized.attachments || [];
    normalized.metadata = normalized.metadata || {};
    
    return normalized;
  }

  // Get messages with filtering and pagination
  async getMessages(filters = {}, pagination = {}) {
    try {
      let filteredMessages = Array.from(this.messages.values());
      
      // Apply filters
      if (filters.platform && filters.platform !== 'all') {
        filteredMessages = filteredMessages.filter(msg => msg.platform === filters.platform);
      }
      
      if (filters.status) {
        filteredMessages = filteredMessages.filter(msg => msg.status === filters.status);
      }
      
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        filteredMessages = filteredMessages.filter(msg => 
          msg.text?.toLowerCase().includes(searchTerm) ||
          msg.subject?.toLowerCase().includes(searchTerm) ||
          msg.sender?.toLowerCase().includes(searchTerm)
        );
      }
      
      if (filters.conversationId) {
        filteredMessages = filteredMessages.filter(msg => msg.conversationId === filters.conversationId);
      }
      
      if (filters.dateFrom) {
        const dateFrom = new Date(filters.dateFrom);
        filteredMessages = filteredMessages.filter(msg => msg.timestamp >= dateFrom);
      }
      
      if (filters.dateTo) {
        const dateTo = new Date(filters.dateTo);
        filteredMessages = filteredMessages.filter(msg => msg.timestamp <= dateTo);
      }

      if (filters.type) {
        filteredMessages = filteredMessages.filter(msg => msg.type === filters.type);
      }

      if (filters.isIncoming !== undefined) {
        filteredMessages = filteredMessages.filter(msg => msg.isIncoming === filters.isIncoming);
      }
      
      // Sort by timestamp (newest first)
      filteredMessages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      // Apply pagination
      const page = pagination.page || 1;
      const limit = pagination.limit || 20;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedMessages = filteredMessages.slice(startIndex, endIndex);
      
      return {
        messages: paginatedMessages,
        pagination: {
          page,
          limit,
          total: filteredMessages.length,
          totalPages: Math.ceil(filteredMessages.length / limit),
          hasNext: endIndex < filteredMessages.length,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      logger.error('Error getting messages:', error);
      throw error;
    }
  }

  // Get messages by conversation
  async getConversationMessages(conversationId, limit = 50) {
    try {
      const conversation = this.conversations.get(conversationId);
      if (!conversation) {
        throw new Error('Conversation not found');
      }

      const messages = Array.from(this.messages.values())
        .filter(msg => msg.conversationId === conversationId)
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
        .slice(-limit);

      return messages;
    } catch (error) {
      logger.error('Error getting conversation messages:', error);
      throw error;
    }
  }

  // Update conversation when new message arrives
  async updateConversation(message) {
    try {
      let conversationId = message.conversationId;
      
      if (!conversationId) {
        // Create new conversation if none exists
        conversationId = await this.createConversation(message);
        message.conversationId = conversationId;
      }
      
      const conversation = this.conversations.get(conversationId);
      if (conversation) {
        // Update conversation with latest message info
        conversation.lastMessage = message.text;
        conversation.lastMessageTime = message.timestamp;
        conversation.messageCount++;
        conversation.platforms.add(message.platform);
        
        // Update participants
        if (message.senderId && !conversation.participants.includes(message.senderId)) {
          conversation.participants.push(message.senderId);
        }
        if (message.recipientId && !conversation.participants.includes(message.recipientId)) {
          conversation.participants.push(message.recipientId);
        }
        
        this.conversations.set(conversationId, conversation);
      }
      
      return conversationId;
    } catch (error) {
      logger.error('Error updating conversation:', error);
      throw error;
    }
  }

  // Create a new conversation
  async createConversation(message) {
    try {
      const conversationId = `conv_${++this.conversationCounter}`;
      
      const conversation = {
        id: conversationId,
        title: message.subject || message.sender || 'New Conversation',
        participants: [message.senderId, message.recipientId].filter(Boolean),
        platforms: new Set([message.platform]),
        messageCount: 1,
        lastMessage: message.text,
        lastMessageTime: message.timestamp,
        createdAt: message.timestamp,
        updatedAt: message.timestamp,
        metadata: {
          primaryPlatform: message.platform,
          hasAttachments: message.attachments.length > 0
        }
      };
      
      this.conversations.set(conversationId, conversation);
      logger.info(`New conversation created: ${conversationId}`);
      
      return conversationId;
    } catch (error) {
      logger.error('Error creating conversation:', error);
      throw error;
    }
  }

  // Get all conversations
  async getConversations(filters = {}, pagination = {}) {
    try {
      let filteredConversations = Array.from(this.conversations.values());
      
      // Apply filters
      if (filters.platform && filters.platform !== 'all') {
        filteredConversations = filteredConversations.filter(conv => 
          conv.platforms.has(filters.platform)
        );
      }
      
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        filteredConversations = filteredConversations.filter(conv => 
          conv.title.toLowerCase().includes(searchTerm) ||
          conv.lastMessage.toLowerCase().includes(searchTerm)
        );
      }
      
      // Sort by last message time (newest first)
      filteredConversations.sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));
      
      // Apply pagination
      const page = pagination.page || 1;
      const limit = pagination.limit || 20;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedConversations = filteredConversations.slice(startIndex, endIndex);
      
      return {
        conversations: paginatedConversations,
        pagination: {
          page,
          limit,
          total: filteredConversations.length,
          totalPages: Math.ceil(filteredConversations.length / limit),
          hasNext: endIndex < filteredConversations.length,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      logger.error('Error getting conversations:', error);
      throw error;
    }
  }

  // Send message to a specific platform
  async sendMessage(platform, messageData) {
    try {
      const platformInstance = platformService.getPlatform(platform);
      if (!platformInstance || !platformInstance.instance) {
        throw new Error(`Platform ${platform} not configured`);
      }

      let result;
      const timestamp = new Date();
      
      // Platform-specific message sending
      switch (platform) {
        case 'telegram':
          result = await platformInstance.methods.sendMessage(
            messageData.recipientId,
            messageData.text,
            messageData.options
          );
          break;
          
        case 'gmail':
          result = await platformInstance.methods.sendEmail(
            messageData.recipient,
            messageData.subject,
            messageData.text,
            messageData.options
          );
          break;
          
        case 'whatsapp':
          result = await platformInstance.methods.sendMessage(
            messageData.recipientId,
            messageData.text,
            messageData.options
          );
          break;
          
        case 'instagram':
          result = await platformInstance.methods.sendDirectMessage(
            messageData.recipientId,
            messageData.text,
            messageData.options
          );
          break;
          
        case 'twitter':
          result = await platformInstance.methods.sendDirectMessage(
            messageData.recipientId,
            messageData.text,
            messageData.options
          );
          break;
          
        default:
          throw new Error(`Unsupported platform: ${platform}`);
      }

      // Create outgoing message record
      const outgoingMessage = await this.createMessage({
        ...messageData,
        platform,
        timestamp,
        isIncoming: false,
        status: 'sent',
        platformMessageId: result.id || result.message_id || result.messageId
      });

      logger.info(`Message sent via ${platform}: ${outgoingMessage.id}`);
      
      return {
        success: true,
        message: outgoingMessage,
        platformResult: result
      };
    } catch (error) {
      logger.error(`Error sending message via ${platform}:`, error);
      throw error;
    }
  }

  // Mark message as read
  async markMessageAsRead(messageId) {
    try {
      const message = this.messages.get(messageId);
      if (!message) {
        throw new Error('Message not found');
      }
      
      message.status = 'read';
      message.readAt = new Date();
      
      this.messages.set(messageId, message);
      
      logger.info(`Message marked as read: ${messageId}`);
      return message;
    } catch (error) {
      logger.error('Error marking message as read:', error);
      throw error;
    }
  }

  // Mark conversation as read
  async markConversationAsRead(conversationId) {
    try {
      const conversation = this.conversations.get(conversationId);
      if (!conversation) {
        throw new Error('Conversation not found');
      }

      // Mark all unread messages in conversation as read
      let updatedCount = 0;
      for (const [messageId, message] of this.messages) {
        if (message.conversationId === conversationId && message.status === 'unread') {
          message.status = 'read';
          message.readAt = new Date();
          this.messages.set(messageId, message);
          updatedCount++;
        }
      }

      logger.info(`Marked ${updatedCount} messages as read in conversation: ${conversationId}`);
      return { updatedCount };
    } catch (error) {
      logger.error('Error marking conversation as read:', error);
      throw error;
    }
  }

  // Delete message
  async deleteMessage(messageId) {
    try {
      const message = this.messages.get(messageId);
      if (!message) {
        throw new Error('Message not found');
      }
      
      this.messages.delete(messageId);
      
      // Update conversation message count
      if (message.conversationId) {
        const conversation = this.conversations.get(message.conversationId);
        if (conversation) {
          conversation.messageCount = Math.max(0, conversation.messageCount - 1);
          this.conversations.set(message.conversationId, conversation);
        }
      }
      
      logger.info(`Message deleted: ${messageId}`);
      return { success: true };
    } catch (error) {
      logger.error('Error deleting message:', error);
      throw error;
    }
  }

  // Get message statistics
  async getMessageStats() {
    try {
      const messages = Array.from(this.messages.values());
      const conversations = Array.from(this.conversations.values());
      
      const stats = {
        totalMessages: messages.length,
        totalConversations: conversations.length,
        unreadMessages: messages.filter(msg => msg.status === 'unread').length,
        platforms: {},
        messageTypes: {},
        recentActivity: {
          last24h: messages.filter(msg => 
            new Date(msg.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
          ).length,
          last7d: messages.filter(msg => 
            new Date(msg.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          ).length,
          last30d: messages.filter(msg => 
            new Date(msg.timestamp) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          ).length
        }
      };
      
      // Platform breakdown
      messages.forEach(msg => {
        if (!stats.platforms[msg.platform]) {
          stats.platforms[msg.platform] = { count: 0, unread: 0 };
        }
        stats.platforms[msg.platform].count++;
        if (msg.status === 'unread') {
          stats.platforms[msg.platform].unread++;
        }
      });
      
      // Message type breakdown
      messages.forEach(msg => {
        if (!stats.messageTypes[msg.type]) {
          stats.messageTypes[msg.type] = 0;
        }
        stats.messageTypes[msg.type]++;
      });
      
      return stats;
    } catch (error) {
      logger.error('Error getting message statistics:', error);
      throw error;
    }
  }

  // Search messages and conversations
  async search(query, filters = {}) {
    try {
      const searchTerm = query.toLowerCase();
      const results = {
        messages: [],
        conversations: [],
        totalResults: 0
      };
      
      // Search in messages
      for (const message of this.messages.values()) {
        if (
          message.text?.toLowerCase().includes(searchTerm) ||
          message.subject?.toLowerCase().includes(searchTerm) ||
          message.sender?.toLowerCase().includes(searchTerm) ||
          message.recipient?.toLowerCase().includes(searchTerm)
        ) {
          if (!filters.platform || filters.platform === 'all' || message.platform === filters.platform) {
            results.messages.push(message);
          }
        }
      }
      
      // Search in conversations
      for (const conversation of this.conversations.values()) {
        if (
          conversation.title?.toLowerCase().includes(searchTerm) ||
          conversation.lastMessage?.toLowerCase().includes(searchTerm)
        ) {
          if (!filters.platform || filters.platform === 'all' || conversation.platforms.has(filters.platform)) {
            results.conversations.push(conversation);
          }
        }
      }
      
      results.totalResults = results.messages.length + results.conversations.length;
      
      // Sort results by relevance (timestamp for now)
      results.messages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      results.conversations.sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));
      
      return results;
    } catch (error) {
      logger.error('Error searching:', error);
      throw error;
    }
  }

  // Get message by ID
  async getMessageById(messageId) {
    try {
      const message = this.messages.get(messageId);
      if (!message) {
        throw new Error('Message not found');
      }
      return message;
    } catch (error) {
      logger.error('Error getting message by ID:', error);
      throw error;
    }
  }

  // Get conversation by ID
  async getConversationById(conversationId) {
    try {
      const conversation = this.conversations.get(conversationId);
      if (!conversation) {
        throw new Error('Conversation not found');
      }
      return conversation;
    } catch (error) {
      logger.error('Error getting conversation by ID:', error);
      throw error;
    }
  }

  // Get AI insights for dashboard
  async getAIInsights(timeRange = '24h') {
    try {
      const messages = Array.from(this.messages.values());
      return aiService.getAIInsights(messages, timeRange);
    } catch (error) {
      logger.error('Error getting AI insights:', error);
      throw error;
    }
  }

  // Get suggested replies for a message
  async getSuggestedReplies(messageId) {
    try {
      const message = await this.getMessageById(messageId);
      if (!message.aiSuggestedReplies || message.aiSuggestedReplies.length === 0) {
        // Regenerate suggestions if none exist
        const aiAnalysis = await aiService.categorizeMessage(message.text, message.platform);
        return aiAnalysis.suggestedReplies;
      }
      return message.aiSuggestedReplies;
    } catch (error) {
      logger.error('Error getting suggested replies:', error);
      return [];
    }
  }

  // Generate conversation summary
  async generateConversationSummary(conversationId) {
    try {
      const conversation = await this.getConversationById(conversationId);
      const messages = Array.from(this.messages.values())
        .filter(msg => msg.conversationId === conversationId)
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      
      return await aiService.generateConversationSummary(messages);
    } catch (error) {
      logger.error('Error generating conversation summary:', error);
      throw error;
    }
  }

  // Get messages by AI category
  async getMessagesByCategory(category, limit = 50) {
    try {
      const messages = Array.from(this.messages.values())
        .filter(msg => msg.aiCategory === category)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, limit);
      
      return messages;
    } catch (error) {
      logger.error('Error getting messages by category:', error);
      throw error;
    }
  }

  // Get urgent messages
  async getUrgentMessages(limit = 20) {
    try {
      return await this.getMessagesByCategory('urgent', limit);
    } catch (error) {
      logger.error('Error getting urgent messages:', error);
      throw error;
    }
  }
}

module.exports = new MessageService();
