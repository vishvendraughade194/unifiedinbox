// AI Dashboard Component for Unified Inbox
class AIDashboard {
  constructor() {
    this.insights = null;
    this.categories = null;
    this.currentView = 'overview';
    this.init();
  }

  async init() {
    this.setupEventListeners();
    await this.loadCategories();
    await this.loadInsights();
    this.render();
  }

  setupEventListeners() {
    // View switching
    document.getElementById('ai-overview-btn')?.addEventListener('click', () => this.switchView('overview'));
    document.getElementById('ai-categories-btn')?.addEventListener('click', () => this.switchView('categories'));
    document.getElementById('ai-suggestions-btn')?.addEventListener('click', () => this.switchView('suggestions'));
    
    // Refresh insights
    document.getElementById('refresh-insights-btn')?.addEventListener('click', () => this.refreshInsights());
    
    // Category filtering
    document.getElementById('category-filter')?.addEventListener('change', (e) => this.filterByCategory(e.target.value));
  }

  async loadCategories() {
    try {
      // Try real API first
      const response = await fetch('/api/ai/categories');
      if (response.ok) {
        this.categories = await response.json();
        return;
      }
    } catch (error) {
      console.log('Real API not available, using demo data');
    }
    
    // Fallback to demo data
    if (window.demoData) {
      this.categories = window.demoData.categories;
    }
  }

  async loadInsights() {
    try {
      // Try real API first
      const response = await fetch('/api/ai/insights?timeRange=24h');
      if (response.ok) {
        this.insights = await response.json();
        return;
      }
    } catch (error) {
      console.log('Real API not available, using demo data');
    }
    
    // Fallback to demo data
    if (window.demoData) {
      this.insights = window.demoData.insights;
    }
  }

  async refreshInsights() {
    await this.loadInsights();
    this.render();
  }

  switchView(view) {
    this.currentView = view;
    this.render();
  }

  async filterByCategory(category) {
    if (category === 'all') {
      this.render();
      return;
    }

    try {
      const response = await fetch(`/api/ai/category/${category}`);
      if (response.ok) {
        const data = await response.json();
        this.renderCategoryMessages(data.messages, category);
      }
    } catch (error) {
      console.error('Error filtering by category:', error);
    }
  }

  render() {
    const container = document.getElementById('ai-dashboard-container');
    if (!container) return;

    switch (this.currentView) {
      case 'overview':
        this.renderOverview();
        break;
      case 'categories':
        this.renderCategories();
        break;
      case 'suggestions':
        this.renderSuggestions();
        break;
    }
  }

  renderOverview() {
    const container = document.getElementById('ai-dashboard-container');
    if (!container || !this.insights) return;

    const categoryColors = {
      urgent: '#ff4444',
      customer_support: '#2196f3',
      sales_inquiry: '#4caf50',
      bot_spam: '#9e9e9e',
      general: '#607d8b'
    };

    container.innerHTML = `
      <div class="ai-overview">
        <div class="ai-header">
          <h2>🤖 AI Intelligence Dashboard</h2>
          <button id="refresh-insights-btn" class="btn btn-primary">
            <i class="fas fa-sync-alt"></i> Refresh
          </button>
        </div>
        
        <div class="ai-stats-grid">
          <div class="ai-stat-card">
            <div class="stat-icon">📊</div>
            <div class="stat-content">
              <h3>${this.insights.totalMessages}</h3>
              <p>Total Messages</p>
            </div>
          </div>
          
          <div class="ai-stat-card urgent">
            <div class="stat-icon">🚨</div>
            <div class="stat-content">
              <h3>${this.insights.urgentMessages}</h3>
              <p>Urgent Messages</p>
            </div>
          </div>
          
          <div class="ai-stat-card">
            <div class="stat-icon">🔍</div>
            <div class="stat-content">
              <h3>${this.insights.topKeywords.length}</h3>
              <p>Key Topics</p>
            </div>
          </div>
          
          <div class="ai-stat-card">
            <div class="stat-icon">📈</div>
            <div class="stat-content">
              <h3>${Object.keys(this.insights.platformActivity).length}</h3>
              <p>Active Platforms</p>
            </div>
          </div>
        </div>

        <div class="ai-charts-section">
          <div class="chart-container">
            <h3>Message Categories</h3>
            <div class="category-chart">
              ${this.renderCategoryChart()}
            </div>
          </div>
          
          <div class="chart-container">
            <h3>Platform Activity</h3>
            <div class="platform-chart">
              ${this.renderPlatformChart()}
            </div>
          </div>
        </div>

        <div class="ai-keywords-section">
          <h3>🔑 Top Keywords</h3>
          <div class="keywords-tags">
            ${this.insights.topKeywords.map(keyword => 
              `<span class="keyword-tag">${keyword}</span>`
            ).join('')}
          </div>
        </div>
      </div>
    `;

    this.setupEventListeners();
  }

  renderCategoryChart() {
    if (!this.insights.categoryBreakdown) return '<p>No category data available</p>';

    const total = Object.values(this.insights.categoryBreakdown).reduce((a, b) => a + b, 0);
    let chartHTML = '';

    for (const [category, count] of Object.entries(this.insights.categoryBreakdown)) {
      const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
      const color = this.categories?.categories[category]?.color || '#607d8b';
      const icon = this.categories?.categories[category]?.icon || '💭';
      
      chartHTML += `
        <div class="category-bar">
          <div class="category-info">
            <span class="category-icon">${icon}</span>
            <span class="category-name">${this.formatCategoryName(category)}</span>
            <span class="category-count">${count}</span>
          </div>
          <div class="category-progress">
            <div class="progress-bar" style="width: ${percentage}%; background-color: ${color}"></div>
          </div>
          <span class="category-percentage">${percentage}%</span>
        </div>
      `;
    }

    return chartHTML;
  }

  renderPlatformChart() {
    if (!this.insights.platformActivity) return '<p>No platform data available</p>';

    const total = Object.values(this.insights.platformActivity).reduce((a, b) => a + b, 0);
    let chartHTML = '';

    for (const [platform, count] of Object.entries(this.insights.platformActivity)) {
      const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
      
      chartHTML += `
        <div class="platform-bar">
          <div class="platform-info">
            <span class="platform-icon">${this.getPlatformIcon(platform)}</span>
            <span class="platform-name">${this.formatPlatformName(platform)}</span>
            <span class="platform-count">${count}</span>
          </div>
          <div class="platform-progress">
            <div class="progress-bar" style="width: ${percentage}%"></div>
          </div>
          <span class="platform-percentage">${percentage}%</span>
        </div>
      `;
    }

    return chartHTML;
  }

  renderCategories() {
    const container = document.getElementById('ai-dashboard-container');
    if (!container || !this.categories) return;

    container.innerHTML = `
      <div class="ai-categories">
        <div class="ai-header">
          <h2>🏷️ Message Categories</h2>
          <select id="category-filter" class="form-select">
            <option value="all">All Categories</option>
            ${Object.keys(this.categories.categories).map(category => 
              `<option value="${category}">${this.formatCategoryName(category)}</option>`
            ).join('')}
          </select>
        </div>

        <div class="categories-grid">
          ${Object.entries(this.categories.categories).map(([key, category]) => `
            <div class="category-card" style="border-left-color: ${category.color}">
              <div class="category-header">
                <span class="category-icon">${category.icon}</span>
                <h3>${this.formatCategoryName(key)}</h3>
                <span class="category-priority ${category.priority}">${category.priority}</span>
              </div>
              <div class="category-keywords">
                ${category.keywords.map(keyword => 
                  `<span class="keyword-tag small">${keyword}</span>`
                ).join('')}
              </div>
              <div class="category-stats">
                <span class="stat">
                  <i class="fas fa-message"></i>
                  ${this.insights?.categoryBreakdown[key] || 0} messages
                </span>
              </div>
            </div>
          `).join('')}
        </div>

        <div id="category-messages" class="category-messages">
          <h3>Messages in Selected Category</h3>
          <p>Select a category to view messages</p>
        </div>
      </div>
    `;

    this.setupEventListeners();
  }

  renderSuggestions() {
    const container = document.getElementById('ai-dashboard-container');
    if (!container) return;

    container.innerHTML = `
      <div class="ai-suggestions">
        <div class="ai-header">
          <h2>💡 Smart Reply Suggestions</h2>
        </div>
        
        <div class="suggestions-demo">
          <h3>Try AI-Powered Categorization</h3>
          <div class="demo-input">
            <textarea id="demo-message" placeholder="Type a message to see AI categorization and suggested replies..." rows="4"></textarea>
            <button id="analyze-message-btn" class="btn btn-primary">Analyze Message</button>
          </div>
          
          <div id="demo-results" class="demo-results" style="display: none;">
            <!-- Results will be populated here -->
          </div>
        </div>

        <div class="suggestions-templates">
          <h3>Reply Templates by Category</h3>
          <div class="templates-grid">
            ${this.renderReplyTemplates()}
          </div>
        </div>
      </div>
    `;

    this.setupEventListeners();
    this.setupDemoEventListeners();
  }

  renderReplyTemplates() {
    if (!this.categories) return '<p>Loading templates...</p>';

    return Object.entries(this.categories.categories).map(([key, category]) => `
      <div class="template-card" style="border-left-color: ${category.color}">
        <div class="template-header">
          <span class="template-icon">${category.icon}</span>
          <h4>${this.formatCategoryName(key)}</h4>
        </div>
        <div class="template-examples">
          ${this.getTemplateExamples(key).map(template => 
            `<div class="template-example">${template}</div>`
          ).join('')}
        </div>
      </div>
    `).join('');
  }

  getTemplateExamples(category) {
    const templates = {
      urgent: [
        "I understand this is urgent. I'm escalating this immediately.",
        "This has been marked as urgent. Our team will respond within 30 minutes."
      ],
      customer_support: [
        "Thank you for reaching out. I'm here to help resolve your issue.",
        "I understand you're experiencing a problem. Let me investigate."
      ],
      sales_inquiry: [
        "Thank you for your interest! I'd be happy to provide pricing information.",
        "Great question about pricing. Let me share our current rates."
      ],
      general: [
        "Thank you for your message. I'll get back to you shortly.",
        "Thanks for reaching out! How can I assist you today?"
      ]
    };

    return templates[category] || templates.general;
  }

  setupDemoEventListeners() {
    const analyzeBtn = document.getElementById('analyze-message-btn');
    const demoMessage = document.getElementById('demo-message');
    
    if (analyzeBtn && demoMessage) {
      analyzeBtn.addEventListener('click', async () => {
        const text = demoMessage.value.trim();
        if (!text) {
          alert('Please enter a message to analyze');
          return;
        }

        await this.analyzeDemoMessage(text);
      });
    }
  }

  async analyzeDemoMessage(text) {
    try {
      // Try real API first
      const response = await fetch('/api/ai/categorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, platform: 'demo' })
      });

      if (response.ok) {
        const analysis = await response.json();
        this.displayDemoResults(analysis);
        return;
      }
    } catch (error) {
      console.log('Real API not available, using mock API');
    }
    
    // Fallback to mock API
    if (window.mockAPI) {
      const analysis = await window.mockAPI.categorizeMessage(text);
      this.displayDemoResults(analysis);
    }
  }

  displayDemoResults(analysis) {
    const resultsContainer = document.getElementById('demo-results');
    if (!resultsContainer) return;

    const category = this.categories?.categories[analysis.category];
    const color = category?.color || '#607d8b';
    const icon = category?.icon || '💭';

    resultsContainer.innerHTML = `
      <div class="analysis-result">
        <div class="result-header" style="border-left-color: ${color}">
          <span class="result-icon">${icon}</span>
          <h4>Analysis Results</h4>
        </div>
        
        <div class="result-details">
          <div class="result-item">
            <strong>Category:</strong> 
            <span class="category-badge" style="background-color: ${color}">
              ${this.formatCategoryName(analysis.category)}
            </span>
          </div>
          
          <div class="result-item">
            <strong>Confidence:</strong> 
            <span class="confidence-score">${(analysis.confidence * 100).toFixed(1)}%</span>
          </div>
          
          <div class="result-item">
            <strong>Sentiment:</strong> 
            <span class="sentiment-badge ${analysis.sentiment}">${analysis.sentiment}</span>
          </div>
          
          <div class="result-item">
            <strong>Keywords:</strong>
            <div class="keywords-tags">
              ${analysis.keywords.map(keyword => 
                `<span class="keyword-tag">${keyword}</span>`
              ).join('')}
            </div>
          </div>
        </div>

        <div class="suggested-replies">
          <h5>💡 Suggested Replies</h5>
          <div class="reply-suggestions">
            ${analysis.suggestedReplies.map(reply => 
              `<div class="reply-suggestion">${reply}</div>`
            ).join('')}
          </div>
        </div>
      </div>
    `;

    resultsContainer.style.display = 'block';
  }

  renderCategoryMessages(messages, category) {
    const container = document.getElementById('category-messages');
    if (!container) return;

    if (!messages || messages.length === 0) {
      container.innerHTML = '<p>No messages found in this category.</p>';
      return;
    }

    container.innerHTML = `
      <h3>Messages in ${this.formatCategoryName(category)}</h3>
      <div class="messages-list">
        ${messages.map(message => `
          <div class="message-item">
            <div class="message-header">
              <span class="platform-badge">${this.getPlatformIcon(message.platform)} ${this.formatPlatformName(message.platform)}</span>
              <span class="message-time">${this.formatTime(message.timestamp)}</span>
            </div>
            <div class="message-sender">${message.sender}</div>
            <div class="message-text">${message.text}</div>
            <div class="message-ai-info">
              <span class="ai-confidence">AI Confidence: ${(message.aiConfidence * 100).toFixed(1)}%</span>
              <span class="ai-sentiment ${message.aiSentiment}">${message.aiSentiment}</span>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // Utility methods
  formatCategoryName(category) {
    return category.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  formatPlatformName(platform) {
    const names = {
      telegram: 'Telegram',
      gmail: 'Gmail',
      whatsapp: 'WhatsApp',
      instagram: 'Instagram',
      twitter: 'Twitter'
    };
    return names[platform] || platform;
  }

  getPlatformIcon(platform) {
    const icons = {
      telegram: '📱',
      gmail: '📧',
      whatsapp: '💬',
      instagram: '📸',
      twitter: '🐦'
    };
    return icons[platform] || '💬';
  }

  formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString();
  }
}

// Export for use in main app
window.AIDashboard = AIDashboard;
