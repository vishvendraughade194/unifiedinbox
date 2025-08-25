// Simple Unified Messaging Dashboard Frontend
console.log('🚀 Initializing Unified Messaging Dashboard...');

// State
let allMessages = [];
let currentPlatform = 'all';
let currentSearch = '';
let telegramConnected = false;
let currentConversation = null;
let conversations = [];

// Initialize DOM elements safely
function getElement(id) {
  const element = document.getElementById(id);
  if (!element) {
    console.warn(`Element with id '${id}' not found`);
  }
  return element;
}

// Get all required elements
const elements = {
  messages: getElement('messages'),
  search: getElement('search'),
  btnCompose: getElement('btnCompose'),
  composeModal: getElement('composeModal'),
  composeClose: getElement('composeClose'),
  composeCancel: getElement('composeCancel'),
  composeSend: getElement('composeSend'),
  composePlatform: getElement('composePlatform'),
  composeTo: getElement('composeTo'),
  composeText: getElement('composeText'),
  btnRefresh: getElement('btnRefresh'),
  btnSettings: getElement('btnSettings'),
  settingsModal: getElement('settingsModal'),
  settingsClose: getElement('settingsClose'),
  loadingOverlay: getElement('loadingOverlay'),
  toastContainer: getElement('toastContainer'),
  // New elements for messaging
  conversationsList: getElement('conversationsList'),
  messagesContainer: getElement('messagesContainer'),
  messageCompose: getElement('messageCompose'),
  composeText: getElement('composeText'),
  btnSend: getElement('btnSend'),
  conversationInfo: getElement('conversationInfo'),
  conversationActions: getElement('conversationActions'),
  emptyState: getElement('emptyState'),
  btnNewConversation: getElement('btnNewConversation'),
  btnMarkRead: getElement('btnMarkRead'),
  btnArchive: getElement('btnArchive'),
  btnSchedule: getElement('btnSchedule'),
  btnDelete: getElement('btnDelete')
};

// Utility functions
function getPlatformEmoji(platform) {
  const emojis = {
    gmail: '📧',
    telegram: '📨',
    whatsapp: '💬',
    instagram: '📷',
    twitter: '🐦'
  };
  return emojis[platform] || '💬';
}

function getPlatformColor(platform) {
  const colors = {
    gmail: '#EA4335',
    telegram: '#0088CC',
    whatsapp: '#25D366',
    instagram: '#E4405F',
    twitter: '#1DA1F2'
  };
  return colors[platform] || '#666';
}

function showToast(message, type = 'info', duration = 3000) {
  if (!elements.toastContainer) return;
  
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
    <span>${message}</span>
  `;
  
  elements.toastContainer.appendChild(toast);
  
  // Simple animation
  toast.style.opacity = '0';
  toast.style.transform = 'translateX(300px)';
  
  setTimeout(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(0)';
    toast.style.transition = 'all 0.3s ease';
  }, 100);
  
  // Auto remove
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(300px)';
    setTimeout(() => {
      if (toast.parentNode) toast.remove();
    }, 300);
  }, duration);
}

function showLoading(show = true) {
  if (elements.loadingOverlay) {
    if (show) {
      elements.loadingOverlay.classList.add('show');
    } else {
      elements.loadingOverlay.classList.remove('show');
    }
  }
}

function formatTimestamp(timestamp) {
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  } catch (error) {
    return 'Unknown time';
  }
}

function messageMatchesFilters(msg) {
  const platformOk = currentPlatform === 'all' || msg.platform === currentPlatform;
  const term = currentSearch.trim().toLowerCase();
  if (!term) return platformOk;
  
  const sender = (msg.senderName || '').toLowerCase();
  const text = (msg.text || '').toLowerCase();
  const subject = (msg.subject || '').toLowerCase();
  
  return platformOk && (
    sender.includes(term) || 
    text.includes(term) || 
    subject.includes(term)
  );
}

// Telegram-specific functions
async function checkTelegramConnection() {
  try {
    const response = await fetch('/api/telegram/info');
    const data = await response.json();
    
    if (data.success) {
      telegramConnected = true;
      showToast('✅ Telegram bot connected successfully!', 'success');
      updateTelegramStatus();
    } else {
      telegramConnected = false;
      showToast('❌ Telegram bot connection failed', 'error');
    }
  } catch (error) {
    console.log('Telegram bot not available, using mock data');
    telegramConnected = false;
  }
}

function updateTelegramStatus() {
  const telegramItem = document.querySelector('#connection-telegram');
  if (telegramItem) {
    const statusDot = telegramItem.querySelector('.status-dot');
    if (statusDot) {
      statusDot.className = `status-dot ${telegramConnected ? 'connected' : 'disconnected'}`;
    }
  }
}

async function sendTelegramMessage(chatId, text, replyToMessageId = null) {
  try {
    const response = await fetch('/api/telegram/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chatId,
        text,
        replyToMessageId
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      showToast('✅ Telegram message sent successfully!', 'success');
      return data;
    } else {
      throw new Error(data.error || 'Failed to send message');
    }
  } catch (error) {
    console.error('Failed to send Telegram message:', error);
    showToast('❌ Failed to send Telegram message', 'error');
    throw error;
  }
}

async function replyToTelegramMessage(messageId, replyText) {
  try {
    const message = allMessages.find(m => m.id === messageId);
    if (!message || message.platform !== 'telegram') {
      showToast('❌ Can only reply to Telegram messages', 'error');
      return;
    }
    
    const chatId = message.metadata?.telegram?.chat?.id || message.senderId;
    const platformMessageId = message.platformMessageId || messageId;
    
    await sendTelegramMessage(chatId, replyText, platformMessageId);
    
    // Add reply to local messages
    const replyMessage = {
      id: `reply_${Date.now()}`,
      platform: 'telegram',
      senderName: 'You',
      senderId: 'you',
      text: replyText,
      timestamp: new Date().toISOString(),
      status: 'sent',
      isReply: true,
      replyTo: messageId
    };
    
    allMessages.unshift(replyMessage);
    renderMessages();
    
  } catch (error) {
    console.error('Failed to reply to Telegram message:', error);
  }
}

function renderMessages() {
  if (!elements.messages) return;
  
  elements.messages.innerHTML = '';
  const filtered = allMessages.filter(messageMatchesFilters);
  
  if (filtered.length === 0) {
    elements.messages.innerHTML = `
      <div class="no-messages">
        <i class="fas fa-inbox"></i>
        <p>No messages found</p>
        <small>Try changing your filters or search terms</small>
      </div>
    `;
    return;
  }
  
  filtered.forEach((msg, index) => {
    const el = document.createElement('div');
    el.className = `message-item ${msg.platform} ${msg.status || 'unread'}`;
    el.innerHTML = `
      <div class="message-header">
        <div class="message-sender">
          <span class="platform-icon" style="color: ${getPlatformColor(msg.platform)}">
            ${getPlatformEmoji(msg.platform)}
          </span>
          <div>
            <div class="sender-name">${msg.senderName || 'Unknown'}</div>
            <div class="sender-id">${msg.platform.toUpperCase()}</div>
          </div>
        </div>
        <div class="message-meta">
          <span class="timestamp">${formatTimestamp(msg.timestamp)}</span>
          <div class="message-actions">
            <button class="btn-icon" onclick="toggleMessageStatus('${msg.id}')" title="Mark as read/unread">
              <i class="fas fa-${msg.status === 'read' ? 'envelope-open' : 'envelope'}"></i>
            </button>
            <button class="btn-icon" onclick="replyToMessage('${msg.id}')" title="Reply">
              <i class="fas fa-reply"></i>
            </button>
            <button class="btn-icon" onclick="deleteMessage('${msg.id}')" title="Delete">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
      <div class="message-content">
        ${msg.subject ? `<div class="message-subject">${msg.subject}</div>` : ''}
        <div class="message-text">${(msg.text || '').replace(/</g, '&lt;')}</div>
        ${msg.attachments && msg.attachments.length > 0 ? `
          <div class="message-attachments">
            ${msg.attachments.map(att => `
              <div class="attachment-item">
                <i class="fas fa-${att.type.startsWith('image/') ? 'image' : 'file'}"></i>
                <span>${att.name}</span>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;
    
    elements.messages.appendChild(el);
    
    // Simple animation
    el.style.opacity = '0';
    el.style.transform = 'translateY(24px)';
    setTimeout(() => {
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
      el.style.transition = 'all 0.4s ease';
    }, index * 50);
  });
}

// Message actions
async function toggleMessageStatus(messageId) {
  try {
    const message = allMessages.find(m => m.id === messageId);
    if (!message) return;
    
    const newStatus = message.status === 'read' ? 'unread' : 'read';
    message.status = newStatus;
    renderMessages();
    showToast(`Message marked as ${newStatus}`, 'success');
  } catch (error) {
    showToast('Failed to update message status', 'error');
  }
}

async function replyToMessage(messageId) {
  const message = allMessages.find(m => m.id === messageId);
  if (!message) return;
  
  // For Telegram messages, handle reply directly
  if (message.platform === 'telegram' && telegramConnected) {
    const replyText = prompt(`Reply to ${message.senderName}:`, '');
    if (replyText && replyText.trim()) {
      await replyToTelegramMessage(messageId, replyText.trim());
    }
    return;
  }
  
  // For other platforms, pre-fill compose modal
  if (elements.composePlatform) elements.composePlatform.value = message.platform;
  if (elements.composeTo) elements.composeTo.value = message.senderId || message.senderName;
  if (elements.composeText) elements.composeText.value = `Re: ${message.text}`;
  
  openCompose();
}

async function deleteMessage(messageId) {
  if (!confirm('Are you sure you want to delete this message?')) return;
  
  try {
    allMessages = allMessages.filter(m => m.id !== messageId);
    renderMessages();
    showToast('Message deleted successfully', 'success');
  } catch (error) {
    showToast('Failed to delete message', 'error');
  }
}

// Compose modal
function openCompose() {
  if (elements.composeModal) {
    elements.composeModal.classList.add('show');
    
    // Reset form
    if (elements.composeText) elements.composeText.value = '';
    if (elements.composeTo) elements.composeTo.value = '';
    
    // Focus on first input
    setTimeout(() => {
      if (elements.composeTo) elements.composeTo.focus();
    }, 100);
  }
}

function closeCompose() {
  if (elements.composeModal) {
    elements.composeModal.classList.remove('show');
  }
}

// Load mock data for demonstration
function loadMockData() {
  allMessages = [
    {
      id: '1',
      platform: 'gmail',
      senderName: 'John Doe',
      senderId: 'john@example.com',
      text: 'Hello! How are you doing?',
      subject: 'Greetings',
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
      status: 'unread'
    },
    {
      id: '2',
      platform: 'telegram',
      senderName: 'Alice Smith',
      senderId: '@alice_smith',
      text: 'Can you help me with the project?',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
      status: 'read'
    },
    {
      id: '3',
      platform: 'whatsapp',
      senderName: 'Bob Johnson',
      senderId: '+1234567890',
      text: 'Meeting at 3 PM today',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
      status: 'unread'
    },
    {
      id: '4',
      platform: 'instagram',
      senderName: 'Emma Wilson',
      senderId: '@emma_wilson',
      text: 'Check out my new post!',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(), // 8 hours ago
      status: 'read'
    },
    {
      id: '5',
      platform: 'twitter',
      senderName: 'Mike Brown',
      senderId: '@mike_brown',
      text: 'Great article you shared!',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), // 12 hours ago
      status: 'unread'
    }
  ];
  renderMessages();
}

// Fetch messages from API
async function fetchHistory(platform = 'all') {
  try {
    const res = await fetch(`/api/messages?platform=${platform}`);
    const json = await res.json();
    if (json && json.success) {
      allMessages = json.data || [];
      renderMessages();
    } else {
      throw new Error(json.message || 'Failed to fetch messages');
    }
  } catch (error) {
    console.log('Using mock data for demonstration');
    loadMockData();
  }
}

// Message and Conversation Functions
function createMockConversations() {
  conversations = [
    {
      id: '1',
      platform: 'telegram',
      title: 'John Doe',
      preview: 'Hey! How are you doing?',
      timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
      unread: true,
      avatar: 'JD',
      messages: [
        {
          id: '1',
          sender: 'John Doe',
          content: 'Hey! How are you doing?',
          timestamp: new Date(Date.now() - 1000 * 60 * 5),
          platform: 'telegram',
          isIncoming: true
        }
      ]
    },
    {
      id: '2',
      platform: 'gmail',
      title: 'Sarah Wilson',
      preview: 'Meeting tomorrow at 10 AM',
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      unread: false,
      avatar: 'SW',
      messages: [
        {
          id: '2',
          sender: 'Sarah Wilson',
          content: 'Meeting tomorrow at 10 AM',
          timestamp: new Date(Date.now() - 1000 * 60 * 30),
          platform: 'gmail',
          isIncoming: true
        }
      ]
    },
    {
      id: '3',
      platform: 'whatsapp',
      title: 'Mike Johnson',
      preview: 'Can you send me the report?',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      unread: true,
      avatar: 'MJ',
      messages: [
        {
          id: '3',
          sender: 'Mike Johnson',
          content: 'Can you send me the report?',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
          platform: 'whatsapp',
          isIncoming: true
        }
      ]
    }
  ];
}

function renderConversations() {
  if (!elements.conversationsList) return;
  
  elements.conversationsList.innerHTML = '';
  
  conversations.forEach(conversation => {
    const conversationElement = document.createElement('div');
    conversationElement.className = `conversation-item ${conversation.unread ? 'unread' : ''}`;
    conversationElement.dataset.conversationId = conversation.id;
    
    const timeAgo = getTimeAgo(conversation.timestamp);
    
    conversationElement.innerHTML = `
      <div class="conversation-avatar">
        ${conversation.avatar}
      </div>
      <div class="conversation-content">
        <div class="conversation-header">
          <span class="conversation-title">${conversation.title}</span>
          <span class="conversation-time">${timeAgo}</span>
        </div>
        <div class="conversation-preview">${conversation.preview}</div>
        <div class="conversation-meta">
          <span class="platform-badge">${conversation.platform}</span>
          ${conversation.unread ? '<span class="unread-indicator"></span>' : ''}
        </div>
      </div>
    `;
    
    conversationElement.addEventListener('click', () => selectConversation(conversation.id));
    elements.conversationsList.appendChild(conversationElement);
  });
}

function selectConversation(conversationId) {
  currentConversation = conversations.find(c => c.id === conversationId);
  if (!currentConversation) return;
  
  // Update UI
  updateConversationInfo();
  renderMessages();
  showMessageCompose();
  
  // Mark as read
  currentConversation.unread = false;
  renderConversations();
}

function updateConversationInfo() {
  if (!elements.conversationInfo || !currentConversation) return;
  
  elements.conversationInfo.innerHTML = `
    <h3>${currentConversation.title}</h3>
    <p>${currentConversation.platform} • ${getTimeAgo(currentConversation.timestamp)}</p>
  `;
  
  elements.conversationActions.style.display = 'flex';
}

// Enhanced Message Functions
function renderMessages() {
  if (!elements.messagesContainer || !currentConversation) return;
  
  elements.messagesContainer.innerHTML = '';
  
  currentConversation.messages.forEach(message => {
    const messageElement = document.createElement('div');
    messageElement.className = `message ${message.isIncoming ? 'incoming' : 'outgoing'}`;
    
    const time = formatMessageTime(message.timestamp);
    
    messageElement.innerHTML = `
      <div class="message-content">
        <div class="message-header">
          <span class="message-sender">${message.sender}</span>
          <span class="message-time">${time}</span>
        </div>
        <div class="message-text">${message.content}</div>
        <div class="message-platform">${message.platform}</div>
        
        <!-- Hover Actions -->
        <div class="message-actions">
          <button class="btn-icon btn-copy" title="Copy message" onclick="copyMessage('${message.content}')">
            <i class="fas fa-copy"></i>
          </button>
          ${message.isIncoming ? '' : `
            <button class="btn-icon btn-edit" title="Edit message" onclick="editMessage('${message.id}')">
              <i class="fas fa-edit"></i>
            </button>
          `}
          <button class="btn-icon btn-delete" title="Delete message" onclick="deleteMessage('${message.id}')">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    `;
    
    elements.messagesContainer.appendChild(messageElement);
  });
  
  // Auto-scroll to bottom
  autoScrollToBottom();
}

function autoScrollToBottom() {
  if (elements.messagesContainer) {
    elements.messagesContainer.scrollTop = elements.messagesContainer.scrollHeight;
  }
}

function formatMessageTime(date) {
  const now = new Date();
  const messageDate = new Date(date);
  const diffInHours = Math.floor((now - messageDate) / (1000 * 60 * 60));
  
  if (diffInHours < 24) {
    // Today - show time only
    return messageDate.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  } else if (diffInHours < 48) {
    // Yesterday
    return `Yesterday at ${messageDate.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    })}`;
  } else {
    // Show date and time
    return messageDate.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }
}

// Typing Indicator
let typingTimeout;
function showTypingIndicator() {
  if (!currentConversation) return;
  
  // Clear existing timeout
  if (typingTimeout) {
    clearTimeout(typingTimeout);
  }
  
  // Show typing indicator
  const typingElement = document.createElement('div');
  typingElement.className = 'message incoming typing-indicator-message';
  typingElement.id = 'typing-indicator';
  typingElement.innerHTML = `
    <div class="message-content">
      <div class="typing-indicator">
        <span></span>
        <span></span>
        <span></span>
      </div>
      <div class="message-platform">${currentConversation.platform}</div>
    </div>
  `;
  
  elements.messagesContainer.appendChild(typingElement);
  autoScrollToBottom();
  
  // Hide after 3 seconds
  typingTimeout = setTimeout(() => {
    hideTypingIndicator();
  }, 3000);
}

function hideTypingIndicator() {
  const typingElement = document.getElementById('typing-indicator');
  if (typingElement) {
    typingElement.remove();
  }
}

// Message Actions
function copyMessage(text) {
  navigator.clipboard.writeText(text).then(() => {
    showToast('Message copied to clipboard!', 'success');
  }).catch(() => {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    showToast('Message copied to clipboard!', 'success');
  });
}

function editMessage(messageId) {
  const message = currentConversation.messages.find(m => m.id === messageId);
  if (!message) return;
  
  // Replace message content with editable input
  const messageElement = document.querySelector(`[onclick="editMessage('${messageId}')"]`).closest('.message');
  const messageText = messageElement.querySelector('.message-text');
  
  const input = document.createElement('textarea');
  input.value = message.content;
  input.className = 'message-edit-input';
  input.rows = 1;
  
  const saveButton = document.createElement('button');
  saveButton.className = 'btn btn-sm btn-primary';
  saveButton.innerHTML = '<i class="fas fa-check"></i>';
  saveButton.onclick = () => saveEditedMessage(messageId, input.value);
  
  const cancelButton = document.createElement('button');
  cancelButton.className = 'btn btn-sm btn-secondary';
  cancelButton.innerHTML = '<i class="fas fa-times"></i>';
  cancelButton.onclick = () => renderMessages();
  
  messageText.innerHTML = '';
  messageText.appendChild(input);
  messageText.appendChild(saveButton);
  messageText.appendChild(cancelButton);
  
  input.focus();
  input.select();
}

function saveEditedMessage(messageId, newContent) {
  if (!newContent.trim()) {
    showToast('Message cannot be empty!', 'error');
    return;
  }
  
  const message = currentConversation.messages.find(m => m.id === messageId);
  if (message) {
    message.content = newContent.trim();
    message.edited = true;
    currentConversation.preview = newContent.trim();
    
    renderMessages();
    renderConversations();
    showToast('Message edited successfully!', 'success');
  }
}

function deleteMessage(messageId) {
  if (!confirm('Are you sure you want to delete this message?')) return;
  
  currentConversation.messages = currentConversation.messages.filter(m => m.id !== messageId);
  
  // Update conversation preview
  if (currentConversation.messages.length > 0) {
    const lastMessage = currentConversation.messages[currentConversation.messages.length - 1];
    currentConversation.preview = lastMessage.content;
    currentConversation.timestamp = lastMessage.timestamp;
  }
  
  renderMessages();
  renderConversations();
  showToast('Message deleted successfully!', 'success');
}

// Enhanced Send Message with Validation
function sendMessage() {
  if (!currentConversation || !elements.composeText) return;
  
  const messageText = elements.composeText.value.trim();
  
  // Input validation
  if (!messageText) {
    showToast('Please type a message!', 'error');
    elements.composeText.focus();
    return;
  }
  
  if (messageText.length > 1000) {
    showToast('Message too long! Maximum 1000 characters.', 'error');
    return;
  }
  
  // Create new message
  const newMessage = {
    id: Date.now().toString(),
    sender: 'You',
    content: messageText,
    timestamp: new Date(),
    platform: currentConversation.platform,
    isIncoming: false
  };
  
  // Add to conversation
  currentConversation.messages.push(newMessage);
  currentConversation.preview = messageText;
  currentConversation.timestamp = new Date();
  
  // Update UI
  renderMessages();
  renderConversations();
  
  // Clear input
  elements.composeText.value = '';
  
  // Show success toast
  showToast('Message sent successfully!', 'success');
  
  // Show typing indicator briefly
  setTimeout(() => {
    showTypingIndicator();
  }, 500);
  
  // Simulate reply (for demo purposes)
  setTimeout(() => {
    hideTypingIndicator();
    
    const replyMessage = {
      id: (Date.now() + 1).toString(),
      sender: currentConversation.title,
      content: getMockReply(messageText),
      timestamp: new Date(),
      platform: currentConversation.platform,
      isIncoming: true
    };
    
    currentConversation.messages.push(replyMessage);
    currentConversation.preview = replyMessage.content;
    currentConversation.timestamp = new Date();
    currentConversation.unread = true;
    
    renderMessages();
    renderConversations();
    showToast('New message received!', 'info');
  }, 3000);
}

function getMockReply(message) {
  const replies = [
    'Thanks for your message!',
    'Got it, I\'ll get back to you soon.',
    'That sounds great!',
    'I appreciate you reaching out.',
    'Let me think about that and respond properly.',
    'Thanks for the update!',
    'I\'ll look into this right away.',
    'Perfect timing!'
  ];
  
  return replies[Math.floor(Math.random() * replies.length)];
}

function getTimeAgo(date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
}

function showMessageCompose() {
  if (!elements.messageCompose) return;
  elements.messageCompose.style.display = 'block';
  elements.emptyState.style.display = 'none';
}

function hideMessageCompose() {
  if (!elements.messageCompose) return;
  elements.messageCompose.style.display = 'none';
  elements.emptyState.style.display = 'flex';
}

// Enhanced Event Listeners
function setupEventListeners() {
  // Existing event listeners
  if (elements.btnCompose) {
    elements.btnCompose.addEventListener('click', () => {
      if (elements.composeModal) {
        elements.composeModal.classList.add('show');
      }
    });
  }

  if (elements.btnRefresh) {
    elements.btnRefresh.addEventListener('click', refreshMessages);
  }

  if (elements.btnSettings) {
    elements.btnSettings.addEventListener('click', () => {
      if (elements.settingsModal) {
        elements.settingsModal.classList.add('show');
      }
    });
  }

  // Enhanced messaging event listeners
  if (elements.btnSend) {
    elements.btnSend.addEventListener('click', sendMessage);
  }

  if (elements.composeText) {
    // Enhanced keyboard shortcuts
    elements.composeText.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
      
      // Ctrl/Cmd + Enter to send
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        sendMessage();
      }
      
      // Escape to clear
      if (e.key === 'Escape') {
        e.preventDefault();
        elements.composeText.value = '';
        elements.composeText.blur();
      }
    });
    
    // Typing indicator
    elements.composeText.addEventListener('input', () => {
      if (elements.composeText.value.trim()) {
        showTypingIndicator();
      }
    });
    
    // Focus events
    elements.composeText.addEventListener('focus', () => {
      if (elements.composeText.value.trim()) {
        showTypingIndicator();
      }
    });
    
    elements.composeText.addEventListener('blur', () => {
      // Hide typing indicator after a delay
      setTimeout(() => {
        if (!elements.composeText.matches(':focus')) {
          hideTypingIndicator();
        }
      }, 1000);
    });
  }

  if (elements.btnNewConversation) {
    elements.btnNewConversation.addEventListener('click', () => {
      if (elements.composeModal) {
        elements.composeModal.classList.add('show');
      }
    });
  }

  if (elements.btnMarkRead) {
    elements.btnMarkRead.addEventListener('click', () => {
      if (currentConversation) {
        currentConversation.unread = false;
        renderConversations();
        showToast('Marked as read', 'success');
      }
    });
  }

  if (elements.btnArchive) {
    elements.btnArchive.addEventListener('click', () => {
      if (currentConversation) {
        showToast('Conversation archived', 'success');
      }
    });
  }

  if (elements.btnSchedule) {
    elements.btnSchedule.addEventListener('click', () => {
      showToast('Schedule feature coming soon!', 'info');
    });
  }

  if (elements.btnDelete) {
    elements.btnDelete.addEventListener('click', () => {
      if (currentConversation && confirm('Are you sure you want to delete this conversation?')) {
        conversations = conversations.filter(c => c.id !== currentConversation.id);
        currentConversation = null;
        renderConversations();
        hideMessageCompose();
        showToast('Conversation deleted', 'success');
      }
    });
  }

  // Global keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K to focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      const searchInput = document.getElementById('searchInput');
      if (searchInput) {
        searchInput.focus();
        searchInput.select();
      }
    }
    
    // Ctrl/Cmd + N for new conversation
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
      e.preventDefault();
      if (elements.composeModal) {
        elements.composeModal.classList.add('show');
      }
    }
    
    // Ctrl/Cmd + R to refresh
    if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
      e.preventDefault();
      if (elements.btnRefresh) {
        elements.btnRefresh.click();
      }
    }
  });

  // Close modals when clicking outside
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
      e.target.classList.remove('show');
    }
  });

  // Close modals with close buttons
  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.modal').classList.remove('show');
    });
  });
  
  // Sidebar filtering
  const sidebarItems = document.querySelectorAll('.sidebar ul li');
  sidebarItems.forEach(item => {
    item.addEventListener('click', () => {
      document.querySelector('.sidebar ul li.active')?.classList.remove('active');
      item.classList.add('active');
      currentPlatform = item.getAttribute('data-platform');
      fetchHistory(currentPlatform);
    });
  });
}

// Main initialization
function init() {
  console.log('🚀 Initializing Unified Messaging Dashboard...');
  
  // Initialize mock data
  createMockConversations();
  
  // Setup event listeners
  setupEventListeners();
  
  // Render initial state
  renderConversations();
  
  // Show empty state initially
  if (elements.emptyState) {
    elements.emptyState.style.display = 'flex';
  }
  
  // Initialize platform filters
  setupPlatformFilters();
  
  // Initialize search
  setupSearch();
  
  // Initialize theme
  setupTheme();
  
  console.log('✅ Dashboard initialized successfully!');
}

// Initialize the application
async function initialize() {
  try {
    console.log('🔧 Setting up event listeners...');
    setupEventListeners();
    
    console.log('📱 Loading initial data...');
    showLoading(true);
    
    // Check Telegram connection
    console.log('🔌 Checking Telegram connection...');
    await checkTelegramConnection();
    
    try {
      await fetchHistory('all');
    } catch (error) {
      console.log('Using mock data for demonstration');
      loadMockData();
    } finally {
      showLoading(false);
    }
    
    console.log('✅ Unified Messaging Dashboard initialized successfully');
    showToast('Dashboard loaded successfully!', 'success');
    
  } catch (error) {
    console.error('❌ Failed to initialize dashboard:', error);
    showToast('Failed to initialize dashboard', 'error');
  }
}

// Start the application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

// Missing Functions
function refreshMessages() {
  showLoading(true);
  setTimeout(() => {
    renderConversations();
    if (currentConversation) {
      renderMessages();
    }
    showLoading(false);
    showToast('Messages refreshed successfully', 'success');
  }, 500);
}

function fetchHistory(platform = 'all') {
  // This function is called by sidebar filtering
  currentPlatform = platform;
  showToast(`Filtered to ${platform === 'all' ? 'all platforms' : platform}`, 'info');
}

