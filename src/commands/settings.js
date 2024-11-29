import { UserState } from '../utils/userState.js';
import { networkState } from '../services/networkState.js';
import { config } from '../config.js';

export function setupSettingsCommand(bot) {
  bot.onText(/\/settings|⚙️ Settings/, async (msg) => {
    const chatId = msg.chat.id;
    await showSettingsMenu(bot, chatId);
  });

  // Handle settings-related callbacks
  bot.on('callback_query', async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const action = callbackQuery.data;

    try {
      if (action === 'settings') {
        await showSettingsMenu(bot, chatId);
      }
      else if (action === 'switch_network') {
        await showNetworkSelection(bot, chatId);
      }
      else if (action.startsWith('network_')) {
        const network = action.replace('network_', '');
        await handleNetworkSwitch(bot, chatId, network);
      }
    } catch (error) {
      console.error('Error handling settings action:', error);
      await handleSettingsError(bot, chatId);
    }

    await bot.answerCallbackQuery(callbackQuery.id);
  });
}

async function showSettingsMenu(bot, chatId) {
  const currentNetwork = networkState.getCurrentNetwork(chatId);
  
  const keyboard = {
    inline_keyboard: [
      [{ text: '🔄 Switch Network', callback_data: 'switch_network' }],
      [{ text: '↩️ Back to Menu', callback_data: 'back_to_menu' }]
    ]
  };

  await bot.sendMessage(
    chatId,
    `*Settings* ⚙️\n\n` +
    `Current Network: *${networkState.getNetworkDisplay(currentNetwork)}*\n\n` +
    'Configure your preferences:',
    { 
      parse_mode: 'Markdown',
      reply_markup: keyboard 
    }
  );
}

async function showNetworkSelection(bot, chatId) {
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
      [{ text: '↩️ Back to Settings', callback_data: 'settings' }]
    ]
  };

  await bot.sendMessage(
    chatId,
    '*Network Selection* 🌐\n\n' +
    'Choose the blockchain network to use:\n\n' +
    '_This will affect all blockchain operations_',
    { 
      parse_mode: 'Markdown',
      reply_markup: keyboard 
    }
  );
}

async function handleNetworkSwitch(bot, chatId, network) {
  try {
    networkState.setCurrentNetwork(chatId, network);
    
    await bot.sendMessage(
      chatId,
      `Network switched to *${networkState.getNetworkDisplay(network)}* 🔄\n\n` +
      'All blockchain features will now use this network.',
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[
            { text: '⚙️ Back to Settings', callback_data: 'settings' },
            { text: '🏠 Main Menu', callback_data: 'back_to_menu' }
          ]]
        }
      }
    );
  } catch (error) {
    console.error('Error switching network:', error);
    await handleSettingsError(bot, chatId);
  }
}

async function handleSettingsError(bot, chatId) {
  const keyboard = {
    inline_keyboard: [[
      { text: '🔄 Retry', callback_data: 'settings' },
      { text: '↩️ Back to Menu', callback_data: 'back_to_menu' }
    ]]
  };

  await bot.sendMessage(
    chatId,
    '❌ An error occurred. Please try again.',
    { reply_markup: keyboard }
  );
}