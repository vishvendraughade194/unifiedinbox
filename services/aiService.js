const winston = require('winston');
const natural = require('natural');
const compromise = require('compromise');
const crypto = require('crypto');

// Conditionally import OpenAI only if API key is available
let OpenAI;
try {
  if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim() !== '') {
    OpenAI = require('openai');
  }
} catch (error) {
  console.log('OpenAI package not available or API key missing');
}

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'ai-service' },
  transports: [
    new winston.transports.File({ filename: 'logs/ai-service.log' }),
    new winston.transports.Console()
  ]
});

class AIService {
  constructor() {
    // Only initialize OpenAI if API key and package are available
    try {
      if (OpenAI && process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim() !== '') {
        this.openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY
        });
        console.log('OpenAI client initialized successfully');
      } else {
        this.openai = null;
        console.log('OpenAI not available. Advanced AI features will use fallback methods.');
      }
    } catch (error) {
      console.log('OpenAI initialization failed, using fallback methods:', error.message);
      this.openai = null;
    }
    
    // Initialize NLP classifiers
    this.tokenizer = new natural.WordTokenizer();
    this.tfidf = new natural.TfIdf();
    
    // Pre-trained categories with keywords
    this.categories = {
      urgent: {
        keywords: ['urgent', 'asap', 'emergency', 'critical', 'immediate', 'help', 'sos'],
        priority: 'high',
        color: '#ff4444',
        icon: '🚨'
      },
      customer_support: {
        keywords: ['support', 'help', 'issue', 'problem', 'broken', 'error', 'bug', 'complaint'],
        priority: 'medium',
        color: '#2196f3',
        icon: '💬'
      },
      sales_inquiry: {
        keywords: ['price', 'cost', 'quote', 'pricing', 'buy', 'purchase', 'order', 'sales'],
        priority: 'medium',
        color: '#4caf50',
        icon: '🛒'
      },
      bot_spam: {
        keywords: ['click here', 'free money', 'lottery', 'winner', 'urgent action', 'limited time'],
        priority: 'low',
        color: '#9e9e9e',
        icon: '🤖'
      },
      general: {
        keywords: [],
        priority: 'normal',
        color: '#607d8b',
        icon: '💭'
      }
    };
    
    // Reply templates by category
    this.replyTemplates = {
      urgent: [
        "I understand this is urgent. I'm escalating this to our priority support team immediately.",
        "This has been marked as urgent. Our team will respond within the next 30 minutes.",
        "Urgent request received. I'm connecting you with our emergency response team now."
      ],
      customer_support: [
        "Thank you for reaching out. I'm here to help resolve your issue.",
        "I understand you're experiencing a problem. Let me gather some details to assist you better.",
        "I'm sorry to hear about this issue. Let me investigate and get back to you with a solution."
      ],
      sales_inquiry: [
        "Thank you for your interest! I'd be happy to provide you with pricing information.",
        "Great question about pricing. Let me share our current rates and packages with you.",
        "I'd love to discuss our pricing options. What specific services are you looking for?"
      ],
      general: [
        "Thank you for your message. I'll get back to you shortly.",
        "Thanks for reaching out! How can I assist you today?",
        "I appreciate your message. Let me know if you need anything specific."
      ]
    };
  }

  // Categorize message using multiple AI approaches
  async categorizeMessage(messageText, platform = 'unknown') {
    try {
      const results = {
        category: 'general',
        confidence: 0,
        priority: 'normal',
        sentiment: 'neutral',
        keywords: [],
        suggestedReplies: [],
        aiInsights: {}
      };

      // 1. Rule-based categorization using compromise.js
      const ruleBasedCategory = this.ruleBasedCategorization(messageText);
      
      // 2. TF-IDF based categorization
      const tfidfCategory = this.tfidfCategorization(messageText);
      
             // 3. OpenAI-based categorization (if API key available)
       let openaiCategory = null;
       if (this.openai && process.env.OPENAI_API_KEY) {
         openaiCategory = await this.openaiCategorization(messageText);
       }

      // 4. Sentiment analysis
      const sentiment = this.analyzeSentiment(messageText);

             // Combine results with weighted scoring
       const scores = {};
       scores[ruleBasedCategory.category] = (scores[ruleBasedCategory.category] || 0) + ruleBasedCategory.confidence * 0.4;
       scores[tfidfCategory.category] = (scores[tfidfCategory.category] || 0) + tfidfCategory.confidence * 0.3;
       
       if (openaiCategory && this.openai) {
         scores[openaiCategory.category] = (scores[openaiCategory.category] || 0) + openaiCategory.confidence * 0.3;
       }

      // Get highest scoring category
      let bestCategory = 'general';
      let bestScore = 0;
      
      for (const [category, score] of Object.entries(scores)) {
        if (score > bestScore) {
          bestScore = score;
          bestCategory = category;
        }
      }

      // Set results
      results.category = bestCategory;
      results.confidence = bestScore;
      results.priority = this.categories[bestCategory]?.priority || 'normal';
      results.sentiment = sentiment;
      results.keywords = this.extractKeywords(messageText);
      results.suggestedReplies = this.getSuggestedReplies(bestCategory, messageText);
      results.aiInsights = {
        ruleBased: ruleBasedCategory,
        tfidf: tfidfCategory,
        openai: openaiCategory,
        processingTime: Date.now()
      };

      logger.info(`Message categorized as ${bestCategory} with ${(bestScore * 100).toFixed(1)}% confidence`);
      
      return results;
    } catch (error) {
      logger.error('Error categorizing message:', error);
      return {
        category: 'general',
        confidence: 0,
        priority: 'normal',
        sentiment: 'neutral',
        keywords: [],
        suggestedReplies: this.replyTemplates.general,
        aiInsights: { error: error.message }
      };
    }
  }

  // Rule-based categorization using compromise.js
  ruleBasedCategorization(text) {
    const doc = compromise(text.toLowerCase());
    
    // Check for urgent indicators
    const urgentTerms = doc.match('(urgent|asap|emergency|critical|immediate|help|sos)');
    if (urgentTerms.length > 0) {
      return { category: 'urgent', confidence: 0.9, matchedTerms: urgentTerms.out('array') };
    }

    // Check for support indicators
    const supportTerms = doc.match('(support|help|issue|problem|broken|error|bug|complaint)');
    if (supportTerms.length > 0) {
      return { category: 'customer_support', confidence: 0.8, matchedTerms: supportTerms.out('array') };
    }

    // Check for sales indicators
    const salesTerms = doc.match('(price|cost|quote|pricing|buy|purchase|order|sales)');
    if (salesTerms.length > 0) {
      return { category: 'sales_inquiry', confidence: 0.7, matchedTerms: salesTerms.out('array') };
    }

    // Check for spam indicators
    const spamTerms = doc.match('(click here|free money|lottery|winner|urgent action|limited time)');
    if (spamTerms.length > 0) {
      return { category: 'bot_spam', confidence: 0.6, matchedTerms: spamTerms.out('array') };
    }

    return { category: 'general', confidence: 0.5, matchedTerms: [] };
  }

  // TF-IDF based categorization
  tfidfCategorization(text) {
    try {
      // Add training documents for each category
      this.tfidf.addDocument('urgent help needed immediately', 'urgent');
      this.tfidf.addDocument('emergency situation critical', 'urgent');
      this.tfidf.addDocument('support issue problem broken', 'customer_support');
      this.tfidf.addDocument('help me fix this bug', 'customer_support');
      this.tfidf.addDocument('what is the price cost', 'sales_inquiry');
      this.tfidf.addDocument('pricing quote buy purchase', 'sales_inquiry');
      this.tfidf.addDocument('free money click here', 'bot_spam');
      this.tfidf.addDocument('lottery winner urgent action', 'bot_spam');

      // Classify the input text
      const classifications = this.tfidf.tfidf(text);
      
      let bestCategory = 'general';
      let bestScore = 0;

      for (const classification of classifications) {
        if (classification.score > bestScore) {
          bestScore = classification.score;
          bestCategory = classification.document;
        }
      }

      return { 
        category: bestCategory, 
        confidence: Math.min(bestScore / 10, 1), // Normalize score
        matchedTerms: this.tokenizer.tokenize(text)
      };
    } catch (error) {
      logger.error('TF-IDF categorization error:', error);
      return { category: 'general', confidence: 0.3, matchedTerms: [] };
    }
  }

  // OpenAI-based categorization
  async openaiCategorization(text) {
    try {
      // Only use OpenAI if available
      if (!this.openai || !OpenAI || !process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.trim() === '') {
        return null;
      }

      const prompt = `Categorize this message into one of these categories:
- urgent: Emergency, critical, immediate help needed
- customer_support: Technical issues, problems, support requests
- sales_inquiry: Pricing, quotes, purchasing questions
- bot_spam: Suspicious, promotional, automated messages
- general: Regular conversation, questions, general inquiries

Message: "${text}"

Respond with JSON format:
{
  "category": "category_name",
  "confidence": 0.95,
  "reasoning": "Brief explanation"
}`;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 150,
        temperature: 0.3
      });

      const response = completion.choices[0].message.content;
      const parsed = JSON.parse(response);
      
      return {
        category: parsed.category,
        confidence: parsed.confidence,
        reasoning: parsed.reasoning
      };
    } catch (error) {
      logger.error('OpenAI categorization error:', error);
      return null;
    }
  }

  // Sentiment analysis
  analyzeSentiment(text) {
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'love', 'like', 'happy', 'pleased'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'dislike', 'angry', 'frustrated', 'disappointed', 'sad'];
    
    const words = this.tokenizer.tokenize(text.toLowerCase());
    let positiveScore = 0;
    let negativeScore = 0;
    
    words.forEach(word => {
      if (positiveWords.includes(word)) positiveScore++;
      if (negativeWords.includes(word)) negativeScore++;
    });
    
    if (positiveScore > negativeScore) return 'positive';
    if (negativeScore > positiveScore) return 'negative';
    return 'neutral';
  }

  // Extract keywords from text
  extractKeywords(text) {
    const doc = compromise(text.toLowerCase());
    const nouns = doc.nouns().out('array');
    const verbs = doc.verbs().out('array');
    
    // Filter out common words
    const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    const keywords = [...nouns, ...verbs].filter(word => 
      word.length > 2 && !commonWords.includes(word)
    );
    
    return [...new Set(keywords)].slice(0, 5); // Return unique keywords, max 5
  }

  // Get suggested replies based on category and context
  getSuggestedReplies(category, originalText) {
    const baseTemplates = this.replyTemplates[category] || this.replyTemplates.general;
    
    // If OpenAI is available, try to generate contextual replies
    if (this.openai && OpenAI && process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim() !== '') {
      return this.generateContextualReplies(originalText, category, baseTemplates);
    }
    
    return baseTemplates;
  }

  // Generate contextual replies using OpenAI
  async generateContextualReplies(originalText, category, baseTemplates) {
    try {
      // Only use OpenAI if available
      if (!this.openai || !OpenAI || !process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.trim() === '') {
        return baseTemplates;
      }

      const prompt = `Based on this message: "${originalText}"
Category: ${category}
Base templates: ${baseTemplates.join(', ')}

Generate 3 contextual, personalized reply suggestions that:
1. Acknowledge the specific content of the message
2. Match the category tone and purpose
3. Are professional and helpful
4. Are under 100 characters each

Respond with JSON array of strings.`;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 200,
        temperature: 0.7
      });

      const response = completion.choices[0].message.content;
      const parsed = JSON.parse(response);
      
      return parsed.length > 0 ? parsed : baseTemplates;
    } catch (error) {
      logger.error('Error generating contextual replies:', error);
      return baseTemplates;
    }
  }

  // Generate conversation summary
  async generateConversationSummary(messages) {
    try {
      if (!this.openai || !OpenAI || !process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.trim() === '') {
        return this.generateBasicSummary(messages);
      }

      const conversationText = messages.map(m => `${m.sender}: ${m.text}`).join('\n');
      
      const prompt = `Summarize this conversation in 2-3 sentences, highlighting:
1. Main topic or issue
2. Key points discussed
3. Current status or next steps

Conversation:
${conversationText}

Summary:`;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 150,
        temperature: 0.5
      });

      return completion.choices[0].message.content;
    } catch (error) {
      logger.error('Error generating conversation summary:', error);
      return this.generateBasicSummary(messages);
    }
  }

  // Basic summary without AI
  generateBasicSummary(messages) {
    const topics = this.extractKeywords(messages.map(m => m.text).join(' '));
    const participants = [...new Set(messages.map(m => m.sender))];
    const messageCount = messages.length;
    
    return `Conversation between ${participants.join(', ')} with ${messageCount} messages. Key topics: ${topics.slice(0, 3).join(', ')}.`;
  }

  // Get AI insights for dashboard
  getAIInsights(messages, timeRange = '24h') {
    const insights = {
      totalMessages: messages.length,
      categoryBreakdown: {},
      sentimentTrend: {},
      responseTime: {},
      topKeywords: [],
      urgentMessages: 0,
      platformActivity: {}
    };

    // Process messages for insights
    messages.forEach(message => {
      // Category breakdown
      const category = message.aiCategory || 'general';
      insights.categoryBreakdown[category] = (insights.categoryBreakdown[category] || 0) + 1;
      
      // Urgent messages count
      if (category === 'urgent') insights.urgentMessages++;
      
      // Platform activity
      const platform = message.platform;
      insights.platformActivity[platform] = (insights.platformActivity[platform] || 0) + 1;
    });

    // Extract top keywords from all messages
    const allText = messages.map(m => m.text).join(' ');
    insights.topKeywords = this.extractKeywords(allText);

    return insights;
  }
}

module.exports = new AIService();