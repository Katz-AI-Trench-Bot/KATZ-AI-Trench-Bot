import { fetchTrendingTokens } from '../services/dextools/index.js';
import { UserState } from '../utils/userState.js';
import { networkState } from '../services/networkState.js';

export function setupTrendingCommand(bot) {
  bot.onText(/\/trending|🔥 Trending Tokens/, async (msg) => {
    const chatId = msg.chat.id;
    const currentNetwork = networkState.getCurrentNetwork(chatId);
    
    const loadingMsg = await bot.sendMessage(
      chatId, 
      `🦴 Courage fetching... Loading trending tokens on ${networkState.getNetworkDisplay(currentNetwork)}`
    );

    try {
      const tokens = await fetchTrendingTokens(currentNetwork);

      let message = `🔥 *Top Trending Tokens on ${networkState.getNetworkDisplay(currentNetwork)}*\n\n`;
      message += tokens.map(token => (
        `${token.rank}. *${token.symbol}*\n` +
        `• Name: ${token.name}\n` +
        `• Address: \`${token.address.slice(0, 6)}...${token.address.slice(-4)}\`\n` +
        `• [View on Dextools](${token.dextoolsUrl})\n`
      )).join('\n');

      await bot.deleteMessage(chatId, loadingMsg.message_id);

      const keyboard = {
        inline_keyboard: [
          [{ text: '🔄 Refresh', callback_data: 'refresh_trending' }],
          [{ text: '🌐 Switch Network', callback_data: 'switch_network' }],
          [{ text: '🏠 Main Menu', callback_data: 'back_to_menu' }]
        ]
      };

      await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
        reply_markup: keyboard
      });

    } catch (error) {
      console.error('Error fetching trending tokens:', error);
      await bot.deleteMessage(chatId, loadingMsg.message_id);
      
      const errorKeyboard = {
        inline_keyboard: [
          [
            { text: '🔄 Retry', callback_data: 'refresh_trending' },
            { text: '↩️ Back to Menu', callback_data: 'back_to_menu' }
          ]
        ]
      };

      await bot.sendMessage(
        chatId,
        '❌ Error fetching trending tokens. Please try again.',
        { reply_markup: errorKeyboard }
      );
    }
  });

  // Handle trending token callbacks
  bot.on('callback_query', async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const action = callbackQuery.data;

    if (action === 'refresh_trending') {
      await bot.deleteMessage(chatId, callbackQuery.message.message_id);
      await bot.onText(/🔥 Trending Tokens/, { chat: { id: chatId } });
    }

    await bot.answerCallbackQuery(callbackQuery.id);
  });
}