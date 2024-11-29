import { networkState } from '../services/networkState.js';
import { UserState } from '../utils/userState.js';
import { config } from '../config.js';

export function setupNetworkCommand(bot) {
  bot.onText(/\/network|🔄 Switch Network/, async (msg) => {
    const chatId = msg.chat.id;
    await showNetworkSelection(bot, chatId);
  });

  // Handle network selection
  bot.on('callback_query', async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const data = callbackQuery.data;

    if (data === 'switch_network') {
      await showNetworkSelection(bot, chatId);
      await bot.answerCallbackQuery(callbackQuery.id);
    }
    else if (data.startsWith('network_')) {
      const network = data.replace('network_', '');
      networkState.setCurrentNetwork(chatId, network);
      
      await bot.answerCallbackQuery(callbackQuery.id);
      await bot.sendMessage(
        chatId,
        `Network switched to ${networkState.getNetworkDisplay(network)} 🔄\n\n` +
        'You can now use any blockchain features with the new network.',
        {
          reply_markup: {
            inline_keyboard: [[
              { text: '↩️ Back to Menu', callback_data: 'back_to_menu' }
            ]]
          }
        }
      );
    }
  });
}

export async function showNetworkSelection(bot, chatId) {
  const currentNetwork = networkState.getCurrentNetwork(chatId);
  const networks = Object.keys(config.networks);

  const buttons = networks.map(network => ({
    text: network === currentNetwork ? 
      `${networkState.getNetworkDisplay(network)} ✓` : 
      networkState.getNetworkDisplay(network),
    callback_data: `network_${network}`
  }));

  const keyboard = {
    inline_keyboard: [
      buttons,
      [{ text: '↩️ Back to Menu', callback_data: 'back_to_menu' }]
    ]
  };

  await bot.sendMessage(
    chatId,
    '*Select Network* 🌐\n\n' +
    'Choose the blockchain network to use:',
    { 
      parse_mode: 'Markdown',
      reply_markup: keyboard 
    }
  );
}