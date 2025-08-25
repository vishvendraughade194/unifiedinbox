const natural = require('natural');
const compromise = require('compromise');
const OpenAI = require('openai');
const winston = require('winston');

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'ai-intelligence' },
  transports: [
    new winston.transports.File({ filename: 'logs/ai-intelligence.log' }),
    new winston.transports.Console()
  ]
});

class AIIntelligenceService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    // Initialize NLP classifiers
    this.urgencyClassifier = new natural.BayesClassifier();
    this.categoryClassifier = new natural.BayesClassifier();
    this.sentimentClassifier = new natural.BayesClassifier();
    
    this.initializeClassifiers();
    this.replyTemplates = new Map();
    this.conversationContext = new Map();
  }

  // Initialize NLP classifiers with training data
  initializeClassifiers() {
    // Train urgency classifier
    this.urgentTerms = [
      'urgent', 'asap', 'emergency', 'critical', 'immediate', 'now', 'quick',
      'help needed', 'broken', 'down', 'issue', 'problem', 'error', 'fail',
      'deadline', 'due today', 'last minute', 'rush', 'priority'
    ];
    
    this.normalTerms = [
      'hello', 'hi', 'thanks', 'thank you', 'good morning', 'good afternoon',
      'how are you', 'nice to meet you', 'welcome', 'greetings'
    ];

    this.urgentTerms.forEach(term => this.urgencyClassifier.addDocument(term, 'urgent'));
    this.normalTerms.forEach(term => this.urgencyClassifier.addDocument(term, 'normal'));
    this.urgencyClassifier.train();

    // Train category classifier
    const categories = {
      'customer_support': ['help', 'support', 'issue', 'problem', 'broken', 'not working', 'error'],
      'sales_inquiry': ['price', 'cost', 'quote', 'pricing', 'buy', 'purchase', 'order', 'sales'],
      'general': ['hello', 'hi', 'thanks', 'information', 'question', 'inquiry'],
      'spam': ['click here', 'free offer', 'limited time', 'act now', 'urgent action required']
    };

    Object.entries(categories).forEach(([category, terms]) => {
      terms.forEach(term => this.categoryClassifier.addDocument(term, category));
    });
    this.categoryClassifier.train();

    // Train sentiment classifier
    const sentiments = {
      'positive': ['great', 'awesome', 'excellent', 'good', 'nice', 'love', 'like', 'happy'],
      'negative': ['bad', 'terrible', 'awful', 'hate', 'dislike', 'angry', 'frustrated', 'upset'],
      'neutral': ['okay', 'fine', 'alright', 'normal', 'standard', 'regular']
    };

    Object.entries(sentiments).forEach(([sentiment, terms]) => {
      terms.forEach(term => this.sentimentClassifier.addDocument(term, sentiment));
    });
    this.sentimentClassifier.train();
  }

  // Smart message categorization with AI
  async categorizeMessage(messageText, platform, sender = null) {
    try {
      const analysis = {
        urgency: this.classifyUrgency(messageText),
        category: this.classifyCategory(messageText),
        sentiment: this.classifySentiment(messageText),
        confidence: 0,
        aiInsights: null,
        suggestedActions: [],
        priority: 'normal',
        tags: [],
        businessContext: null
      };

      // Use OpenAI for advanced analysis if available
      if (process.env.OPENAI_API_KEY) {
        try {
          const aiAnalysis = await this.getAIAnalysis(messageText, platform, sender);
          analysis.aiInsights = aiAnalysis;
          analysis.confidence = aiAnalysis.confidence || 0.8;
          analysis.suggestedActions = aiAnalysis.suggestedActions || [];
          analysis.businessContext = aiAnalysis.businessContext;
          analysis.tags = aiAnalysis.tags || [];
          
          // Enhanced priority calculation
          analysis.priority = this.calculatePriority(analysis);
        } catch (error) {
          logger.warn('OpenAI analysis failed, using NLP fallback:', error.message);
          analysis.confidence = 0.6;
        }
      }

      // Add visual indicators and emojis
      analysis.visualIndicators = this.generateVisualIndicators(analysis);
      
      return analysis;
    } catch (error) {
      logger.error('Error categorizing message:', error);
      return {
        urgency: 'normal',
        category: 'general',
        sentiment: 'neutral',
        confidence: 0,
        priority: 'normal',
        visualIndicators: { emoji: '💬', color: '#6c757d' }
      };
    }
  }

  // NLP-based urgency classification
  classifyUrgency(text) {
    const lowerText = text.toLowerCase();
    const doc = compromise(lowerText);
    
    // Check for urgent indicators
    const hasUrgentWords = this.urgentTerms.some(term => lowerText.includes(term));
    const hasExclamation = lowerText.includes('!') || lowerText.includes('urgent');
    const hasTimePressure = /\b(asap|now|immediate|quick|rush)\b/i.test(lowerText);
    
    if (hasUrgentWords || hasExclamation || hasTimePressure) {
      return 'urgent';
    }
    
    return this.urgencyClassifier.classify(lowerText);
  }

  // NLP-based category classification
  classifyCategory(text) {
    const lowerText = text.toLowerCase();
    return this.categoryClassifier.classify(lowerText);
  }

  // NLP-based sentiment classification
  classifySentiment(text) {
    const lowerText = text.toLowerCase();
    return this.sentimentClassifier.classify(lowerText);
  }

  // OpenAI-powered advanced analysis
  async getAIAnalysis(text, platform, sender) {
    try {
      const prompt = `Analyze this message from ${platform} platform:
Message: "${text}"
Sender: ${sender || 'Unknown'}

Please provide:
1. Business context and intent
2. Suggested response category
3. Urgency level (low/medium/high)
4. Key action items
5. Confidence score (0-1)

Format as JSON.`;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 300,
        temperature: 0.3,
      });

      const response = completion.choices[0].message.content;
      return JSON.parse(response);
    } catch (error) {
      logger.error('OpenAI analysis error:', error);
      throw error;
    }
  }

  // Generate visual indicators for message categorization
  generateVisualIndicators(analysis) {
    const indicators = {
      emoji: '💬',
      color: '#6c757d',
      badge: '',
      priority: ''
    };

    // Urgency indicators
    switch (analysis.urgency) {
      case 'urgent':
        indicators.emoji = '🚨';
        indicators.color = '#dc3545';
        indicators.badge = 'URGENT';
        indicators.priority = 'high';
        break;
      case 'high':
        indicators.emoji = '⚠️';
        indicators.color = '#fd7e14';
        indicators.badge = 'HIGH';
        indicators.priority = 'medium';
        break;
      case 'normal':
        indicators.emoji = '💬';
        indicators.color = '#6c757d';
        break;
    }

    // Category indicators
    switch (analysis.category) {
      case 'customer_support':
        indicators.emoji = '🛠️';
        indicators.color = '#17a2b8';
        break;
      case 'sales_inquiry':
        indicators.emoji = '💰';
        indicators.color = '#28a745';
        break;
      case 'spam':
        indicators.emoji = '🚫';
        indicators.color = '#6c757d';
        break;
      case 'urgent':
        indicators.emoji = '🚨';
        indicators.color = '#dc3545';
        break;
    }

    // Sentiment indicators
    switch (analysis.sentiment) {
      case 'positive':
        indicators.emoji = '😊';
        break;
      case 'negative':
        indicators.emoji = '😞';
        break;
      case 'neutral':
        indicators.emoji = '😐';
        break;
    }

    return indicators;
  }

  // Calculate priority based on multiple factors
  calculatePriority(analysis) {
    let priority = 0;
    
    // Urgency weight
    if (analysis.urgency === 'urgent') priority += 5;
    else if (analysis.urgency === 'high') priority += 3;
    
    // Category weight
    if (analysis.category === 'customer_support') priority += 3;
    else if (analysis.category === 'sales_inquiry') priority += 2;
    
    // Sentiment weight
    if (analysis.sentiment === 'negative') priority += 2;
    
    // Business context weight
    if (analysis.businessContext === 'high_value_customer') priority += 4;
    else if (analysis.businessContext === 'escalation') priority += 5;
    
    // Determine priority level
    if (priority >= 8) return 'critical';
    if (priority >= 6) return 'high';
    if (priority >= 4) return 'medium';
    return 'normal';
  }

  // Smart reply suggestions with context awareness
  async generateSmartReplies(message, conversationHistory = []) {
    try {
      const suggestions = [];
      
      // Get base templates based on category
      const baseTemplates = this.getBaseTemplates(message.category);
      
      // Enhance with AI if available
      if (process.env.OPENAI_API_KEY) {
        try {
          const aiSuggestions = await this.getAISuggestions(message, conversationHistory);
          suggestions.push(...aiSuggestions);
        } catch (error) {
          logger.warn('AI suggestions failed, using templates:', error.message);
        }
      }
      
      // Add base templates
      suggestions.push(...baseTemplates);
      
      // Add contextual suggestions based on conversation history
      const contextualSuggestions = this.getContextualSuggestions(message, conversationHistory);
      suggestions.push(...contextualSuggestions);
      
      // Add platform-specific suggestions
      const platformSuggestions = this.getPlatformSpecificSuggestions(message);
      suggestions.push(...platformSuggestions);
      
      return suggestions.slice(0, 5); // Return top 5 suggestions
    } catch (error) {
      logger.error('Error generating smart replies:', error);
      return this.getFallbackTemplates(message.category);
    }
  }

  // Get base reply templates
  getBaseTemplates(category) {
    const templates = {
      customer_support: [
        {
          text: "Thank you for reaching out! I understand your concern and I'm here to help. Could you please provide more details about the issue you're experiencing?",
          confidence: 0.9,
          type: 'support_acknowledgment'
        },
        {
          text: "I apologize for the inconvenience. Let me investigate this issue and get back to you with a solution as soon as possible.",
          confidence: 0.8,
          type: 'support_apology'
        }
      ],
      sales_inquiry: [
        {
          text: "Thank you for your interest! I'd be happy to provide you with detailed pricing information and answer any questions you may have.",
          confidence: 0.9,
          type: 'sales_acknowledgment'
        },
        {
          text: "Great question! Let me schedule a call to discuss your specific needs and show you how our solution can help.",
          confidence: 0.8,
          type: 'sales_engagement'
        }
      ],
      urgent: [
        {
          text: "I understand this is urgent. I'm escalating this to our priority support team who will contact you within the next 30 minutes.",
          confidence: 0.95,
          type: 'urgent_escalation'
        }
      ]
    };
    
    return templates[category] || templates.general || [];
  }

  // Get contextual suggestions based on conversation history
  getContextualSuggestions(message, conversationHistory) {
    const suggestions = [];
    
    if (conversationHistory.length === 0) return suggestions;
    
    // Check if this is a follow-up to a previous issue
    const hasPreviousIssue = conversationHistory.some(msg => 
      msg.category === 'customer_support' && msg.sentiment === 'negative'
    );
    
    if (hasPreviousIssue) {
      suggestions.push({
        text: "I see this is related to our previous conversation. Let me check the status of your previous ticket and provide you with an update.",
        confidence: 0.85,
        type: 'follow_up_check'
      });
    }
    
    // Check if customer has been waiting
    const lastMessage = conversationHistory[conversationHistory.length - 1];
    const timeSinceLastMessage = Date.now() - lastMessage.timestamp;
    const hoursSinceLastMessage = timeSinceLastMessage / (1000 * 60 * 60);
    
    if (hoursSinceLastMessage > 24) {
      suggestions.push({
        text: "I apologize for the delay in responding. Thank you for your patience. Let me address your inquiry right away.",
        confidence: 0.9,
        type: 'delay_apology'
      });
    }
    
    return suggestions;
  }

  // Get platform-specific suggestions
  getPlatformSpecificSuggestions(message) {
    const suggestions = [];
    
    switch (message.platform) {
      case 'telegram':
        suggestions.push({
          text: "Feel free to send me a voice message if that's easier for you to explain the situation.",
          confidence: 0.7,
          type: 'platform_specific'
        });
        break;
      case 'whatsapp':
        suggestions.push({
          text: "I can also assist you via phone call if you prefer. Would that be helpful?",
          confidence: 0.7,
          type: 'platform_specific'
        });
        break;
      case 'email':
        suggestions.push({
          text: "I'll send you a detailed response via email with all the information you need.",
          confidence: 0.8,
          type: 'platform_specific'
        });
        break;
    }
    
    return suggestions;
  }

  // Get fallback templates
  getFallbackTemplates(category) {
    return [
      {
        text: "Thank you for your message. I'll get back to you shortly with a detailed response.",
        confidence: 0.6,
        type: 'generic'
      }
    ];
  }

  // AI-powered conversation summarization
  async summarizeConversation(conversationId, messages) {
    try {
      if (!process.env.OPENAI_API_KEY) {
        return this.generateBasicSummary(messages);
      }

      const conversationText = messages
        .map(msg => `${msg.sender}: ${msg.text}`)
        .join('\n');

      const prompt = `Please provide a concise summary of this customer service conversation:

${conversationText}

Please include:
1. Main issue or inquiry
2. Current status
3. Key points discussed
4. Next steps or actions needed
5. Customer sentiment
6. Priority level

Format as JSON with fields: summary, issue, status, keyPoints, nextSteps, sentiment, priority`;

      try {
        const completion = await this.openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 300,
          temperature: 0.3
        });

        const response = completion.choices[0].message.content;
        return JSON.parse(response);
      } catch (error) {
        logger.warn('OpenAI summarization failed, using basic summary:', error.message);
        return this.generateBasicSummary(messages);
      }
    } catch (error) {
      logger.error('Error summarizing conversation:', error);
      return this.generateBasicSummary(messages);
    }
  }

  // Generate basic summary without AI
  generateBasicSummary(messages) {
    const summary = {
      summary: "Conversation summary",
      issue: "Customer inquiry",
      status: "In progress",
      keyPoints: [],
      nextSteps: "Follow up required",
      sentiment: "neutral",
      priority: "normal"
    };

    if (messages.length === 0) return summary;

    // Extract key information
    const categories = messages.map(m => m.category).filter(Boolean);
    const urgencies = messages.map(m => m.urgency).filter(Boolean);
    const sentiments = messages.map(m => m.sentiment).filter(Boolean);

    if (categories.length > 0) {
      summary.issue = `Customer inquiry - ${categories[0]}`;
    }

    if (urgencies.includes('urgent')) {
      summary.priority = 'high';
      summary.status = 'Urgent attention needed';
    }

    if (sentiments.includes('negative')) {
      summary.sentiment = 'negative';
      summary.nextSteps = 'Immediate response required';
    }

    // Extract key points from message content
    summary.keyPoints = messages
      .slice(-3) // Last 3 messages
      .map(m => m.text.substring(0, 100))
      .filter(text => text.length > 10);

    return summary;
  }

  // Update conversation context
  updateConversationContext(conversationId, message) {
    if (!this.conversationContext.has(conversationId)) {
      this.conversationContext.set(conversationId, []);
    }
    
    const context = this.conversationContext.get(conversationId);
    context.push({
      timestamp: new Date(),
      message: message.text,
      category: message.category,
      urgency: message.urgency,
      sentiment: message.sentiment
    });
    
    // Keep only last 20 messages for context
    if (context.length > 20) {
      context.shift();
    }
  }

  // Get conversation insights
  getConversationInsights(conversationId) {
    const context = this.conversationContext.get(conversationId) || [];
    
    if (context.length === 0) {
      return null;
    }

    const insights = {
      totalMessages: context.length,
      averageResponseTime: this.calculateAverageResponseTime(context),
      dominantCategory: this.getDominantCategory(context),
      sentimentTrend: this.getSentimentTrend(context),
      urgencyLevels: this.getUrgencyDistribution(context)
    };

    return insights;
  }

  // Calculate average response time
  calculateAverageResponseTime(context) {
    if (context.length < 2) return 0;
    
    let totalTime = 0;
    let count = 0;
    
    for (let i = 1; i < context.length; i++) {
      const timeDiff = context[i].timestamp - context[i-1].timestamp;
      totalTime += timeDiff;
      count++;
    }
    
    return count > 0 ? Math.round(totalTime / count / 1000) : 0; // Return in seconds
  }

  // Get dominant category
  getDominantCategory(context) {
    const categories = {};
    context.forEach(item => {
      categories[item.category] = (categories[item.category] || 0) + 1;
    });
    
    return Object.entries(categories)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'general';
  }

  // Get sentiment trend
  getSentimentTrend(context) {
    if (context.length < 3) return 'stable';
    
    const recent = context.slice(-3);
    const positive = recent.filter(item => item.sentiment === 'positive').length;
    const negative = recent.filter(item => item.sentiment === 'negative').length;
    
    if (positive > negative) return 'improving';
    if (negative > positive) return 'declining';
    return 'stable';
  }

  // Get urgency distribution
  getUrgencyDistribution(context) {
    const distribution = {};
    context.forEach(item => {
      distribution[item.urgency] = (distribution[item.urgency] || 0) + 1;
    });
    return distribution;
  }
}

module.exports = new AIIntelligenceService();
