// MongoDB initialization script for Unified Messaging Dashboard
db = db.getSiblingDB('unified-inbox');

// Create collections with validation
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['email', 'username'],
      properties: {
        email: { bsonType: 'string', pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$' },
        username: { bsonType: 'string', minLength: 3, maxLength: 30 },
        platforms: { bsonType: 'array' }
      }
    }
  }
});

db.createCollection('messages', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['platform', 'senderId', 'text', 'timestamp'],
      properties: {
        platform: { enum: ['gmail', 'telegram', 'whatsapp', 'instagram', 'twitter'] },
        status: { enum: ['unread', 'read', 'archived', 'deleted'] }
      }
    }
  }
});

// Create indexes for better performance
db.users.createIndex({ 'email': 1 }, { unique: true });
db.users.createIndex({ 'username': 1 }, { unique: true });
db.messages.createIndex({ 'platform': 1, 'timestamp': -1 });
db.messages.createIndex({ 'senderId': 1 });
db.messages.createIndex({ 'conversationId': 1 });
db.messages.createIndex({ 'status': 1 });

print('✅ Database initialized successfully');
