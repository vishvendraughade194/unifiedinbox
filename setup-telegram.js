#!/usr/bin/env node

/**
 * Telegram Setup Script for Unified Messaging Dashboard
 * This script helps you configure your Telegram bot and set up webhooks
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🤖 Telegram Bot Setup for Unified Messaging Dashboard');
console.log('==================================================\n');

async function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function setupTelegram() {
  try {
    console.log('📋 Step 1: Create a Telegram Bot');
    console.log('1. Open Telegram and search for @BotFather');
    console.log('2. Send /newbot command');
    console.log('3. Choose a name for your bot');
    console.log('4. Choose a username (must end with "bot")');
    console.log('5. Copy the token BotFather gives you\n');
    
    const botToken = await askQuestion('Enter your Telegram Bot Token: ');
    
    if (!botToken || botToken.length < 20) {
      console.log('❌ Invalid bot token. Please check and try again.');
      return;
    }
    
    console.log('\n📋 Step 2: Configure Webhook');
    console.log('Your bot needs to receive messages via webhook.\n');
    
    const domain = await askQuestion('Enter your domain (e.g., yourdomain.com): ');
    const useHttps = await askQuestion('Use HTTPS? (y/n): ');
    
    const protocol = useHttps.toLowerCase() === 'y' ? 'https' : 'http';
    const webhookUrl = `${protocol}://${domain}/api/telegram/webhook`;
    
    // Generate a random secret for webhook verification
    const webhookSecret = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    console.log('\n📋 Step 3: Update Environment Variables');
    console.log('The following will be added to your .env file:\n');
    
    const envUpdates = {
      TELEGRAM_BOT_TOKEN: botToken,
      TELEGRAM_WEBHOOK_URL: webhookUrl,
      TELEGRAM_WEBHOOK_SECRET: webhookSecret
    };
    
    Object.entries(envUpdates).forEach(([key, value]) => {
      console.log(`${key}=${value}`);
    });
    
    const proceed = await askQuestion('\nProceed with updating .env file? (y/n): ');
    
    if (proceed.toLowerCase() === 'y') {
      await updateEnvFile(envUpdates);
      console.log('\n✅ Environment variables updated successfully!');
      
      console.log('\n📋 Step 4: Set Webhook');
      console.log('Now you need to set the webhook for your bot.\n');
      
      const setWebhook = await askQuestion('Set webhook now? (y/n): ');
      
      if (setWebhook.toLowerCase() === 'y') {
        await setTelegramWebhook(webhookUrl, webhookSecret);
      }
      
      console.log('\n🎉 Telegram setup completed!');
      console.log('\nNext steps:');
      console.log('1. Start your server: npm start');
      console.log('2. Send a message to your bot on Telegram');
      console.log('3. Check your dashboard for incoming messages');
      console.log('4. Use the reply function to respond to messages');
      
    } else {
      console.log('\n❌ Setup cancelled. You can manually add the environment variables.');
    }
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  } finally {
    rl.close();
  }
}

async function updateEnvFile(updates) {
  const envPath = path.join(process.cwd(), '.env');
  let envContent = '';
  
  // Read existing .env file if it exists
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }
  
  // Update or add new variables
  Object.entries(updates).forEach(([key, value]) => {
    const regex = new RegExp(`^${key}=.*`, 'm');
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, `${key}=${value}`);
    } else {
      envContent += `\n${key}=${value}`;
    }
  });
  
  // Write back to .env file
  fs.writeFileSync(envPath, envContent.trim() + '\n');
}

async function setTelegramWebhook(webhookUrl, secret) {
  try {
    console.log('🔗 Setting webhook...');
    
    // Check if server is running
    const response = await fetch(`${webhookUrl.replace('/webhook', '/set-webhook')}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      console.log('✅ Webhook set successfully!');
    } else {
      console.log('⚠️  Webhook setting failed. You may need to start your server first.');
      console.log('   Run: npm start');
      console.log('   Then manually set webhook at: /api/telegram/set-webhook');
    }
    
  } catch (error) {
    console.log('⚠️  Could not set webhook automatically. You may need to:');
    console.log('   1. Start your server: npm start');
    console.log('   2. Visit: /api/telegram/set-webhook');
  }
}

// Start setup
setupTelegram();
