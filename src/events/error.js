import { UserState } from '../utils/userState.js';
import { showMainMenu } from '../commands/start.js';

export function setupErrorHandler(bot) {
  bot.on('error', async (error) => {
    console.error('Telegram bot error:', error);
  });
  
  bot.on('polling_error', (error) => {
    console.error('Polling error:', error);
  });

  // Handle callback queries for retry and back actions
  bot.on('callback_query', async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const action = callbackQuery.data;

    try {
      if (action === 'retry_action') {
        const state = UserState.getState(chatId);
        if (state) {
          // Re-trigger the last action based on state
          switch (state) {
            case 'WAITING_MEME_INPUT':
              await bot.sendMessage(chatId, 'What meme would you like me to analyze?');
              break;
            case 'WAITING_INVESTMENT_INPUT':
              await bot.sendMessage(chatId, 'What investment would you like advice about?');
              break;
            case 'WAITING_LOAN_ANALYSIS_CONFIRMATION':
              await bot.sendMessage(chatId, 'Would you like me to analyze these loans?');
              break;
            default:
              await bot.sendMessage(chatId, 'Please try your request again.');
          }
        }
      } else if (action === 'back_to_menu') {
        // Clear state and show main menu
        UserState.clearUserState(chatId);
        await showMainMenu(bot, chatId);
      }
    } catch (error) {
      console.error('Error handling callback query:', error);
      await bot.sendMessage(chatId, '❌ An error occurred. Please try again.');
    }

    await bot.answerCallbackQuery(callbackQuery.id);
  });
}