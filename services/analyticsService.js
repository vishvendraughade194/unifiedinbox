const winston = require('winston');
const moment = require('moment');
const aiIntelligence = require('./aiIntelligenceService');

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'analytics-service' },
  transports: [
    new winston.transports.File({ filename: 'logs/analytics-service.log' }),
    new winston.transports.Console()
  ]
});

class AnalyticsService {
  constructor() {
    this.metrics = new Map();
    this.dailyStats = new Map();
    this.platformPerformance = new Map();
    this.userEngagement = new Map();
    this.responseTimeTracker = new Map();
    this.sentimentHistory = new Map();
  }

  // Track message metrics
  trackMessage(message, platform) {
    try {
      const timestamp = new Date();
      const dateKey = moment(timestamp).format('YYYY-MM-DD');
      
      // Update daily stats
      this.updateDailyStats(dateKey, message, platform);
      
      // Update platform performance
      this.updatePlatformPerformance(platform, message);
      
      // Track response times for conversations
      if (message.conversationId) {
        this.trackResponseTime(message.conversationId, message, platform);
      }
      
      // Track sentiment
      if (message.sentiment) {
        this.trackSentiment(dateKey, message.sentiment, platform);
      }
      
      logger.debug(`Message tracked for analytics: ${message.id} on ${platform}`);
    } catch (error) {
      logger.error('Error tracking message metrics:', error);
    }
  }

  // Update daily statistics
  updateDailyStats(dateKey, message, platform) {
    if (!this.dailyStats.has(dateKey)) {
      this.dailyStats.set(dateKey, {
        totalMessages: 0,
        platforms: {},
        categories: {},
        urgencies: {},
        sentiments: {},
        responseTimes: [],
        activeConversations: new Set()
      });
    }
    
    const stats = this.dailyStats.get(dateKey);
    stats.totalMessages++;
    
    // Platform stats
    if (!stats.platforms[platform]) {
      stats.platforms[platform] = {
        count: 0,
        incoming: 0,
        outgoing: 0,
        categories: {},
        urgencies: {}
      };
    }
    stats.platforms[platform].count++;
    
    if (message.isIncoming) {
      stats.platforms[platform].incoming++;
    } else {
      stats.platforms[platform].outgoing++;
    }
    
    // Category stats
    if (message.category) {
      if (!stats.categories[message.category]) {
        stats.categories[message.category] = 0;
      }
      stats.categories[message.category]++;
      
      if (!stats.platforms[platform].categories[message.category]) {
        stats.platforms[platform].categories[message.category] = 0;
      }
      stats.platforms[platform].categories[message.category]++;
    }
    
    // Urgency stats
    if (message.urgency) {
      if (!stats.urgencies[message.urgency]) {
        stats.urgencies[message.urgency] = 0;
      }
      stats.urgencies[message.urgency]++;
      
      if (!stats.platforms[platform].urgencies[message.urgency]) {
        stats.platforms[platform].urgencies[message.urgency] = 0;
      }
      stats.platforms[platform].urgencies[message.urgency]++;
    }
    
    // Track active conversations
    if (message.conversationId) {
      stats.activeConversations.add(message.conversationId);
    }
  }

  // Update platform performance metrics
  updatePlatformPerformance(platform, message) {
    if (!this.platformPerformance.has(platform)) {
      this.platformPerformance.set(platform, {
        totalMessages: 0,
        responseRate: 0,
        averageResponseTime: 0,
        categories: {},
        urgencies: {},
        sentiments: {},
        lastActivity: new Date(),
        uptime: 100,
        errorRate: 0
      });
    }
    
    const perf = this.platformPerformance.get(platform);
    perf.totalMessages++;
    perf.lastActivity = new Date();
    
    // Update category distribution
    if (message.category) {
      if (!perf.categories[message.category]) {
        perf.categories[message.category] = 0;
      }
      perf.categories[message.category]++;
    }
    
    // Update urgency distribution
    if (message.urgency) {
      if (!perf.urgencies[message.urgency]) {
        perf.urgencies[message.urgency] = 0;
      }
      perf.urgencies[message.urgency]++;
    }
    
    // Update sentiment distribution
    if (message.sentiment) {
      if (!perf.sentiments[message.sentiment]) {
        perf.sentiments[message.sentiment] = 0;
      }
      perf.sentiments[message.sentiment]++;
    }
  }

  // Track response times
  trackResponseTime(conversationId, message, platform) {
    if (!this.responseTimeTracker.has(conversationId)) {
      this.responseTimeTracker.set(conversationId, {
        messages: [],
        platform,
        firstMessage: message.timestamp,
        lastMessage: message.timestamp,
        responseTimes: []
      });
    }
    
    const tracker = this.responseTimeTracker.get(conversationId);
    tracker.messages.push({
      id: message.id,
      timestamp: message.timestamp,
      isIncoming: message.isIncoming,
      sender: message.sender
    });
    
    tracker.lastMessage = message.timestamp;
    
    // Calculate response time if this is a response
    if (tracker.messages.length > 1) {
      const lastIncoming = tracker.messages
        .slice(0, -1)
        .reverse()
        .find(m => m.isIncoming);
      
      if (lastIncoming && !message.isIncoming) {
        const responseTime = message.timestamp - lastIncoming.timestamp;
        tracker.responseTimes.push(responseTime);
      }
    }
  }

  // Track sentiment over time
  trackSentiment(dateKey, sentiment, platform) {
    if (!this.sentimentHistory.has(dateKey)) {
      this.sentimentHistory.set(dateKey, {
        positive: 0,
        negative: 0,
        neutral: 0,
        platforms: {}
      });
    }
    
    const history = this.sentimentHistory.get(dateKey);
    history[sentiment]++;
    
    if (!history.platforms[platform]) {
      history.platforms[platform] = { positive: 0, negative: 0, neutral: 0 };
    }
    history.platforms[platform][sentiment]++;
  }

  // Get comprehensive analytics dashboard data
  async getAnalyticsDashboard(timeRange = '7d') {
    try {
      const endDate = new Date();
      const startDate = this.getStartDate(timeRange);
      
      const dashboard = {
        overview: await this.getOverviewStats(startDate, endDate),
        platformPerformance: await this.getPlatformPerformance(startDate, endDate),
        conversationInsights: await this.getConversationInsights(startDate, endDate),
        responseTimeAnalysis: await this.getResponseTimeAnalysis(startDate, endDate),
        sentimentTrends: await this.getSentimentTrends(startDate, endDate),
        categoryDistribution: await this.getCategoryDistribution(startDate, endDate),
        urgencyAnalysis: await this.getUrgencyAnalysis(startDate, endDate),
        userEngagement: await this.getUserEngagement(startDate, endDate),
        trends: await this.getTrends(startDate, endDate)
      };
      
      return dashboard;
    } catch (error) {
      logger.error('Error getting analytics dashboard:', error);
      throw error;
    }
  }

  // Get start date based on time range
  getStartDate(timeRange) {
    const now = new Date();
    switch (timeRange) {
      case '24h':
        return moment(now).subtract(1, 'day').toDate();
      case '7d':
        return moment(now).subtract(7, 'days').toDate();
      case '30d':
        return moment(now).subtract(30, 'days').toDate();
      case '90d':
        return moment(now).subtract(90, 'days').toDate();
      default:
        return moment(now).subtract(7, 'days').toDate();
    }
  }

  // Get overview statistics
  async getOverviewStats(startDate, endDate) {
    const stats = {
      totalMessages: 0,
      totalConversations: 0,
      activePlatforms: 0,
      averageResponseTime: 0,
      responseRate: 0,
      topCategory: 'general',
      topUrgency: 'normal',
      sentimentScore: 0
    };
    
    // Aggregate data from daily stats
    for (const [dateKey, dailyStats] of this.dailyStats) {
      const date = moment(dateKey).toDate();
      if (date >= startDate && date <= endDate) {
        stats.totalMessages += dailyStats.totalMessages;
        stats.totalConversations += dailyStats.activeConversations.size;
        
        // Aggregate categories
        Object.entries(dailyStats.categories).forEach(([category, count]) => {
          if (!stats.categories) stats.categories = {};
          stats.categories[category] = (stats.categories[category] || 0) + count;
        });
        
        // Aggregate urgencies
        Object.entries(dailyStats.urgencies).forEach(([urgency, count]) => {
          if (!stats.urgencies) stats.urgencies = {};
          stats.urgencies[urgency] = (stats.urgencies[urgency] || 0) + count;
        });
      }
    }
    
    // Calculate top category and urgency
    if (stats.categories) {
      stats.topCategory = Object.entries(stats.categories)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'general';
    }
    
    if (stats.urgencies) {
      stats.topUrgency = Object.entries(stats.urgencies)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'normal';
    }
    
    // Calculate average response time
    const allResponseTimes = [];
    for (const [, tracker] of this.responseTimeTracker) {
      if (tracker.lastMessage >= startDate && tracker.lastMessage <= endDate) {
        allResponseTimes.push(...tracker.responseTimes);
      }
    }
    
    if (allResponseTimes.length > 0) {
      stats.averageResponseTime = Math.round(
        allResponseTimes.reduce((sum, time) => sum + time, 0) / allResponseTimes.length / 1000
      );
    }
    
    // Calculate response rate
    const totalIncoming = this.getTotalIncomingMessages(startDate, endDate);
    const totalOutgoing = this.getTotalOutgoingMessages(startDate, endDate);
    if (totalIncoming > 0) {
      stats.responseRate = Math.round((totalOutgoing / totalIncoming) * 100);
    }
    
    // Calculate sentiment score
    stats.sentimentScore = this.calculateSentimentScore(startDate, endDate);
    
    return stats;
  }

  // Get platform performance metrics
  async getPlatformPerformance(startDate, endDate) {
    const performance = {};
    
    for (const [platform, perf] of this.platformPerformance) {
      if (perf.lastActivity >= startDate && perf.lastActivity <= endDate) {
        performance[platform] = {
          totalMessages: perf.totalMessages,
          responseRate: perf.responseRate,
          averageResponseTime: perf.averageResponseTime,
          uptime: perf.uptime,
          errorRate: perf.errorRate,
          lastActivity: perf.lastActivity,
          categories: perf.categories,
          urgencies: perf.urgencies,
          sentiments: perf.sentiments
        };
      }
    }
    
    return performance;
  }

  // Get conversation insights
  async getConversationInsights(startDate, endDate) {
    const insights = {
      totalConversations: 0,
      averageMessagesPerConversation: 0,
      longestConversations: [],
      mostActiveContacts: [],
      conversationCategories: {},
      responseTimeDistribution: {}
    };
    
    const conversations = new Map();
    
    // Aggregate conversation data
    for (const [, tracker] of this.responseTimeTracker) {
      if (tracker.lastMessage >= startDate && tracker.lastMessage <= endDate) {
        conversations.set(tracker.conversationId, {
          id: tracker.conversationId,
          platform: tracker.platform,
          messageCount: tracker.messages.length,
          duration: tracker.lastMessage - tracker.firstMessage,
          averageResponseTime: tracker.responseTimes.length > 0 
            ? Math.round(tracker.responseTimes.reduce((sum, time) => sum + time, 0) / tracker.responseTimes.length / 1000)
            : 0,
          responseTimes: tracker.responseTimes
        });
      }
    }
    
    insights.totalConversations = conversations.size;
    
    if (insights.totalConversations > 0) {
      const totalMessages = Array.from(conversations.values())
        .reduce((sum, conv) => sum + conv.messageCount, 0);
      insights.averageMessagesPerConversation = Math.round(totalMessages / insights.totalConversations);
      
      // Get longest conversations
      insights.longestConversations = Array.from(conversations.values())
        .sort((a, b) => b.messageCount - a.messageCount)
        .slice(0, 10);
      
      // Response time distribution
      const responseTimes = Array.from(conversations.values())
        .map(conv => conv.averageResponseTime)
        .filter(time => time > 0);
      
      if (responseTimes.length > 0) {
        insights.responseTimeDistribution = {
          immediate: responseTimes.filter(time => time <= 60).length,
          quick: responseTimes.filter(time => time > 60 && time <= 300).length,
          moderate: responseTimes.filter(time => time > 300 && time <= 900).length,
          slow: responseTimes.filter(time => time > 900).length
        };
      }
    }
    
    return insights;
  }

  // Get response time analysis
  async getResponseTimeAnalysis(startDate, endDate) {
    const analysis = {
      averageResponseTime: 0,
      responseTimeDistribution: {},
      platformComparison: {},
      trend: 'stable',
      recommendations: []
    };
    
    const allResponseTimes = [];
    const platformResponseTimes = {};
    
    for (const [, tracker] of this.responseTimeTracker) {
      if (tracker.lastMessage >= startDate && tracker.lastMessage <= endDate) {
        const times = tracker.responseTimes.filter(time => time > 0);
        allResponseTimes.push(...times);
        
        if (!platformResponseTimes[tracker.platform]) {
          platformResponseTimes[tracker.platform] = [];
        }
        platformResponseTimes[tracker.platform].push(...times);
      }
    }
    
    if (allResponseTimes.length > 0) {
      analysis.averageResponseTime = Math.round(
        allResponseTimes.reduce((sum, time) => sum + time, 0) / allResponseTimes.length / 1000
      );
      
      // Response time distribution
      analysis.responseTimeDistribution = {
        immediate: allResponseTimes.filter(time => time <= 60000).length, // ≤1 min
        quick: allResponseTimes.filter(time => time > 60000 && time <= 300000).length, // 1-5 min
        moderate: allResponseTimes.filter(time => time > 300000 && time <= 900000).length, // 5-15 min
        slow: allResponseTimes.filter(time => time > 900000).length // >15 min
      };
      
      // Platform comparison
      Object.entries(platformResponseTimes).forEach(([platform, times]) => {
        if (times.length > 0) {
          analysis.platformComparison[platform] = Math.round(
            times.reduce((sum, time) => sum + time, 0) / times.length / 1000
          );
        }
      });
      
      // Generate recommendations
      if (analysis.averageResponseTime > 900) {
        analysis.recommendations.push("Consider implementing auto-replies for common inquiries");
        analysis.recommendations.push("Review team response time targets and training");
      } else if (analysis.averageResponseTime > 300) {
        analysis.recommendations.push("Monitor response times to maintain quality");
      } else {
        analysis.recommendations.push("Excellent response times! Consider proactive engagement");
      }
    }
    
    return analysis;
  }

  // Get sentiment trends
  async getSentimentTrends(startDate, endDate) {
    const trends = {
      overallSentiment: 'neutral',
      sentimentProgression: [],
      platformSentiment: {},
      sentimentDrivers: [],
      recommendations: []
    };
    
    const sentimentData = [];
    
    for (const [dateKey, history] of this.sentimentHistory) {
      const date = moment(dateKey).toDate();
      if (date >= startDate && date <= endDate) {
        sentimentData.push({
          date: dateKey,
          positive: history.positive,
          negative: history.negative,
          neutral: history.neutral,
          total: history.positive + history.negative + history.neutral
        });
      }
    }
    
    if (sentimentData.length > 0) {
      // Calculate overall sentiment
      const totalPositive = sentimentData.reduce((sum, day) => sum + day.positive, 0);
      const totalNegative = sentimentData.reduce((sum, day) => sum + day.negative, 0);
      const totalNeutral = sentimentData.reduce((sum, day) => sum + day.neutral, 0);
      const total = totalPositive + totalNegative + totalNeutral;
      
      if (total > 0) {
        const positiveRatio = totalPositive / total;
        const negativeRatio = totalNegative / total;
        
        if (positiveRatio > 0.6) {
          trends.overallSentiment = 'positive';
        } else if (negativeRatio > 0.4) {
          trends.overallSentiment = 'negative';
        } else {
          trends.overallSentiment = 'neutral';
        }
      }
      
      // Sentiment progression over time
      trends.sentimentProgression = sentimentData.map(day => ({
        date: day.date,
        sentiment: day.total > 0 ? (day.positive - day.negative) / day.total : 0
      }));
      
      // Platform sentiment comparison
      for (const [dateKey, history] of this.sentimentHistory) {
        const date = moment(dateKey).toDate();
        if (date >= startDate && date <= endDate) {
          Object.entries(history.platforms).forEach(([platform, platformSentiment]) => {
            if (!trends.platformSentiment[platform]) {
              trends.platformSentiment[platform] = { positive: 0, negative: 0, neutral: 0 };
            }
            trends.platformSentiment[platform].positive += platformSentiment.positive;
            trends.platformSentiment[platform].negative += platformSentiment.negative;
            trends.platformSentiment[platform].neutral += platformSentiment.neutral;
          });
        }
      }
      
      // Generate recommendations based on sentiment
      if (trends.overallSentiment === 'negative') {
        trends.recommendations.push("Review recent interactions to identify pain points");
        trends.recommendations.push("Consider proactive outreach to improve sentiment");
      } else if (trends.overallSentiment === 'positive') {
        trends.recommendations.push("Maintain current engagement quality");
        trends.recommendations.push("Leverage positive sentiment for testimonials");
      }
    }
    
    return trends;
  }

  // Get category distribution
  async getCategoryDistribution(startDate, endDate) {
    const distribution = {
      categories: {},
      platformBreakdown: {},
      trends: {},
      recommendations: []
    };
    
    // Aggregate categories from daily stats
    for (const [dateKey, dailyStats] of this.dailyStats) {
      const date = moment(dateKey).toDate();
      if (date >= startDate && date <= endDate) {
        Object.entries(dailyStats.categories).forEach(([category, count]) => {
          if (!distribution.categories[category]) {
            distribution.categories[category] = 0;
          }
          distribution.categories[category] += count;
          
          // Platform breakdown
          if (!distribution.platformBreakdown[category]) {
            distribution.platformBreakdown[category] = {};
          }
          
          Object.entries(dailyStats.platforms).forEach(([platform, platformStats]) => {
            if (platformStats.categories && platformStats.categories[category]) {
              if (!distribution.platformBreakdown[category][platform]) {
                distribution.platformBreakdown[category][platform] = 0;
              }
              distribution.platformBreakdown[category][platform] += platformStats.categories[category];
            }
          });
        });
      }
    }
    
    // Generate recommendations
    const topCategory = Object.entries(distribution.categories)
      .sort(([,a], [,b]) => b - a)[0];
    
    if (topCategory) {
      if (topCategory[0] === 'customer_support' && topCategory[1] > 100) {
        distribution.recommendations.push("High support volume - consider knowledge base or FAQ");
      } else if (topCategory[0] === 'sales_inquiry' && topCategory[1] > 50) {
        distribution.recommendations.push("Strong sales interest - optimize lead qualification process");
      }
    }
    
    return distribution;
  }

  // Get urgency analysis
  async getUrgencyAnalysis(startDate, endDate) {
    const analysis = {
      urgencyDistribution: {},
      urgentMessageTrends: [],
      platformUrgency: {},
      recommendations: []
    };
    
    // Aggregate urgency data from daily stats
    for (const [dateKey, dailyStats] of this.dailyStats) {
      const date = moment(dateKey).toDate();
      if (date >= startDate && date <= endDate) {
        Object.entries(dailyStats.urgencies).forEach(([urgency, count]) => {
          if (!analysis.urgencyDistribution[urgency]) {
            analysis.urgencyDistribution[urgency] = 0;
          }
          analysis.urgencyDistribution[urgency] += count;
          
          // Platform urgency breakdown
          Object.entries(dailyStats.platforms).forEach(([platform, platformStats]) => {
            if (platformStats.urgencies && platformStats.urgencies[urgency]) {
              if (!analysis.platformUrgency[platform]) {
                analysis.platformUrgency[platform] = {};
              }
              if (!analysis.platformUrgency[platform][urgency]) {
                analysis.platformUrgency[platform][urgency] = 0;
              }
              analysis.platformUrgency[platform][urgency] += platformStats.urgencies[urgency];
            }
          });
        });
      }
    }
    
    // Generate recommendations
    const urgentCount = analysis.urgencyDistribution.urgent || 0;
    if (urgentCount > 50) {
      analysis.recommendations.push("High urgent message volume - review escalation procedures");
    } else if (urgentCount > 20) {
      analysis.recommendations.push("Monitor urgent messages to maintain response quality");
    }
    
    return analysis;
  }

  // Get user engagement metrics
  async getUserEngagement(startDate, endDate) {
    const engagement = {
      activeUsers: 0,
      userActivity: {},
      responsePatterns: {},
      recommendations: []
    };
    
    // This would typically integrate with user authentication system
    // For now, we'll provide a framework
    
    return engagement;
  }

  // Get trends over time
  async getTrends(startDate, endDate) {
    const trends = {
      messageVolume: [],
      responseTimes: [],
      sentiment: [],
      categories: []
    };
    
    // Aggregate daily data into trends
    const dailyData = [];
    for (const [dateKey, dailyStats] of this.dailyStats) {
      const date = moment(dateKey).toDate();
      if (date >= startDate && date <= endDate) {
        dailyData.push({
          date: dateKey,
          ...dailyStats
        });
      }
    }
    
    // Sort by date
    dailyData.sort((a, b) => moment(a.date).diff(moment(b.date)));
    
    // Generate trend data
    trends.messageVolume = dailyData.map(day => ({
      date: day.date,
      count: day.totalMessages
    }));
    
    return trends;
  }

  // Helper methods
  getTotalIncomingMessages(startDate, endDate) {
    let total = 0;
    for (const [, dailyStats] of this.dailyStats) {
      const date = moment(dailyStats.date).toDate();
      if (date >= startDate && date <= endDate) {
        Object.values(dailyStats.platforms).forEach(platform => {
          total += platform.incoming || 0;
        });
      }
    }
    return total;
  }

  getTotalOutgoingMessages(startDate, endDate) {
    let total = 0;
    for (const [, dailyStats] of this.dailyStats) {
      const date = moment(dailyStats.date).toDate();
      if (date >= startDate && date <= endDate) {
        Object.values(dailyStats.platforms).forEach(platform => {
          total += platform.outgoing || 0;
        });
      }
    }
    return total;
  }

  calculateSentimentScore(startDate, endDate) {
    let positive = 0, negative = 0, neutral = 0;
    
    for (const [dateKey, history] of this.sentimentHistory) {
      const date = moment(dateKey).toDate();
      if (date >= startDate && date <= endDate) {
        positive += history.positive;
        negative += history.negative;
        neutral += history.neutral;
      }
    }
    
    const total = positive + negative + neutral;
    if (total === 0) return 0;
    
    // Return sentiment score from -1 (very negative) to 1 (very positive)
    return (positive - negative) / total;
  }

  // Export analytics data
  exportAnalyticsData(format = 'json', timeRange = '7d') {
    try {
      const data = this.getAnalyticsDashboard(timeRange);
      
      switch (format.toLowerCase()) {
        case 'csv':
          return this.convertToCSV(data);
        case 'json':
        default:
          return JSON.stringify(data, null, 2);
      }
    } catch (error) {
      logger.error('Error exporting analytics data:', error);
      throw error;
    }
  }

  // Convert data to CSV format
  convertToCSV(data) {
    // Implementation for CSV conversion
    // This would convert the analytics data to CSV format
    return "CSV conversion not implemented yet";
  }

  // Clear old analytics data
  clearOldData(daysToKeep = 90) {
    try {
      const cutoffDate = moment().subtract(daysToKeep, 'days').toDate();
      
      // Clear old daily stats
      for (const [dateKey] of this.dailyStats) {
        const date = moment(dateKey).toDate();
        if (date < cutoffDate) {
          this.dailyStats.delete(dateKey);
        }
      }
      
      // Clear old sentiment history
      for (const [dateKey] of this.sentimentHistory) {
        const date = moment(dateKey).toDate();
        if (date < cutoffDate) {
          this.sentimentHistory.delete(dateKey);
        }
      }
      
      logger.info(`Cleared analytics data older than ${daysToKeep} days`);
    } catch (error) {
      logger.error('Error clearing old analytics data:', error);
    }
  }
}

module.exports = new AnalyticsService();
