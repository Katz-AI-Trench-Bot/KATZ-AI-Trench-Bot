import { createKeyboard } from '../utils/keyboard.js';
import { UserState } from '../utils/userState.js';
import { networkState } from '../services/networkState.js';

export function setupStartCommand(bot) {
  bot.onText(/\/start/, async (msg) => {
    await showStartMessage(bot, msg.chat.id);
  });

  bot.on('callback_query', async (callbackQuery) => {
    if (callbackQuery.data === 'start_command') {
      await showStartMessage(bot, callbackQuery.message.chat.id);
      await bot.answerCallbackQuery(callbackQuery.id);
    }
  });
}

async function showStartMessage(bot, chatId) {
  const currentNetwork = networkState.getCurrentNetwork(chatId);
  
  UserState.clearUserState(chatId);
  
  const welcomeMessage = `
🐈‍⬛ *KATZ - Courage's AI Trench Bot* 🐈‍⬛

_Your AI trench pawtner for Eth, Base, SOL memes_ 

🔍 *A personalized assistant for you meme trading:* 😼
• 🦴 Meme Analysis
• 🦴 Investment Advice
• 🦴 Loan Analysis
• 🦴 Token Scanning
• 🦴 Pump.fun Trading, and more...

🌐 *Website:* [courage.io](https://courage.io)
🐕 *Owner:* Courage The Trench Dog

Current network: *${networkState.getNetworkDisplay(currentNetwork)}*
`.trim();

  try {
    await bot.sendAnimation(chatId, 
      'https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExa2JkenYycWk0YjBnNXhhaGliazI2dWxwYm94djNhZ3R1dWhsbmQ2MCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/xouqS1ezHDrNkhPWMI/giphy.gif', 
      {
        caption: welcomeMessage,
        parse_mode: 'Markdown',
        disable_web_page_preview: true
      }
    );

    await showMainMenu(bot, chatId);
  } catch (error) {
    console.error('Error in start command:', error);
    await handleStartError(bot, chatId);
  }
}

export async function showMainMenu(bot, chatId) {
  try {
    const keyboard = {
      keyboard: [
        ['🎭 Meme Analysis', '💰 Investment Advice'],
        ['📊 Vet Meme Loans', '🔥 Trending Tokens'],
        ['🔍 Scan Token', '⚠️ Rug Reports'],
        ['💊 Pump.fun', '👛 Wallets'],
        ['⚙️ Settings', '❓ Help'],
        ['🫅 Butler Asst']
      ],
      resize_keyboard: true
    };

    const menuMessage = await bot.sendMessage(chatId, 'Select an option:', {
      reply_markup: keyboard
    });

    UserState.setMenuState(chatId, 'MAIN_MENU');
    UserState.trackMessage(chatId, menuMessage.message_id);
  } catch (error) {
    console.error('Error showing main menu:', error);
    await handleStartError(bot, chatId);
  }
}

async function handleStartError(bot, chatId) {
  try {
    const keyboard = {
      inline_keyboard: [[
        { text: '🔄 Retry', callback_data: 'start_command' }
      ]]
    };

    await bot.sendMessage(
      chatId,
      '❌ Something went wrong. Please try again.',
      { reply_markup: keyboard }
    );
  } catch (error) {
    console.error('Error handling start error:', error);
  }
}