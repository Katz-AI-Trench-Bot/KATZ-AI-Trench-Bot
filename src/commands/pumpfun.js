import { UserState } from '../utils/userState.js';
import { pumpFunService } from '../services/pumpfun.js';
import { walletService } from '../services/wallet.js';
import { ErrorHandler } from '../utils/errorHandler.js';

export function setupPumpFunCommand(bot) {
  bot.onText(/\/pump|💊 Pump\.fun/, async (msg) => {
    const chatId = msg.chat.id;
    
    try {
      const loadingMsg = await bot.sendMessage(chatId, '🦴 Courage fetching... Loading PumpFun data');
      UserState.setState(chatId, 'WAITING_PUMP_ACTION');
      
      // Check if user has an active wallet
      const activeWallet = walletService.getActiveWallet(chatId);
      if (!activeWallet) {
        await bot.deleteMessage(chatId, loadingMsg.message_id);
        await bot.sendMessage(
          chatId,
          '❌ Please select or create a Solana wallet first.',
          {
            reply_markup: {
              inline_keyboard: [
                [{ text: '👛 Go to Wallets', callback_data: 'settings_wallets' }],
                [{ text: '↩️ Back to Menu', callback_data: 'back_to_menu' }]
              ]
            }
          }
        );
        return;
      }

      try {
        const tokens = await pumpFunService.fetchLatestTokens();
        await bot.deleteMessage(chatId, loadingMsg.message_id);

        const keyboard = {
          inline_keyboard: [
            [{ text: '👀 Watch New Tokens', callback_data: 'pump_watch' }],
            [{ text: '💰 Buy Token', callback_data: 'pump_buy' }],
            [{ text: '💱 Sell Token', callback_data: 'pump_sell' }],
            [{ text: '↩️ Back to Menu', callback_data: 'back_to_menu' }]
          ]
        };

        let message = '*PumpFun Trading* 💊\n\n';
        if (tokens && tokens.length > 0) {
          message += '*Latest Tokens:*\n';
          tokens.slice(0, 5).forEach((token, index) => {
            message += `${index + 1}. ${token.symbol} - ${token.price}\n`;
          });
          message += '\n';
        }

        message += 'Select an action:\n\n' +
                  '• Watch new token listings\n' +
                  '• Buy tokens with SOL\n' +
                  '• Sell tokens for SOL\n\n' +
                  '_Note: All trades have 3% default slippage_';

        await bot.sendMessage(chatId, message, { 
          parse_mode: 'Markdown',
          reply_markup: keyboard 
        });

      } catch (error) {
        console.error('Error fetching PumpFun data:', error);
        await bot.deleteMessage(chatId, loadingMsg.message_id);
        throw error; // Propagate to outer catch block
      }

    } catch (error) {
      console.error('Error in PumpFun command:', error);
      await ErrorHandler.handlePumpFunError(bot, chatId, error);
    } finally {
      UserState.clearUserState(chatId);
    }
  });

  // Handle PumpFun callbacks
  bot.on('callback_query', async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const action = callbackQuery.data;

    try {
      if (action === 'pump_retry') {
        await bot.deleteMessage(chatId, callbackQuery.message.message_id);
        await bot.onText(/💊 Pump\.fun/, { chat: { id: chatId } });
      } else if (action === 'pump_watch') {
        UserState.setState(chatId, 'WATCHING_PUMP_TOKENS');
        const msg = await bot.sendMessage(chatId, '👀 Watching for new tokens...');
        
        // Subscribe to new token notifications
        const callback = (token) => {
          bot.sendMessage(chatId, 
            `🆕 *New Token Listed*\n\n` +
            `Symbol: ${token.symbol}\n` +
            `Price: ${token.price}\n` +
            `Time: ${new Date().toLocaleTimeString()}`,
            { parse_mode: 'Markdown' }
          );
        };
        
        pumpFunService.subscribe('newToken', callback);
        
        // Cleanup subscription after 5 minutes
        setTimeout(() => {
          pumpFunService.unsubscribe('newToken', callback);
          bot.deleteMessage(chatId, msg.message_id);
          bot.sendMessage(chatId, 'Token watching session ended.');
          UserState.clearUserState(chatId);
        }, 5 * 60 * 1000);
      }
    } catch (error) {
      console.error('Error handling PumpFun callback:', error);
      await ErrorHandler.handlePumpFunError(bot, chatId, error);
    }

    await bot.answerCallbackQuery(callbackQuery.id);
  });
}