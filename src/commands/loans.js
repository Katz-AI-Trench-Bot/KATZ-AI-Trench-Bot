import { BlockchainService } from '../services/blockchain.js';
import { generateAIResponse } from '../services/openai.js';
import { config } from '../config.js';
import { UserState } from '../utils/userState.js';

const blockchain = new BlockchainService();

export function setupLoansCommand(bot) {
  bot.onText(/\/loans|📊 Vet Meme Loans/, async (msg) => {
    const chatId = msg.chat.id;
    
    // Check if user is configured
    if (!UserState.isConfigured(chatId)) {
      const keyboard = {
        inline_keyboard: [
          [
            { text: '⚙️ Configure Wallet', callback_data: 'goto_settings' },
            { text: '↩️ Back to Menu', callback_data: 'back_to_menu' }
          ]
        ]
      };
      
      await bot.sendMessage(
        chatId,
        '❌ Wallet not configured! Please configure your wallet before analyzing loans.',
        { reply_markup: keyboard }
      );
      return;
    }

    try {
      const loadingMsg = await bot.sendMessage(chatId, '🦴 Courage fetching... Loading loan data');
      const { network, loans } = await blockchain.fetchLoans(msg.chat.id);
      const loansMessage = formatLoansMessage(loans, network);
      await bot.deleteMessage(chatId, loadingMsg.message_id);
      await bot.sendMessage(chatId, loansMessage, { parse_mode: 'Markdown' });
      
      // Ask user if they want AI analysis
      const keyboard = {
        inline_keyboard: [
          [
            { text: '✅ Yes, analyze', callback_data: 'analyze_loans' },
            { text: '❌ No, thanks', callback_data: 'back_to_menu' }
          ]
        ]
      };
      
      await bot.sendMessage(
        chatId, 
        'Would you like me to analyze these loans for meme investment opportunities?',
        { reply_markup: keyboard }
      );
      
      UserState.setState(chatId, 'WAITING_LOAN_ANALYSIS_CONFIRMATION');
      UserState.setUserData(chatId, { pendingLoans: loans, pendingNetwork: network });
    } catch (error) {
      console.error('Loan fetching error:', error);
      const keyboard = {
        inline_keyboard: [
          [
            { text: '🔄 Retry', callback_data: 'retry_action' },
            { text: '↩️ Back to Menu', callback_data: 'back_to_menu' }
          ]
        ]
      };
      
      await bot.sendMessage(
        chatId,
        '❌ Error fetching loans. Please check your settings and network connection.',
        { reply_markup: keyboard }
      );
    }
  });

  // Handle the goto_settings callback
  bot.on('callback_query', async (callbackQuery) => {
    if (callbackQuery.data === 'goto_settings') {
      const chatId = callbackQuery.message.chat.id;
      await bot.deleteMessage(chatId, callbackQuery.message.message_id);
      await bot.sendMessage(chatId, 'Please enter your wallet address:');
      UserState.setState(chatId, 'WAITING_WALLET');
    } else if (callbackQuery.data === 'analyze_loans') {
      const chatId = callbackQuery.message.chat.id;
      const userData = UserState.getUserData(chatId);
      if (userData?.pendingLoans) {
        const prompt = `Analyze these loans for meme investment opportunities: ${JSON.stringify(userData.pendingLoans)}`;
        const loadingMsg = await bot.sendMessage(chatId, '🦴 Courage fetching... Analyzing loans');
        try {
          const analysis = await generateAIResponse(prompt, 'investment');
          await bot.deleteMessage(chatId, loadingMsg.message_id);
          await bot.sendMessage(chatId, analysis);
        } catch (error) {
          console.error('Analysis error:', error);
          await bot.deleteMessage(chatId, loadingMsg.message_id);
          await bot.sendMessage(chatId, '❌ Error analyzing loans. Please try again.');
        }
      }
      UserState.clearUserState(chatId);
    }
    await bot.answerCallbackQuery(callbackQuery.id);
  });
}

function formatLoansMessage(loans, network) {
  if (!loans || loans.length === 0) {
    return `*No loans available on ${config.networks[network].name}*`;
  }

  return `*Available Loans on ${config.networks[network].name}:*\n\n${loans.map((loan, index) => 
    `Loan #${index + 1}:
• Collateral: ${loan.collateralAmount} ${loan.collateralToken}
• Loan Amount: ${loan.loanAmount} ${loan.loanToken}
• Repay Amount: ${loan.repayAmountOffered} ${loan.loanToken}
• Duration: ${loan.durationDays} days`
  ).join('\n\n')}`;
}