import { UserState } from '../utils/userState.js';
import { formatTokenAnalysis } from '../services/dextools.js';
import { networkState } from '../services/networkState.js';

export function setupScanCommand(bot) {
  bot.onText(/\/scan|🔍 Scan Token/, async (msg) => {
    const chatId = msg.chat.id;
    const currentNetwork = networkState.getCurrentNetwork(chatId);
    
    const keyboard = {
      inline_keyboard: [
        [{ text: '📝 Enter Token Address', callback_data: 'scan_input' }],
        [{ text: '🔄 Switch Network', callback_data: 'switch_network' }],
        [{ text: '↩️ Back to Menu', callback_data: 'back_to_menu' }]
      ]
    };

    await bot.sendMessage(
      chatId,
      `*Token Scanner* 🔍\n\n` +
      `Current Network: *${networkState.getNetworkDisplay(currentNetwork)}*\n\n` +
      'Analyze any token with detailed metrics:\n\n' +
      '• Price & Volume\n' +
      '• LP Value & Distribution\n' +
      '• Security Score & Risks\n' +
      '• Social Links & Info\n\n' +
      'Enter a token address to begin scanning.',
      { 
        parse_mode: 'Markdown',
        reply_markup: keyboard 
      }
    );
  });

  // Handle scan token input
  bot.on('callback_query', async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const action = callbackQuery.data;

    if (action === 'scan_input') {
      UserState.setState(chatId, 'WAITING_SCAN_INPUT');
      await bot.sendMessage(
        chatId,
        'Please enter the token address you want to scan:'
      );
    }

    await bot.answerCallbackQuery(callbackQuery.id);
  });

  // Handle token address input
  bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const state = UserState.getState(chatId);

    if (state === 'WAITING_SCAN_INPUT' && msg.text) {
      const currentNetwork = networkState.getCurrentNetwork(chatId);
      const loadingMsg = await bot.sendMessage(
        chatId, 
        `🦴 Courage fetching... Scanning token on ${networkState.getNetworkDisplay(currentNetwork)}`
      );
      
      try {
        const analysis = await formatTokenAnalysis(currentNetwork, msg.text.trim());
        
        await bot.deleteMessage(chatId, loadingMsg.message_id);
        await bot.sendMessage(chatId, analysis, {
          parse_mode: 'Markdown',
          disable_web_page_preview: true,
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔄 Scan Another', callback_data: 'scan_input' }],
              [{ text: '🔄 Switch Network', callback_data: 'switch_network' }],
              [{ text: '↩️ Back to Menu', callback_data: 'back_to_menu' }]
            ]
          }
        });
      } catch (error) {
        console.error('Error scanning token:', error);
        await bot.deleteMessage(chatId, loadingMsg.message_id);
        await bot.sendMessage(
          chatId,
          '❌ Error scanning token. Please check the address and try again.',
          {
            reply_markup: {
              inline_keyboard: [
                [{ text: '🔄 Try Again', callback_data: 'scan_input' }],
                [{ text: '↩️ Back to Menu', callback_data: 'back_to_menu' }]
              ]
            }
          }
        );
      }
      
      UserState.clearUserState(chatId);
    }
  });
}