// Unified Messaging Dashboard - Frontend Application
class UnifiedInboxApp {
  constructor() {
    this.socket = null;
    this.currentUser = null;
    this.currentFilter = 'all';
    this.messages = [];
    this.platforms = [];
    this.conversations = new Map();
    
    this.init();
  }

  async init() {
    this.setupEventListeners();
    this.checkAuthStatus();
    this.initializeSocket();
    this.loadPlatforms();
    this.setupNotifications();
  }

  setupEventListeners() {
    // Authentication
    document.getElementById('loginForm').addEventListener('submit', (e) => this.handleLogin(e));
    document.getElementById('registerForm').addEventListener('submit', (e) => this.handleRegister(e));
    document.getElementById('showRegister').addEventListener('click', (e) => this.toggleAuthForms(e));
    document.getElementById('showLogin').addEventListener('click', (e) => this.toggleAuthForms(e));
    document.getElementById('logoutBtn').addEventListener('click', () => this.handleLogout());
    
    // Platform connections
    document.getElementById('connectPlatformBtn').addEventListener('click', () => this.showPlatformModal());
    
    // Message filters
    document.querySelectorAll('.filter-list li').forEach(filter => {
      filter.addEventListener('click', (e) => this.handleFilterChange(e));
    });
    
    // Search
    document.getElementById('searchInput').addEventListener('input', (e) => this.handleSearch(e));
    
    // Message actions
    document.getElementById('messagesContainer').addEventListener('click', (e) => this.handleMessageAction(e));
    
    // Send message
    document.getElementById('sendMessageForm').addEventListener('submit', (e) => this.handleSendMessage(e));
    
    // Modal close
    document.querySelectorAll('.close').forEach(closeBtn => {
      closeBtn.addEventListener('click', () => this.closeModals());
    });
    
    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal')) {
        this.closeModals();
      }
    });
  }

  async checkAuthStatus() {
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        const response = await fetch('/api/auth/verify', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const userData = await response.json();
          this.currentUser = userData.user;
          this.showDashboard();
          this.loadMessages();
        } else {
          localStorage.removeItem('authToken');
          this.showAuthModal();
        }
      } catch (error) {
        console.error('Auth verification failed:', error);
        localStorage.removeItem('authToken');
        this.showAuthModal();
      }
    } else {
      this.showAuthModal();
    }
  }

  async handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('authToken', data.token);
        this.currentUser = data.user;
        this.showDashboard();
        this.loadMessages();
        this.showNotification('Login successful!', 'success');
      } else {
        const error = await response.json();
        this.showNotification(error.error || 'Login failed', 'error');
      }
    } catch (error) {
      console.error('Login error:', error);
      this.showNotification('Login failed. Please try again.', 'error');
    }
  }

  async handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('authToken', data.token);
        this.currentUser = data.user;
        this.showDashboard();
        this.loadMessages();
        this.showNotification('Account created successfully!', 'success');
      } else {
        const error = await response.json();
        this.showNotification(error.error || 'Registration failed', 'error');
      }
    } catch (error) {
      console.error('Registration error:', error);
      this.showNotification('Registration failed. Please try again.', 'error');
    }
  }

  handleLogout() {
    localStorage.removeItem('authToken');
    this.currentUser = null;
    this.messages = [];
    this.closeSocket();
    this.showAuthModal();
    this.showNotification('Logged out successfully', 'info');
  }

  toggleAuthForms(e) {
    e.preventDefault();
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (loginForm.classList.contains('hidden')) {
      loginForm.classList.remove('hidden');
      registerForm.classList.add('hidden');
    } else {
      loginForm.classList.add('hidden');
      registerForm.classList.remove('hidden');
    }
  }

  showDashboard() {
    document.getElementById('authModal').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
    document.getElementById('userName').textContent = this.currentUser.name;
    this.updateStats();
  }

  showAuthModal() {
    document.getElementById('authModal').classList.remove('hidden');
    document.getElementById('dashboard').classList.add('hidden');
  }

  closeModals() {
    document.getElementById('authModal').classList.add('hidden');
    document.getElementById('platformModal').classList.add('hidden');
  }

  initializeSocket() {
    if (this.currentUser) {
      this.socket = io();
      
      this.socket.on('connect', () => {
        console.log('Connected to server');
        this.socket.emit('join', this.currentUser.id);
      });

      this.socket.on('message_received', (message) => {
        this.addMessageToUI(message);
        this.updateStats();
        this.showNotification(`New message from ${message.senderName}`, 'info');
      });

      this.socket.on('user_typing', (data) => {
        this.showTypingIndicator(data);
      });

      this.socket.on('disconnect', () => {
        console.log('Disconnected from server');
      });
    }
  }

  closeSocket() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  async loadMessages() {
    try {
      const response = await fetch('/api/messages', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
      });

      if (response.ok) {
        const data = await response.json();
        this.messages = data.messages || [];
        this.renderMessages();
        this.updateStats();
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
      this.showNotification('Failed to load messages', 'error');
    }
  }

  async loadPlatforms() {
    try {
      const response = await fetch('/api/platforms', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
      });

      if (response.ok) {
        const data = await response.json();
        this.platforms = data.platforms || [];
        this.renderPlatforms();
      }
    } catch (error) {
      console.error('Failed to load platforms:', error);
    }
  }

  renderMessages() {
    const container = document.getElementById('messagesContainer');
    container.innerHTML = '';

    if (this.messages.length === 0) {
      container.innerHTML = '<div class="no-messages"><p>No messages found</p></div>';
      return;
    }

    this.messages.forEach(message => {
      const messageElement = this.createMessageElement(message);
      container.appendChild(messageElement);
    });

    document.getElementById('messageCount').textContent = `${this.messages.length} messages`;
  }

  createMessageElement(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message-item ${message.status} ${message.platform}`;
    messageDiv.dataset.messageId = message.id;

    const platformIcon = this.getPlatformIcon(message.platform);
    const timestamp = new Date(message.timestamp).toLocaleString();

    messageDiv.innerHTML = `
      <div class="message-header">
        <div class="message-sender">
          <span class="platform-icon">${platformIcon}</span>
          <span class="sender-name">${message.senderName || message.sender}</span>
          <span class="sender-id">${message.sender}</span>
        </div>
        <div class="message-meta">
          <span class="timestamp">${timestamp}</span>
          <div class="message-actions">
            <button class="btn-action" data-action="reply" title="Reply">
              <i class="fas fa-reply"></i>
            </button>
            <button class="btn-action" data-action="star" title="Star">
              <i class="fas fa-star ${message.important ? 'starred' : ''}"></i>
            </button>
            <button class="btn-action" data-action="archive" title="Archive">
              <i class="fas fa-archive"></i>
            </button>
          </div>
        </div>
      </div>
      <div class="message-content">
        ${message.subject ? `<div class="message-subject">${message.subject}</div>` : ''}
        <div class="message-text">${message.text}</div>
        ${message.attachments && message.attachments.length > 0 ? 
          `<div class="message-attachments">${this.renderAttachments(message.attachments)}</div>` : ''}
      </div>
    `;

    return messageDiv;
  }

  getPlatformIcon(platform) {
    const icons = {
      gmail: '<i class="fas fa-envelope" style="color: #EA4335;"></i>',
      telegram: '<i class="fab fa-telegram" style="color: #0088CC;"></i>',
      whatsapp: '<i class="fab fa-whatsapp" style="color: #25D366;"></i>',
      instagram: '<i class="fab fa-instagram" style="color: #E4405F;"></i>',
      twitter: '<i class="fab fa-twitter" style="color: #1DA1F2;"></i>'
    };
    return icons[platform] || '<i class="fas fa-comment"></i>';
  }

  renderAttachments(attachments) {
    return attachments.map(attachment => {
      if (attachment.type.startsWith('image/')) {
        return `<img src="${attachment.url}" alt="Attachment" class="attachment-image" />`;
      } else {
        return `<a href="${attachment.url}" class="attachment-file" target="_blank">
          <i class="fas fa-paperclip"></i> ${attachment.name}
        </a>`;
      }
    }).join('');
  }

  renderPlatforms() {
    const container = document.getElementById('platformsList');
    container.innerHTML = '';

    this.platforms.forEach(platform => {
      const platformElement = document.createElement('div');
      platformElement.className = `platform-item ${platform.connected ? 'connected' : 'disconnected'}`;
      
      platformElement.innerHTML = `
        <div class="platform-info">
          <span class="platform-icon">${this.getPlatformIcon(platform.name)}</span>
          <span class="platform-name">${platform.displayName}</span>
        </div>
        <div class="platform-status">
          <span class="status-indicator ${platform.connected ? 'online' : 'offline'}"></span>
          <button class="btn-connect" data-platform="${platform.name}">
            ${platform.connected ? 'Disconnect' : 'Connect'}
          </button>
        </div>
      `;

      container.appendChild(platformElement);
    });

    // Add event listeners for platform connections
    container.querySelectorAll('.btn-connect').forEach(btn => {
      btn.addEventListener('click', (e) => this.handlePlatformConnection(e));
    });
  }

  async handlePlatformConnection(e) {
    const platform = e.target.dataset.platform;
    const platformData = this.platforms.find(p => p.name === platform);

    if (platformData.connected) {
      await this.disconnectPlatform(platform);
    } else {
      await this.connectPlatform(platform);
    }
  }

  async connectPlatform(platform) {
    try {
      const response = await fetch(`/api/platforms/${platform}/connect`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
      });

      if (response.ok) {
        this.showNotification(`${platform} connected successfully!`, 'success');
        await this.loadPlatforms();
      } else {
        const error = await response.json();
        this.showNotification(error.error || `Failed to connect ${platform}`, 'error');
      }
    } catch (error) {
      console.error(`Platform connection error:`, error);
      this.showNotification(`Failed to connect ${platform}`, 'error');
    }
  }

  async disconnectPlatform(platform) {
    try {
      const response = await fetch(`/api/platforms/${platform}/disconnect`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
      });

      if (response.ok) {
        this.showNotification(`${platform} disconnected successfully!`, 'success');
        await this.loadPlatforms();
      } else {
        const error = await response.json();
        this.showNotification(error.error || `Failed to disconnect ${platform}`, 'error');
      }
    } catch (error) {
      console.error(`Platform disconnection error:`, error);
      this.showNotification(`Failed to disconnect ${platform}`, 'error');
    }
  }

  handleFilterChange(e) {
    e.preventDefault();
    const filter = e.currentTarget.dataset.filter;
    
    // Update active filter
    document.querySelectorAll('.filter-list li').forEach(li => li.classList.remove('active'));
    e.currentTarget.classList.add('active');
    
    this.currentFilter = filter;
    document.getElementById('currentFilter').textContent = e.currentTarget.textContent.trim();
    
    this.applyFilters();
  }

  applyFilters() {
    let filteredMessages = [...this.messages];

    switch (this.currentFilter) {
      case 'unread':
        filteredMessages = filteredMessages.filter(msg => msg.status === 'unread');
        break;
      case 'important':
        filteredMessages = filteredMessages.filter(msg => msg.important);
        break;
      case 'archived':
        filteredMessages = filteredMessages.filter(msg => msg.status === 'archived');
        break;
      default:
        // 'all' - no filtering needed
        break;
    }

    this.renderFilteredMessages(filteredMessages);
  }

  renderFilteredMessages(messages) {
    const container = document.getElementById('messagesContainer');
    container.innerHTML = '';

    if (messages.length === 0) {
      container.innerHTML = '<div class="no-messages"><p>No messages found for this filter</p></div>';
      return;
    }

    messages.forEach(message => {
      const messageElement = this.createMessageElement(message);
      container.appendChild(messageElement);
    });

    document.getElementById('messageCount').textContent = `${messages.length} messages`;
  }

  handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    
    if (searchTerm.length === 0) {
      this.applyFilters();
      return;
    }

    const filteredMessages = this.messages.filter(message => 
      message.text?.toLowerCase().includes(searchTerm) ||
      message.subject?.toLowerCase().includes(searchTerm) ||
      message.senderName?.toLowerCase().includes(searchTerm) ||
      message.sender?.toLowerCase().includes(searchTerm)
    );

    this.renderFilteredMessages(filteredMessages);
  }

  handleMessageAction(e) {
    const action = e.target.closest('.btn-action')?.dataset.action;
    const messageId = e.target.closest('.message-item')?.dataset.messageId;
    
    if (!action || !messageId) return;

    switch (action) {
      case 'reply':
        this.showReplyModal(messageId);
        break;
      case 'star':
        this.toggleMessageStar(messageId);
        break;
      case 'archive':
        this.archiveMessage(messageId);
        break;
    }
  }

  showReplyModal(messageId) {
    const message = this.messages.find(m => m.id === messageId);
    if (!message) return;

    document.getElementById('replyTo').textContent = message.senderName || message.sender;
    document.getElementById('replyPlatform').textContent = message.platform;
    document.getElementById('replyModal').classList.remove('hidden');
    document.getElementById('replyText').focus();
  }

  async handleSendMessage(e) {
    e.preventDefault();
    const text = document.getElementById('replyText').value;
    const platform = document.getElementById('replyPlatform').textContent;
    
    if (!text.trim()) return;

    try {
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          platform,
          text,
          recipient: 'recipient_id', // This should come from the reply context
          type: 'message'
        })
      });

      if (response.ok) {
        this.showNotification('Message sent successfully!', 'success');
        document.getElementById('replyModal').classList.add('hidden');
        document.getElementById('replyText').value = '';
      } else {
        const error = await response.json();
        this.showNotification(error.error || 'Failed to send message', 'error');
      }
    } catch (error) {
      console.error('Send message error:', error);
      this.showNotification('Failed to send message', 'error');
    }
  }

  async toggleMessageStar(messageId) {
    try {
      const response = await fetch(`/api/messages/${messageId}/star`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
      });

      if (response.ok) {
        const message = this.messages.find(m => m.id === messageId);
        if (message) {
          message.important = !message.important;
          this.renderMessages();
        }
      }
    } catch (error) {
      console.error('Toggle star error:', error);
    }
  }

  async archiveMessage(messageId) {
    try {
      const response = await fetch(`/api/messages/${messageId}/archive`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
      });

      if (response.ok) {
        const message = this.messages.find(m => m.id === messageId);
        if (message) {
          message.status = 'archived';
          this.renderMessages();
          this.updateStats();
        }
      }
    } catch (error) {
      console.error('Archive message error:', error);
    }
  }

  addMessageToUI(message) {
    this.messages.unshift(message);
    this.renderMessages();
  }

  showTypingIndicator(data) {
    // Implementation for typing indicators
    console.log('User typing:', data);
  }

  updateStats() {
    const stats = {
      total: this.messages.length,
      unread: this.messages.filter(m => m.status === 'unread').length,
      important: this.messages.filter(m => m.important).length,
      archived: this.messages.filter(m => m.status === 'archived').length
    };

    const statsContainer = document.getElementById('statsOverview');
    statsContainer.innerHTML = `
      <div class="stat-item">
        <div class="stat-number">${stats.total}</div>
        <div class="stat-label">Total</div>
      </div>
      <div class="stat-item">
        <div class="stat-number">${stats.unread}</div>
        <div class="stat-label">Unread</div>
      </div>
      <div class="stat-item">
        <div class="stat-number">${stats.important}</div>
        <div class="stat-label">Important</div>
      </div>
      <div class="stat-item">
        <div class="stat-number">${stats.archived}</div>
        <div class="stat-label">Archived</div>
      </div>
    `;
  }

  setupNotifications() {
    // Request notification permission
    if ('Notification' in window) {
      Notification.requestPermission();
    }
  }

  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <span class="notification-message">${message}</span>
        <button class="notification-close">&times;</button>
      </div>
    `;

    // Add to page
    document.body.appendChild(notification);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      notification.remove();
    }, 5000);

    // Close button functionality
    notification.querySelector('.notification-close').addEventListener('click', () => {
      notification.remove();
    });

    // Browser notification if permitted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Unified Inbox', { body: message });
    }
  }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new UnifiedInboxApp();
});

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UnifiedInboxApp;
}
