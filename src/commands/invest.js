import { UserState } from '../utils/userState.js';

export function setupInvestCommand(bot) {
  bot.onText(/\/invest|💰 Investment Advice/, async (msg) => {
    const chatId = msg.chat.id;
    await bot.sendMessage(
      chatId, 
      'What investment would you like advice about? Please describe your query:'
    );
    UserState.setState(chatId, 'WAITING_INVESTMENT_INPUT');
  });
}