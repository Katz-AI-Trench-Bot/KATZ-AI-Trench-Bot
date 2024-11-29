import { UserState } from '../utils/userState.js';
import { alertService } from '../services/alert.js';
import { googleService } from '../services/google.js';
import { ErrorHandler } from '../utils/errorHandler.js';
import { openai } from '../services/openai.js';

export function setupButlerCommand(bot) {
  bot.onText(/\/butler|🫅 Butler Asst/, async (msg) => {
    const chatId = msg.chat.id;
    
    try {
      // Test OpenAI connection first
      const loadingMsg = await bot.sendMessage(chatId, '🦴 Courage fetching... Testing AI connection');
      
      try {
        await openai.testConnection();
        await bot.deleteMessage(chatId, loadingMsg.message_id);
        await showButlerMenu(bot, chatId);
      } catch (error) {
        await bot.deleteMessage(chatId, loadingMsg.message_id);
        await ErrorHandler.handleOpenAIError(bot, chatId, error);
      }
    } catch (error) {
      console.error('Error in butler command:', error);
      await ErrorHandler.handleButlerError(bot, chatId, error);
    }
  });

  // Handle butler menu callbacks
  bot.on('callback_query', async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const action = callbackQuery.data;

    try {
      switch (action) {
        case 'view_alerts':
          await showAlertsMenu(bot, chatId);
          break;
        case 'setup_google':
          await setupGoogleServices(bot, chatId);
          break;
        case 'add_price_alert':
          await showPriceAlertForm(bot, chatId);
          break;
        case 'add_event':
          await showEventForm(bot, chatId);
          break;
        case 'butler_retry':
          await bot.deleteMessage(chatId, callbackQuery.message.message_id);
          await showButlerMenu(bot, chatId);
          break;
      }
    } catch (error) {
      console.error('Error handling butler action:', error);
      if (ErrorHandler.isOpenAIError(error)) {
        await ErrorHandler.handleOpenAIError(bot, chatId, error);
      } else {
        await ErrorHandler.handleButlerError(bot, chatId, error);
      }
    }

    await bot.answerCallbackQuery(callbackQuery.id);
  });
}

async function showButlerMenu(bot, chatId) {
  const keyboard = {
    inline_keyboard: [
      [{ text: '🔔 Your Alerts', callback_data: 'view_alerts' }],
      [{ text: '🔗 Setup Google Services', callback_data: 'setup_google' }],
      [{ text: '↩️ Back to Menu', callback_data: 'back_to_menu' }]
    ]
  };

  await bot.sendMessage(
    chatId,
    '*Butler Assistant* 🫅\n\n' +
    'I can help you with:\n' +
    '• Managing alerts and reminders\n' +
    '• Connecting to Google services\n' +
    '• Organizing your schedule\n\n' +
    'Select an option:',
    { 
      parse_mode: 'Markdown',
      reply_markup: keyboard 
    }
  );
}

async function showAlertsMenu(bot, chatId) {
  const keyboard = {
    inline_keyboard: [
      [{ text: '💰 Add Price Alert', callback_data: 'add_price_alert' }],
      [{ text: '📅 Add Event', callback_data: 'add_event' }],
      [{ text: '📋 View Alerts', callback_data: 'view_all_alerts' }],
      [{ text: '↩️ Back', callback_data: 'butler_menu' }]
    ]
  };

  await bot.sendMessage(
    chatId,
    '*Your Alerts* 🔔\n\n' +
    'Manage your alerts and events:\n\n' +
    '• Set price alerts for tokens\n' +
    '• Create timed event reminders\n' +
    '• View and manage existing alerts',
    { 
      parse_mode: 'Markdown',
      reply_markup: keyboard 
    }
  );
}

async function setupGoogleServices(bot, chatId) {
  try {
    const authUrl = await googleService.getAuthUrl(chatId);
    
    const keyboard = {
      inline_keyboard: [
        [{ text: '🔗 Connect Google Account', url: authUrl }],
        [{ text: '↩️ Back', callback_data: 'butler_menu' }]
      ]
    };

    await bot.sendMessage(
      chatId,
      '*Connect Google Services* 🔗\n\n' +
      'Click below to connect your Google account:\n\n' +
      '• Sync events with Google Calendar\n' +
      '• Access Google Drive files\n' +
      '• Manage emails and more',
      { 
        parse_mode: 'Markdown',
        reply_markup: keyboard 
      }
    );
  } catch (error) {
    console.error('Error setting up Google services:', error);
    throw error;
  }
}

async function showPriceAlertForm(bot, chatId) {
  UserState.setState(chatId, 'WAITING_PRICE_ALERT');
  
  await bot.sendMessage(
    chatId,
    '*Set Price Alert* 💰\n\n' +
    'Please enter the token address and target price in this format:\n\n' +
    '`<token_address> <target_price>`\n\n' +
    'Example:\n' +
    '`0x123...abc 0.5`',
    { 
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[
          { text: '↩️ Cancel', callback_data: 'view_alerts' }
        ]]
      }
    }
  );
}

async function showEventForm(bot, chatId) {
  UserState.setState(chatId, 'WAITING_EVENT_DETAILS');
  
  await bot.sendMessage(
    chatId,
    '*Create Event* 📅\n\n' +
    'Please enter the event details in this format:\n\n' +
    '`<event_name> | <date_time> | <description>`\n\n' +
    'Example:\n' +
    '`Team Meeting | 2024-12-01 15:00 | Weekly sync call`',
    { 
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[
          { text: '↩️ Cancel', callback_data: 'view_alerts' }
        ]]
      }
    }
  );
}