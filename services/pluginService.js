const winston = require('winston');
const cron = require('node-cron');
const axios = require('axios');
const crypto = require('crypto');

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'plugin-service' },
  transports: [
    new winston.transports.File({ filename: 'logs/plugin-service.log' }),
    new winston.transports.Console()
  ]
});

class PluginService {
  constructor() {
    this.plugins = new Map();
    this.activeWorkflows = new Map();
    this.scheduledTasks = new Map();
    this.webhookEndpoints = new Map();
    this.pluginRegistry = new Map();
    
    this.initializeBuiltinPlugins();
  }

  // Initialize built-in plugins
  initializeBuiltinPlugins() {
    // Auto-reply plugin
    this.registerPlugin('auto-reply', {
      name: 'Auto Reply',
      description: 'Automatically respond to messages based on triggers',
      version: '1.0.0',
      author: 'Unified Inbox',
      triggers: ['message_received', 'keyword_detected', 'time_based'],
      actions: ['send_message', 'forward_message', 'create_ticket'],
      configSchema: {
        triggers: {
          type: 'object',
          properties: {
            keywords: { type: 'array', items: { type: 'string' } },
            platforms: { type: 'array', items: { type: 'string' } },
            timeWindow: { type: 'object' },
            conditions: { type: 'object' }
          }
        },
        actions: {
          type: 'object',
          properties: {
            responseTemplate: { type: 'string' },
            forwardTo: { type: 'string' },
            createTicket: { type: 'boolean' }
          }
        }
      }
    });

    // Webhook plugin
    this.registerPlugin('webhook', {
      name: 'Webhook Integration',
      description: 'Trigger webhooks based on message events',
      version: '1.0.0',
      author: 'Unified Inbox',
      triggers: ['message_received', 'conversation_started', 'urgent_message'],
      actions: ['http_request', 'slack_notification', 'email_alert'],
      configSchema: {
        webhookUrl: { type: 'string', format: 'uri' },
        events: { type: 'array', items: { type: 'string' } },
        headers: { type: 'object' },
        payload: { type: 'object' }
      }
    });

    // Cross-platform forwarding plugin
    this.registerPlugin('cross-platform-forward', {
      name: 'Cross Platform Forward',
      description: 'Forward messages between different platforms',
      version: '1.0.0',
      author: 'Unified Inbox',
      triggers: ['message_received'],
      actions: ['forward_message', 'transform_message'],
      configSchema: {
        sourcePlatform: { type: 'string' },
        targetPlatform: { type: 'string' },
        conditions: { type: 'object' },
        transformation: { type: 'object' }
      }
    });

    // Off-hours plugin
    this.registerPlugin('off-hours', {
      name: 'Off Hours Handler',
      description: 'Handle messages during off-hours automatically',
      version: '1.0.0',
      author: 'Unified Inbox',
      triggers: ['time_based', 'message_received'],
      actions: ['send_auto_reply', 'escalate_urgent', 'schedule_followup'],
      configSchema: {
        businessHours: { type: 'object' },
        timezone: { type: 'string' },
        autoReply: { type: 'string' },
        escalationRules: { type: 'object' }
      }
    });

    // Sentiment analysis plugin
    this.registerPlugin('sentiment-monitor', {
      name: 'Sentiment Monitor',
      description: 'Monitor and respond to sentiment changes',
      version: '1.0.0',
      author: 'Unified Inbox',
      triggers: ['sentiment_detected', 'sentiment_change'],
      actions: ['send_alert', 'escalate_negative', 'celebrate_positive'],
      configSchema: {
        thresholds: { type: 'object' },
        alertChannels: { type: 'array' },
        escalationRules: { type: 'object' }
      }
    });
  }

  // Register a new plugin
  registerPlugin(pluginId, pluginInfo) {
    try {
      this.pluginRegistry.set(pluginId, {
        ...pluginInfo,
        id: pluginId,
        enabled: false,
        createdAt: new Date(),
        lastUpdated: new Date()
      });
      
      logger.info(`Plugin registered: ${pluginId}`);
      return true;
    } catch (error) {
      logger.error(`Error registering plugin ${pluginId}:`, error);
      return false;
    }
  }

  // Create a workflow using plugins
  async createWorkflow(workflowConfig) {
    try {
      const workflowId = `workflow_${crypto.randomBytes(8).toString('hex')}`;
      
      const workflow = {
        id: workflowId,
        name: workflowConfig.name,
        description: workflowConfig.description,
        enabled: workflowConfig.enabled || false,
        pluginId: workflowConfig.pluginId,
        config: workflowConfig.config,
        triggers: workflowConfig.triggers || [],
        actions: workflowConfig.actions || [],
        createdAt: new Date(),
        lastExecuted: null,
        executionCount: 0,
        successCount: 0,
        errorCount: 0,
        lastError: null
      };
      
      // Validate workflow configuration
      if (!this.validateWorkflowConfig(workflow)) {
        throw new Error('Invalid workflow configuration');
      }
      
      this.activeWorkflows.set(workflowId, workflow);
      
      // Set up triggers
      await this.setupWorkflowTriggers(workflow);
      
      logger.info(`Workflow created: ${workflowId} - ${workflow.name}`);
      return workflow;
    } catch (error) {
      logger.error('Error creating workflow:', error);
      throw error;
    }
  }

  // Validate workflow configuration
  validateWorkflowConfig(workflow) {
    try {
      const plugin = this.pluginRegistry.get(workflow.pluginId);
      if (!plugin) {
        logger.error(`Plugin not found: ${workflow.pluginId}`);
        return false;
      }
      
      // Validate triggers
      for (const trigger of workflow.triggers) {
        if (!plugin.triggers.includes(trigger)) {
          logger.error(`Invalid trigger for plugin ${workflow.pluginId}: ${trigger}`);
          return false;
        }
      }
      
      // Validate actions
      for (const action of workflow.actions) {
        if (!plugin.actions.includes(action)) {
          logger.error(`Invalid action for plugin ${workflow.pluginId}: ${action}`);
          return false;
        }
      }
      
      return true;
    } catch (error) {
      logger.error('Error validating workflow config:', error);
      return false;
    }
  }

  // Set up workflow triggers
  async setupWorkflowTriggers(workflow) {
    try {
      for (const trigger of workflow.triggers) {
        switch (trigger) {
          case 'time_based':
            await this.setupTimeBasedTrigger(workflow);
            break;
          case 'message_received':
            // This will be handled by the message service
            break;
          case 'keyword_detected':
            // This will be handled by the AI intelligence service
            break;
          case 'sentiment_detected':
            // This will be handled by the AI intelligence service
            break;
          default:
            logger.warn(`Unknown trigger type: ${trigger}`);
        }
      }
    } catch (error) {
      logger.error('Error setting up workflow triggers:', error);
    }
  }

  // Set up time-based triggers
  async setupTimeBasedTrigger(workflow) {
    try {
      const config = workflow.config;
      if (config.triggers && config.triggers.timeWindow) {
        const { cronExpression, timezone } = config.triggers.timeWindow;
        
        if (cronExpression) {
          const task = cron.schedule(cronExpression, () => {
            this.executeWorkflow(workflow.id, { trigger: 'time_based', timestamp: new Date() });
          }, {
            scheduled: false,
            timezone: timezone || 'UTC'
          });
          
          this.scheduledTasks.set(workflow.id, task);
          
          if (workflow.enabled) {
            task.start();
          }
        }
      }
    } catch (error) {
      logger.error('Error setting up time-based trigger:', error);
    }
  }

  // Execute a workflow
  async executeWorkflow(workflowId, triggerData) {
    try {
      const workflow = this.activeWorkflows.get(workflowId);
      if (!workflow || !workflow.enabled) {
        return false;
      }
      
      workflow.lastExecuted = new Date();
      workflow.executionCount++;
      
      logger.info(`Executing workflow: ${workflowId} - ${workflow.name}`);
      
      // Execute actions based on plugin type
      const plugin = this.pluginRegistry.get(workflow.pluginId);
      if (!plugin) {
        throw new Error(`Plugin not found: ${workflow.pluginId}`);
      }
      
      let success = true;
      
      for (const action of workflow.actions) {
        try {
          await this.executeAction(workflow, action, triggerData);
        } catch (error) {
          logger.error(`Error executing action ${action} in workflow ${workflowId}:`, error);
          success = false;
          workflow.lastError = error.message;
        }
      }
      
      if (success) {
        workflow.successCount++;
      } else {
        workflow.errorCount++;
      }
      
      return success;
    } catch (error) {
      logger.error(`Error executing workflow ${workflowId}:`, error);
      return false;
    }
  }

  // Execute a specific action
  async executeAction(workflow, action, triggerData) {
    try {
      const plugin = this.pluginRegistry.get(workflow.pluginId);
      const config = workflow.config;
      
      switch (action) {
        case 'send_message':
          await this.executeSendMessage(config, triggerData);
          break;
          
        case 'forward_message':
          await this.executeForwardMessage(config, triggerData);
          break;
          
        case 'http_request':
          await this.executeHttpRequest(config, triggerData);
          break;
          
        case 'slack_notification':
          await this.executeSlackNotification(config, triggerData);
          break;
          
        case 'email_alert':
          await this.executeEmailAlert(config, triggerData);
          break;
          
        case 'create_ticket':
          await this.executeCreateTicket(config, triggerData);
          break;
          
        case 'escalate_urgent':
          await this.executeEscalation(config, triggerData);
          break;
          
        case 'schedule_followup':
          await this.executeScheduleFollowup(config, triggerData);
          break;
          
        default:
          logger.warn(`Unknown action: ${action}`);
      }
    } catch (error) {
      logger.error(`Error executing action ${action}:`, error);
      throw error;
    }
  }

  // Execute send message action
  async executeSendMessage(config, triggerData) {
    try {
      const { responseTemplate, platform, recipient } = config.actions;
      
      if (!responseTemplate) {
        throw new Error('Response template not configured');
      }
      
      // Process template variables
      const processedTemplate = this.processTemplate(responseTemplate, triggerData);
      
      // Send message through platform service
      // This would integrate with your existing message service
      logger.info(`Auto-reply sent: ${processedTemplate.substring(0, 50)}...`);
      
      return true;
    } catch (error) {
      logger.error('Error executing send message action:', error);
      throw error;
    }
  }

  // Execute forward message action
  async executeForwardMessage(config, triggerData) {
    try {
      const { sourcePlatform, targetPlatform, conditions } = config;
      
      if (!sourcePlatform || !targetPlatform) {
        throw new Error('Source and target platforms must be specified');
      }
      
      // Check conditions
      if (conditions && !this.evaluateConditions(conditions, triggerData)) {
        logger.debug('Forward conditions not met, skipping');
        return false;
      }
      
      // Forward message logic would go here
      logger.info(`Message forwarded from ${sourcePlatform} to ${targetPlatform}`);
      
      return true;
    } catch (error) {
      logger.error('Error executing forward message action:', error);
      throw error;
    }
  }

  // Execute HTTP request action
  async executeHttpRequest(config, triggerData) {
    try {
      const { webhookUrl, headers, payload, method = 'POST' } = config;
      
      if (!webhookUrl) {
        throw new Error('Webhook URL not configured');
      }
      
      // Process payload template
      const processedPayload = this.processTemplate(JSON.stringify(payload), triggerData);
      const processedHeaders = headers ? this.processTemplate(JSON.stringify(headers), triggerData) : {};
      
      const response = await axios({
        method,
        url: webhookUrl,
        headers: processedHeaders,
        data: JSON.parse(processedPayload),
        timeout: 10000
      });
      
      logger.info(`Webhook executed successfully: ${webhookUrl} - Status: ${response.status}`);
      return true;
    } catch (error) {
      logger.error('Error executing HTTP request action:', error);
      throw error;
    }
  }

  // Execute Slack notification action
  async executeSlackNotification(config, triggerData) {
    try {
      const { webhookUrl, channel, message } = config;
      
      if (!webhookUrl || !message) {
        throw new Error('Slack webhook URL and message required');
      }
      
      const processedMessage = this.processTemplate(message, triggerData);
      
      const slackPayload = {
        channel: channel || '#general',
        text: processedMessage,
        username: 'Unified Inbox Bot',
        icon_emoji: ':inbox_tray:'
      };
      
      await axios.post(webhookUrl, slackPayload, {
        timeout: 10000
      });
      
      logger.info(`Slack notification sent to ${slackPayload.channel}`);
      return true;
    } catch (error) {
      logger.error('Error executing Slack notification action:', error);
      throw error;
    }
  }

  // Execute email alert action
  async executeEmailAlert(config, triggerData) {
    try {
      const { to, subject, body, from } = config;
      
      if (!to || !subject || !body) {
        throw new Error('Email recipient, subject, and body required');
      }
      
      const processedSubject = this.processTemplate(subject, triggerData);
      const processedBody = this.processTemplate(body, triggerData);
      
      // This would integrate with your email service
      logger.info(`Email alert sent to ${to}: ${processedSubject}`);
      
      return true;
    } catch (error) {
      logger.error('Error executing email alert action:', error);
      throw error;
    }
  }

  // Execute create ticket action
  async executeCreateTicket(config, triggerData) {
    try {
      const { ticketSystem, priority, category, assignee } = config;
      
      if (!ticketSystem) {
        throw new Error('Ticket system not configured');
      }
      
      // This would integrate with your ticket system
      logger.info(`Ticket created in ${ticketSystem} system`);
      
      return true;
    } catch (error) {
      logger.error('Error executing create ticket action:', error);
      throw error;
    }
  }

  // Execute escalation action
  async executeEscalation(config, triggerData) {
    try {
      const { escalationLevel, notifyUsers, channels } = config;
      
      if (!escalationLevel) {
        throw new Error('Escalation level not specified');
      }
      
      // Escalation logic would go here
      logger.info(`Message escalated to level ${escalationLevel}`);
      
      return true;
    } catch (error) {
      logger.error('Error executing escalation action:', error);
      throw error;
    }
  }

  // Execute schedule followup action
  async executeScheduleFollowup(config, triggerData) {
    try {
      const { delay, message, platform, recipient } = config;
      
      if (!delay || !message) {
        throw new Error('Delay and message required for followup');
      }
      
      // Schedule followup logic would go here
      const followupTime = new Date(Date.now() + delay * 1000);
      logger.info(`Followup scheduled for ${followupTime}: ${message.substring(0, 50)}...`);
      
      return true;
    } catch (error) {
      logger.error('Error executing schedule followup action:', error);
      throw error;
    }
  }

  // Process template variables
  processTemplate(template, data) {
    try {
      let processed = template;
      
      // Replace variables like {{sender}}, {{platform}}, {{timestamp}}
      const variables = {
        '{{sender}}': data.sender || 'Unknown',
        '{{platform}}': data.platform || 'Unknown',
        '{{timestamp}}': new Date().toISOString(),
        '{{message}}': data.message || '',
        '{{urgency}}': data.urgency || 'normal',
        '{{category}}': data.category || 'general',
        '{{sentiment}}': data.sentiment || 'neutral'
      };
      
      Object.entries(variables).forEach(([variable, value]) => {
        processed = processed.replace(new RegExp(variable, 'g'), value);
      });
      
      return processed;
    } catch (error) {
      logger.error('Error processing template:', error);
      return template;
    }
  }

  // Evaluate conditions
  evaluateConditions(conditions, data) {
    try {
      for (const [key, value] of Object.entries(conditions)) {
        switch (key) {
          case 'platform':
            if (data.platform !== value) return false;
            break;
          case 'urgency':
            if (data.urgency !== value) return false;
            break;
          case 'category':
            if (data.category !== value) return false;
            break;
          case 'sentiment':
            if (data.sentiment !== value) return false;
            break;
          case 'timeWindow':
            if (!this.isInTimeWindow(value, data.timestamp)) return false;
            break;
          default:
            logger.warn(`Unknown condition: ${key}`);
        }
      }
      
      return true;
    } catch (error) {
      logger.error('Error evaluating conditions:', error);
      return false;
    }
  }

  // Check if timestamp is in time window
  isInTimeWindow(timeWindow, timestamp) {
    try {
      const now = new Date(timestamp || Date.now());
      const { start, end, daysOfWeek } = timeWindow;
      
      // Check day of week
      if (daysOfWeek && daysOfWeek.length > 0) {
        const dayOfWeek = now.getDay();
        if (!daysOfWeek.includes(dayOfWeek)) {
          return false;
        }
      }
      
      // Check time range
      if (start && end) {
        const currentTime = now.getHours() * 60 + now.getMinutes();
        const startTime = this.parseTimeString(start);
        const endTime = this.parseTimeString(end);
        
        if (currentTime < startTime || currentTime > endTime) {
          return false;
        }
      }
      
      return true;
    } catch (error) {
      logger.error('Error checking time window:', error);
      return false;
    }
  }

  // Parse time string (e.g., "09:00" to minutes)
  parseTimeString(timeString) {
    try {
      const [hours, minutes] = timeString.split(':').map(Number);
      return hours * 60 + minutes;
    } catch (error) {
      logger.error('Error parsing time string:', error);
      return 0;
    }
  }

  // Enable/disable workflow
  async toggleWorkflow(workflowId, enabled) {
    try {
      const workflow = this.activeWorkflows.get(workflowId);
      if (!workflow) {
        throw new Error(`Workflow not found: ${workflowId}`);
      }
      
      workflow.enabled = enabled;
      
      // Handle scheduled tasks
      const scheduledTask = this.scheduledTasks.get(workflowId);
      if (scheduledTask) {
        if (enabled) {
          scheduledTask.start();
        } else {
          scheduledTask.stop();
        }
      }
      
      logger.info(`Workflow ${workflowId} ${enabled ? 'enabled' : 'disabled'}`);
      return true;
    } catch (error) {
      logger.error(`Error toggling workflow ${workflowId}:`, error);
      throw error;
    }
  }

  // Delete workflow
  async deleteWorkflow(workflowId) {
    try {
      const workflow = this.activeWorkflows.get(workflowId);
      if (!workflow) {
        throw new Error(`Workflow not found: ${workflowId}`);
      }
      
      // Stop scheduled tasks
      const scheduledTask = this.scheduledTasks.get(workflowId);
      if (scheduledTask) {
        scheduledTask.stop();
        this.scheduledTasks.delete(workflowId);
      }
      
      this.activeWorkflows.delete(workflowId);
      
      logger.info(`Workflow deleted: ${workflowId}`);
      return true;
    } catch (error) {
      logger.error(`Error deleting workflow ${workflowId}:`, error);
      throw error;
    }
  }

  // Get workflow statistics
  getWorkflowStats(workflowId) {
    try {
      const workflow = this.activeWorkflows.get(workflowId);
      if (!workflow) {
        return null;
      }
      
      return {
        id: workflow.id,
        name: workflow.name,
        enabled: workflow.enabled,
        executionCount: workflow.executionCount,
        successCount: workflow.successCount,
        errorCount: workflow.errorCount,
        successRate: workflow.executionCount > 0 
          ? Math.round((workflow.successCount / workflow.executionCount) * 100)
          : 0,
        lastExecuted: workflow.lastExecuted,
        lastError: workflow.lastError
      };
    } catch (error) {
      logger.error(`Error getting workflow stats for ${workflowId}:`, error);
      return null;
    }
  }

  // Get all workflows
  getAllWorkflows() {
    try {
      return Array.from(this.activeWorkflows.values()).map(workflow => ({
        id: workflow.id,
        name: workflow.name,
        description: workflow.description,
        enabled: workflow.enabled,
        pluginId: workflow.pluginId,
        createdAt: workflow.createdAt,
        lastExecuted: workflow.lastExecuted,
        executionCount: workflow.executionCount,
        successCount: workflow.successCount,
        errorCount: workflow.errorCount
      }));
    } catch (error) {
      logger.error('Error getting all workflows:', error);
      return [];
    }
  }

  // Get available plugins
  getAvailablePlugins() {
    try {
      return Array.from(this.pluginRegistry.values()).map(plugin => ({
        id: plugin.id,
        name: plugin.name,
        description: plugin.description,
        version: plugin.version,
        author: plugin.author,
        triggers: plugin.triggers,
        actions: plugin.actions,
        configSchema: plugin.configSchema
      }));
    } catch (error) {
      logger.error('Error getting available plugins:', error);
      return [];
    }
  }

  // Handle message events (called by message service)
  async handleMessageEvent(eventType, messageData) {
    try {
      const relevantWorkflows = Array.from(this.activeWorkflows.values())
        .filter(workflow => 
          workflow.enabled && 
          workflow.triggers.includes(eventType)
        );
      
      for (const workflow of relevantWorkflows) {
        try {
          await this.executeWorkflow(workflow.id, {
            trigger: eventType,
            ...messageData
          });
        } catch (error) {
          logger.error(`Error handling message event for workflow ${workflow.id}:`, error);
        }
      }
    } catch (error) {
      logger.error('Error handling message event:', error);
    }
  }
}

module.exports = new PluginService();
