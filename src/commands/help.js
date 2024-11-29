import { UserState } from '../utils/userState.js';

export function setupHelpCommand(bot) {
  bot.onText(/\/help|❓ Help/, async (msg) => {
    const chatId = msg.chat.id;
    await sendHelpMessage(chatId);
  });

  async function sendHelpMessage(chatId) {
    try {
      const helpMessage = `
🐈‍⬛ *KATZ Bot Commands & Features* 🐈‍⬛

*Main Features:*
• 🎭 *Meme Analysis* - Analyze meme trends and potential
• 💰 *Investment Advice* - Get strategic investment insights
• 📊 *Vet Meme Loans* - Analyze loan opportunities
• 🔥 *Trending Tokens* - View hot tokens across networks
• 🔍 *Scan Token* - Deep dive into token metrics
• ⚠️ *Rug Report* - Community safety reports
• 💊 *Pump.fun* - Trade on Pump.fun
• 👛 *Wallets* - Manage your wallets

*Network Support:*
• 🌐 Ethereum
• 🔵 Base
• ☀️ Solana

*Commands:*
/start - Launch the bot
/network - Switch networks
/settings - Configure wallet
/help - Show this guide

💡 *Pro Tips:*
• Use voice messages for natural queries
• Check trending tokens regularly
• Always DYOR before investing

*Need more help?*
Visit [courage.io](https://courage.io) for guides
`.trim();

      const keyboard = {
        inline_keyboard: [
          [{ text: '↩️ Back to Menu', callback_data: 'back_to_menu' }]
        ]
      };

      await bot.sendMessage(chatId, helpMessage, {
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
        reply_markup: keyboard
      });
    } catch (error) {
      console.error('Error sending help message:', error);
      await handleHelpError(bot, chatId);
    }
  }

  // Handle help callback
  bot.on('callback_query', async (callbackQuery) => {
    if (callbackQuery.data === 'show_help') {
      await sendHelpMessage(callbackQuery.message.chat.id);
      await bot.answerCallbackQuery(callbackQuery.id);
    }
  });
}

async function handleHelpError(bot, chatId) {
  const keyboard = {
    inline_keyboard: [[
      { text: '🔄 Retry', callback_data: 'show_help' },
      { text: '↩️ Back to Menu', callback_data: 'back_to_menu' }
    ]]
  };

  await bot.sendMessage(
    chatId,
    '❌ Error showing help. Please try again.',
    { reply_markup: keyboard }
  );
}