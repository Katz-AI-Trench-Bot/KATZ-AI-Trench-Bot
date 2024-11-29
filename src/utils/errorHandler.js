export class ErrorHandler {
  static async handleOpenAIError(bot, chatId, error) {
    console.error('OpenAI API Error:', error);

    let message = '❌ AI services are currently unavailable.';
    
    if (error.message?.includes('billing')) {
      message = '❌ AI services are temporarily paused due to billing limits. Please contact admin.';
    } else if (error.message?.includes('rate limit')) {
      message = '❌ AI services are busy. Please try again in a few minutes.';
    } else if (error.message?.includes('API key')) {
      message = '❌ AI services are misconfigured. Please contact admin.';
    }

    const keyboard = {
      inline_keyboard: [
        [
          { text: '🔄 Retry', callback_data: 'retry_action' },
          { text: '↩️ Back to Menu', callback_data: 'back_to_menu' }
        ]
      ]
    };

    await bot.sendMessage(chatId, message, { reply_markup: keyboard });
  }

  static async handlePumpFunError(bot, chatId, error) {
    console.error('PumpFun Error:', error);

    const message = error.message?.includes('connect') ?
      '❌ Unable to connect to PumpFun service. Please try again later.' :
      '❌ An error occurred with PumpFun service.';

    const keyboard = {
      inline_keyboard: [
        [
          { text: '🔄 Retry', callback_data: 'pump_retry' },
          { text: '↩️ Back to Menu', callback_data: 'back_to_menu' }
        ]
      ]
    };

    await bot.sendMessage(chatId, message, { reply_markup: keyboard });
  }

  static async handleButlerError(bot, chatId, error) {
    console.error('Butler Error:', error);

    const message = '❌ Butler service encountered an error. Please try again.';

    const keyboard = {
      inline_keyboard: [
        [
          { text: '🔄 Retry', callback_data: 'butler_retry' },
          { text: '↩️ Back to Menu', callback_data: 'back_to_menu' }
        ]
      ]
    };

    await bot.sendMessage(chatId, message, { reply_markup: keyboard });
  }

  static isOpenAIError(error) {
    return error.name === 'OpenAIError' || 
           error.message?.includes('openai') ||
           error.message?.includes('API key');
  }

  static isPumpFunError(error) {
    return error.message?.includes('PumpFun') ||
           error.message?.includes('WebSocket');
  }
}