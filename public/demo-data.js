// Demo data for AI Dashboard
window.demoData = {
  insights: {
    totalMessages: 1247,
    urgentMessages: 23,
    categoryBreakdown: {
      urgent: 23,
      customer_support: 156,
      sales_inquiry: 89,
      bot_spam: 12,
      general: 967
    },
    platformActivity: {
      gmail: 456,
      telegram: 234,
      whatsapp: 189,
      instagram: 156,
      twitter: 212
    },
    topKeywords: ['support', 'pricing', 'urgent', 'issue', 'help', 'quote', 'problem', 'service', 'account', 'payment']
  },
  
  categories: {
    categories: {
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
    }
  },
  
  sampleMessages: {
    urgent: [
      {
        id: 'msg_001',
        platform: 'whatsapp',
        sender: 'John Smith',
        text: 'URGENT: Our server is down and customers are complaining. Need immediate assistance!',
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
        aiCategory: 'urgent',
        aiConfidence: 0.95,
        aiSentiment: 'negative'
      },
      {
        id: 'msg_002',
        platform: 'gmail',
        sender: 'support@company.com',
        text: 'CRITICAL: Database connection failed. All services are affected. Please respond ASAP.',
        timestamp: new Date(Date.now() - 1000 * 60 * 45), // 45 minutes ago
        aiCategory: 'urgent',
        aiConfidence: 0.92,
        aiSentiment: 'negative'
      }
    ],
    customer_support: [
      {
        id: 'msg_003',
        platform: 'telegram',
        sender: 'Sarah Johnson',
        text: 'Hi, I\'m having trouble logging into my account. It keeps saying "invalid credentials".',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        aiCategory: 'customer_support',
        aiConfidence: 0.88,
        aiSentiment: 'neutral'
      }
    ],
    sales_inquiry: [
      {
        id: 'msg_004',
        platform: 'instagram',
        sender: 'Mike Wilson',
        text: 'What are your pricing plans for the premium package? Looking to upgrade soon.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3 hours ago
        aiCategory: 'sales_inquiry',
        aiConfidence: 0.85,
        aiSentiment: 'positive'
      }
    ]
  }
};

// Mock API responses for demo
window.mockAPI = {
  async getInsights() {
    return new Promise(resolve => {
      setTimeout(() => resolve(window.demoData.insights), 500);
    });
  },
  
  async getCategories() {
    return new Promise(resolve => {
      setTimeout(() => resolve(window.demoData.categories), 300);
    });
  },
  
  async categorizeMessage(text) {
    return new Promise(resolve => {
      setTimeout(() => {
        // Simple demo categorization logic
        const lowerText = text.toLowerCase();
        let category = 'general';
        let confidence = 0.5;
        let sentiment = 'neutral';
        
        if (lowerText.includes('urgent') || lowerText.includes('asap') || lowerText.includes('emergency')) {
          category = 'urgent';
          confidence = 0.9;
          sentiment = 'negative';
        } else if (lowerText.includes('support') || lowerText.includes('help') || lowerText.includes('issue')) {
          category = 'customer_support';
          confidence = 0.8;
          sentiment = 'neutral';
        } else if (lowerText.includes('price') || lowerText.includes('cost') || lowerText.includes('quote')) {
          category = 'sales_inquiry';
          confidence = 0.85;
          sentiment = 'positive';
        } else if (lowerText.includes('free money') || lowerText.includes('click here')) {
          category = 'bot_spam';
          confidence = 0.7;
          sentiment = 'negative';
        }
        
        resolve({
          category,
          confidence,
          sentiment,
          keywords: text.toLowerCase().split(' ').filter(word => word.length > 3).slice(0, 5),
          suggestedReplies: window.demoData.categories.categories[category]?.keywords.map(keyword => 
            `Thank you for your ${keyword} inquiry. How can I assist you?`
          ) || ['Thank you for your message. How can I help you today?']
        });
      }, 800);
    });
  }
};
