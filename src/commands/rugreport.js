import { UserState } from '../utils/userState.js';

export function setupRugReportCommand(bot) {
  bot.onText(/\/rugreport|⚠️ Rug Report/, async (msg) => {
    const chatId = msg.chat.id;
    
    const keyboard = {
      inline_keyboard: [
        [{ text: '📋 View Reported Tokens', callback_data: 'view_reported' }],
        [{ text: '🚨 Report a Token', callback_data: 'report_token' }],
        [{ text: '↩️ Back to Menu', callback_data: 'back_to_menu' }]
      ]
    };

    await bot.sendMessage(
      chatId,
      '*Rug Report Center* ⚠️\n\n' +
      'Protect the community:\n\n' +
      '• View reported suspicious tokens\n' +
      '• Report potential rug pulls\n' +
      '• Help others stay safe\n\n' +
      'Select an option to continue:',
      { 
        parse_mode: 'Markdown',
        reply_markup: keyboard 
      }
    );
  });

  // Handle rug report options
  bot.on('callback_query', async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const action = callbackQuery.data;

    if (action === 'report_token') {
      UserState.setState(chatId, 'WAITING_REPORT_INPUT');
      await bot.sendMessage(
        chatId,
        'Please enter the token address you want to report:'
      );
    } else if (action === 'view_reported') {
      // Implement viewing reported tokens
      await bot.sendMessage(
        chatId,
        'Feature coming soon! 🚧'
      );
    }

    await bot.answerCallbackQuery(callbackQuery.id);
  });
}