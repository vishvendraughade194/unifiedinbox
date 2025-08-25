const express = require('express');
const router = express.Router();

// Mock platform configurations (replace with database in production)
const platformConfigs = {
  gmail: {
    name: 'Gmail',
    icon: '📧',
    color: '#EA4335',
    status: 'disconnected',
    features: ['send', 'receive', 'attachments', 'threading'],
    authUrl: 'https://accounts.google.com/oauth/authorize',
    scopes: ['https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/gmail.send']
  },
  telegram: {
    name: 'Telegram',
    icon: '📨',
    color: '#0088CC',
    status: 'disconnected',
    features: ['send', 'receive', 'attachments', 'groups'],
    authUrl: 'https://oauth.telegram.org/auth',
    scopes: ['messages', 'groups']
  },
  whatsapp: {
    name: 'WhatsApp',
    icon: '💬',
    color: '#25D366',
    status: 'disconnected',
    features: ['send', 'receive', 'attachments', 'business'],
    authUrl: 'https://business.facebook.com/oauth/authorize',
    scopes: ['messages', 'business_management']
  },
  instagram: {
    name: 'Instagram',
    icon: '📷',
    color: '#E4405F',
    status: 'disconnected',
    features: ['send', 'receive', 'media', 'stories'],
    authUrl: 'https://www.facebook.com/dialog/oauth',
    scopes: ['instagram_basic', 'instagram_content_publish']
  },
  twitter: {
    name: 'X (Twitter)',
    icon: '🐦',
    color: '#1DA1F2',
    status: 'disconnected',
    features: ['send', 'receive', 'media', 'threads'],
    authUrl: 'https://twitter.com/i/oauth2/authorize',
    scopes: ['tweet.read', 'tweet.write', 'dm.read', 'dm.write']
  }
};

// Get all platform configurations
router.get('/', (req, res) => {
  try {
    res.json({
      platforms: Object.keys(platformConfigs).map(key => ({
        id: key,
        ...platformConfigs[key]
      }))
    });
  } catch (error) {
    console.error('Error fetching platforms:', error);
    res.status(500).json({ error: 'Failed to fetch platforms' });
  }
});

// Get platform configuration by ID
router.get('/:id', (req, res) => {
  try {
    const platform = platformConfigs[req.params.id];
    
    if (!platform) {
      return res.status(404).json({ error: 'Platform not found' });
    }

    res.json({
      platform: {
        id: req.params.id,
        ...platform
      }
    });
  } catch (error) {
    console.error('Error fetching platform:', error);
    res.status(500).json({ error: 'Failed to fetch platform' });
  }
});

// Connect platform (initiate OAuth)
router.post('/:id/connect', (req, res) => {
  try {
    const platformId = req.params.id;
    const platform = platformConfigs[platformId];
    
    if (!platform) {
      return res.status(404).json({ error: 'Platform not found' });
    }

    if (platform.status === 'connected') {
      return res.status(400).json({ error: 'Platform already connected' });
    }

    // In production, you'd generate a proper OAuth URL with state and redirect_uri
    const authUrl = `${platform.authUrl}?client_id=${process.env[`${platformId.toUpperCase()}_CLIENT_ID`] || 'demo'}&redirect_uri=${process.env.FRONTEND_URL || 'http://localhost:3000'}/oauth/callback&scope=${platform.scopes.join(' ')}&response_type=code`;

    res.json({
      message: `Initiating ${platform.name} connection`,
      authUrl,
      platformId,
      scopes: platform.scopes
    });
  } catch (error) {
    console.error('Error connecting platform:', error);
    res.status(500).json({ error: 'Failed to connect platform' });
  }
});

// Disconnect platform
router.post('/:id/disconnect', (req, res) => {
  try {
    const platformId = req.params.id;
    const platform = platformConfigs[platformId];
    
    if (!platform) {
      return res.status(404).json({ error: 'Platform not found' });
    }

    if (platform.status === 'disconnected') {
      return res.status(400).json({ error: 'Platform already disconnected' });
    }

    // In production, you'd revoke OAuth tokens here
    platform.status = 'disconnected';

    res.json({
      message: `${platform.name} disconnected successfully`,
      platformId,
      status: 'disconnected'
    });
  } catch (error) {
    console.error('Error disconnecting platform:', error);
    res.status(500).json({ error: 'Failed to disconnect platform' });
  }
});

// Get platform connection status
router.get('/:id/status', (req, res) => {
  try {
    const platformId = req.params.id;
    const platform = platformConfigs[platformId];
    
    if (!platform) {
      return res.status(404).json({ error: 'Platform not found' });
    }

    res.json({
      platformId,
      status: platform.status,
      lastSync: platform.lastSync || null,
      messageCount: platform.messageCount || 0
    });
  } catch (error) {
    console.error('Error fetching platform status:', error);
    res.status(500).json({ error: 'Failed to fetch platform status' });
  }
});

// Sync platform messages
router.post('/:id/sync', (req, res) => {
  try {
    const platformId = req.params.id;
    const platform = platformConfigs[platformId];
    
    if (!platform) {
      return res.status(404).json({ error: 'Platform not found' });
    }

    if (platform.status === 'disconnected') {
      return res.status(400).json({ error: 'Platform not connected' });
    }

    // In production, you'd actually sync messages from the platform API
    // For now, we'll simulate a sync
    platform.lastSync = new Date();
    platform.messageCount = Math.floor(Math.random() * 100) + 10;

    res.json({
      message: `${platform.name} sync completed`,
      platformId,
      lastSync: platform.lastSync,
      messageCount: platform.messageCount,
      syncDuration: Math.floor(Math.random() * 5000) + 1000 // ms
    });
  } catch (error) {
    console.error('Error syncing platform:', error);
    res.status(500).json({ error: 'Failed to sync platform' });
  }
});

// Get platform features
router.get('/:id/features', (req, res) => {
  try {
    const platformId = req.params.id;
    const platform = platformConfigs[platformId];
    
    if (!platform) {
      return res.status(404).json({ error: 'Platform not found' });
    }

    res.json({
      platformId,
      features: platform.features,
      capabilities: {
        canSend: platform.features.includes('send'),
        canReceive: platform.features.includes('receive'),
        canAttach: platform.features.includes('attachments'),
        canGroup: platform.features.includes('groups'),
        canBusiness: platform.features.includes('business')
      }
    });
  } catch (error) {
    console.error('Error fetching platform features:', error);
    res.status(500).json({ error: 'Failed to fetch platform features' });
  }
});

module.exports = router;
