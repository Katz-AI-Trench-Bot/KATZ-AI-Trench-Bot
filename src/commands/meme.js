import { UserState } from '../utils/userState.js';

export function setupMemeCommand(bot) {
  bot.onText(/\/meme|🎭 Meme Analysis/, async (msg) => {
    const chatId = msg.chat.id;
    
    try {
      // Show options menu first
      const keyboard = {
        inline_keyboard: [
          [{ text: '📝 Enter CA or Symbol', callback_data: 'meme_ca' }],
          [{ text: '🎤 Send Voice Message', callback_data: 'meme_voice' }],
          [{ text: '↩️ Back to Menu', callback_data: 'back_to_menu' }]
        ]
      };
      
      const message = '*Choose how you want to analyze a meme:*\n\n' +
                     '• Enter Contract Address (CA) or Symbol\n' +
                     '• Send a Voice Message';
      
      await bot.sendMessage(chatId, message, { 
        parse_mode: 'Markdown',
        reply_markup: keyboard 
      });
    } catch (error) {
      console.error('Error in meme command:', error);
      const keyboard = {
        inline_keyboard: [[
          { text: '🔄 Retry', callback_data: 'retry_action' },
          { text: '↩️ Back to Menu', callback_data: 'back_to_menu' }
        ]]
      };
      await bot.sendMessage(
        chatId,
        '❌ An error occurred. Please try again.',
        { reply_markup: keyboard }
      );
    }
  });

  // Handle meme analysis options
  bot.on('callback_query', async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const action = callbackQuery.data;

    try {
      switch (action) {
        case 'meme_ca':
          UserState.setState(chatId, 'WAITING_MEME_INPUT');
          await bot.sendMessage(
            chatId, 
            'Please enter the Contract Address (CA) or Symbol you want to analyze:'
          );
          break;

        case 'meme_voice':
          UserState.setState(chatId, 'WAITING_MEME_INPUT');
          await bot.sendMessage(
            chatId,
            '🎤 Please send your voice message describing the meme you want to analyze.'
          );
          break;

        case 'retry_action':
          const state = UserState.getState(chatId);
          if (state === 'WAITING_MEME_INPUT') {
            const keyboard = {
              inline_keyboard: [
                [{ text: '📝 Enter CA or Symbol', callback_data: 'meme_ca' }],
                [{ text: '🎤 Send Voice Message', callback_data: 'meme_voice' }],
                [{ text: '↩️ Back to Menu', callback_data: 'back_to_menu' }]
              ]
            };
            
            await bot.sendMessage(
              chatId,
              '*Choose how you want to analyze a meme:*',
              { 
                parse_mode: 'Markdown',
                reply_markup: keyboard 
              }
            );
          }
          break;
      }
    } catch (error) {
      console.error('Error handling meme callback:', error);
      const keyboard = {
        inline_keyboard: [[
          { text: '🔄 Retry', callback_data: 'retry_action' },
          { text: '↩️ Back to Menu', callback_data: 'back_to_menu' }
        ]]
      };
      await bot.sendMessage(
        chatId,
        '❌ An error occurred. Please try again.',
        { reply_markup: keyboard }
      );
    }
    await bot.answerCallbackQuery(callbackQuery.id);
  });
}