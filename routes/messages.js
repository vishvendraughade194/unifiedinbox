const express = require('express');
const router = express.Router();

// Mock messages database (replace with MongoDB in production)
let messages = [
  {
    id: '1',
    platform: 'gmail',
    sender: 'alice@gmail.com',
    senderName: 'Alice Johnson',
    recipient: 'user@example.com',
    subject: 'Your order has been shipped!',
    text: 'Hi! Your order #12345 has been shipped and will arrive in 2-3 business days.',
    timestamp: new Date('2024-01-15T10:30:00Z'),
    status: 'read',
    type: 'email',
    attachments: [],
    threadId: 'thread_1'
  },
  {
    id: '2',
    platform: 'telegram',
    sender: '@devgroup',
    senderName: 'Dev Group',
    recipient: '@user',
    text: 'Check out the new API docs! They\'re much better now.',
    timestamp: new Date('2024-01-15T11:15:00Z'),
    status: 'unread',
    type: 'message',
    attachments: [],
    chatId: 'chat_123'
  },
  {
    id: '3',
    platform: 'whatsapp',
    sender: '+1234567890',
    senderName: 'Mom',
    recipient: '+0987654321',
    text: 'Dinner at 8? Don\'t forget to bring the wine! 🍷',
    timestamp: new Date('2024-01-15T12:00:00Z'),
    status: 'unread',
    type: 'message',
    attachments: [],
    conversationId: 'conv_456'
  },
  {
    id: '4',
    platform: 'instagram',
    sender: '@follower123',
    senderName: 'Follower',
    recipient: '@user',
    text: 'Nice post on React! Really helped me understand hooks better.',
    timestamp: new Date('2024-01-15T13:45:00Z'),
    status: 'read',
    type: 'dm',
    attachments: [],
    conversationId: 'ig_conv_789'
  }
];

// Get all messages with filtering and pagination
router.get('/', (req, res) => {
  try {
    const { 
      platform, 
      status, 
      search, 
      page = 1, 
      limit = 20,
      sortBy = 'timestamp',
      sortOrder = 'desc'
    } = req.query;

    let filteredMessages = [...messages];

    // Filter by platform
    if (platform && platform !== 'all') {
      filteredMessages = filteredMessages.filter(msg => msg.platform === platform);
    }

    // Filter by status
    if (status) {
      filteredMessages = filteredMessages.filter(msg => msg.status === status);
    }

    // Search functionality
    if (search) {
      const searchTerm = search.toLowerCase();
      filteredMessages = filteredMessages.filter(msg => 
        msg.text?.toLowerCase().includes(searchTerm) ||
        msg.subject?.toLowerCase().includes(searchTerm) ||
        msg.senderName?.toLowerCase().includes(searchTerm) ||
        msg.sender?.toLowerCase().includes(searchTerm)
      );
    }

    // Sorting
    filteredMessages.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];
      
      if (sortBy === 'timestamp') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedMessages = filteredMessages.slice(startIndex, endIndex);

    res.json({
      messages: paginatedMessages,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(filteredMessages.length / limit),
        totalMessages: filteredMessages.length,
        hasNext: endIndex < filteredMessages.length,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Get message by ID
router.get('/:id', (req, res) => {
  try {
    const message = messages.find(msg => msg.id === req.params.id);
    
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    res.json({ message });
  } catch (error) {
    console.error('Error fetching message:', error);
    res.status(500).json({ error: 'Failed to fetch message' });
  }
});

// Send new message
router.post('/', (req, res) => {
  try {
    const { platform, recipient, text, subject, type, attachments } = req.body;

    if (!platform || !recipient || !text) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const newMessage = {
      id: Date.now().toString(),
      platform,
      sender: 'user@example.com', // Current user
      senderName: 'You',
      recipient,
      subject,
      text,
      timestamp: new Date(),
      status: 'sent',
      type: type || 'message',
      attachments: attachments || [],
      threadId: `thread_${Date.now()}`,
      chatId: `chat_${Date.now()}`,
      conversationId: `conv_${Date.now()}`
    };

    messages.unshift(newMessage);

    // In production, you'd send this via the actual platform API
    // and handle the response accordingly

    res.status(201).json({
      message: 'Message sent successfully',
      messageId: newMessage.id
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Update message status (mark as read/unread)
router.patch('/:id/status', (req, res) => {
  try {
    const { status } = req.body;
    const messageIndex = messages.findIndex(msg => msg.id === req.params.id);

    if (messageIndex === -1) {
      return res.status(404).json({ error: 'Message not found' });
    }

    messages[messageIndex].status = status;

    res.json({
      message: 'Message status updated successfully',
      messageId: req.params.id,
      status
    });
  } catch (error) {
    console.error('Error updating message status:', error);
    res.status(500).json({ error: 'Failed to update message status' });
  }
});

// Delete message
router.delete('/:id', (req, res) => {
  try {
    const messageIndex = messages.findIndex(msg => msg.id === req.params.id);

    if (messageIndex === -1) {
      return res.status(404).json({ error: 'Message not found' });
    }

    messages.splice(messageIndex, 1);

    res.json({
      message: 'Message deleted successfully',
      messageId: req.params.id
    });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

// Get message statistics
router.get('/stats/overview', (req, res) => {
  try {
    const stats = {
      total: messages.length,
      unread: messages.filter(msg => msg.status === 'unread').length,
      byPlatform: {
        gmail: messages.filter(msg => msg.platform === 'gmail').length,
        telegram: messages.filter(msg => msg.platform === 'telegram').length,
        whatsapp: messages.filter(msg => msg.platform === 'whatsapp').length,
        instagram: messages.filter(msg => msg.platform === 'instagram').length
      },
      byType: {
        email: messages.filter(msg => msg.type === 'email').length,
        message: messages.filter(msg => msg.type === 'message').length,
        dm: messages.filter(msg => msg.type === 'dm').length
      }
    };

    res.json({ stats });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

module.exports = router;
