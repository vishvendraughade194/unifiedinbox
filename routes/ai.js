const express = require('express');
const router = express.Router();
const messageService = require('../services/messageService');
const aiService = require('../services/aiService');

// Get AI insights for dashboard
router.get('/insights', async (req, res) => {
  try {
    const { timeRange = '24h' } = req.query;
    const insights = await messageService.getAIInsights(timeRange);
    res.json(insights);
  } catch (error) {
    console.error('Error getting AI insights:', error);
    res.status(500).json({ error: 'Failed to get AI insights' });
  }
});

// Get suggested replies for a message
router.get('/suggested-replies/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    const suggestions = await messageService.getSuggestedReplies(messageId);
    res.json({ suggestions });
  } catch (error) {
    console.error('Error getting suggested replies:', error);
    res.status(500).json({ error: 'Failed to get suggested replies' });
  }
});

// Generate conversation summary
router.post('/summarize-conversation/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const summary = await messageService.generateConversationSummary(conversationId);
    res.json({ summary });
  } catch (error) {
    console.error('Error generating conversation summary:', error);
    res.status(500).json({ error: 'Failed to generate summary' });
  }
});

// Categorize a message manually
router.post('/categorize', async (req, res) => {
  try {
    const { text, platform } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Message text is required' });
    }
    
    const analysis = await aiService.categorizeMessage(text, platform);
    res.json(analysis);
  } catch (error) {
    console.error('Error categorizing message:', error);
    res.status(500).json({ error: 'Failed to categorize message' });
  }
});

// Get messages by category
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const { limit = 50 } = req.query;
    const messages = await messageService.getMessagesByCategory(category, parseInt(limit));
    res.json({ messages, category, total: messages.length });
  } catch (error) {
    console.error('Error getting messages by category:', error);
    res.status(500).json({ error: 'Failed to get messages by category' });
  }
});

// Get urgent messages
router.get('/urgent', async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const messages = await messageService.getUrgentMessages(parseInt(limit));
    res.json({ messages, total: messages.length });
  } catch (error) {
    console.error('Error getting urgent messages:', error);
    res.status(500).json({ error: 'Failed to get urgent messages' });
  }
});

// Get AI categories info
router.get('/categories', (req, res) => {
  try {
    const categories = aiService.categories;
    res.json({ categories });
  } catch (error) {
    console.error('Error getting categories:', error);
    res.status(500).json({ error: 'Failed to get categories' });
  }
});

// Get sentiment analysis for a text
router.post('/sentiment', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }
    
    const sentiment = aiService.analyzeSentiment(text);
    const keywords = aiService.extractKeywords(text);
    
    res.json({ sentiment, keywords });
  } catch (error) {
    console.error('Error analyzing sentiment:', error);
    res.status(500).json({ error: 'Failed to analyze sentiment' });
  }
});

// Get contextual reply suggestions
router.post('/contextual-replies', async (req, res) => {
  try {
    const { text, category, platform } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Message text is required' });
    }
    
    const suggestions = await aiService.generateContextualReplies(text, category, platform);
    res.json({ suggestions });
  } catch (error) {
    console.error('Error generating contextual replies:', error);
    res.status(500).json({ error: 'Failed to generate contextual replies' });
  }
});

module.exports = router;
