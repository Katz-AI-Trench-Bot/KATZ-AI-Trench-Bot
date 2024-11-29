import { UserState } from '../utils/userState.js';
import { generateAIResponse, clearConversation } from '../services/openai.js';
import { convertVoiceToText } from '../services/voice.js';
import { ErrorHandler } from '../utils/errorHandler.js';
import Promise from 'bluebird';

async function handleVoiceMessage(bot, msg) {
  const chatId = msg.chat.id;
  const loadingMsg = await bot.sendMessage(chatId, '🦴 Courage fetching... Processing voice message');
  
  try {
    const file = await bot.getFile(msg.voice.file_id);
    const voiceText = await convertVoiceToText(file);
    await handleUserInput(bot, chatId, voiceText, 'chat');
  } catch (error) {
    console.error('Voice processing error:', error);
    if (loadingMsg) {
      await bot.deleteMessage(chatId, loadingMsg.message_id);
    }
    if (ErrorHandler.isOpenAIError(error)) {
      clearConversation(chatId);
      await ErrorHandler.handleOpenAIError(bot, chatId, error);
    } else {
      await showErrorMessage(bot, chatId);
    }
  }
}

async function handlePhotoMessage(bot, msg) {
  const chatId = msg.chat.id;
  const loadingMsg = await bot.sendMessage(chatId, '🦴 Courage fetching... Analyzing image');
  
  try {
    const file = await bot.getFile(msg.photo[msg.photo.length - 1].file_id);
    const imageUrl = `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`;
    const response = await generateAIResponse(imageUrl, 'image', chatId);
    await sendAIResponse(bot, chatId, response, loadingMsg.message_id);
  } catch (error) {
    console.error('Image processing error:', error);
    if (loadingMsg) {
      await bot.deleteMessage(chatId, loadingMsg.message_id);
    }
    if (ErrorHandler.isOpenAIError(error)) {
      clearConversation(chatId);
      await ErrorHandler.handleOpenAIError(bot, chatId, error);
    } else {
      await showErrorMessage(bot, chatId);
    }
  }
}

async function handlePdfMessage(bot, msg) {
  const chatId = msg.chat.id;
  const loadingMsg = await bot.sendMessage(chatId, '🦴 Courage fetching... Processing PDF');
  
  try {
    const file = await bot.getFile(msg.document.file_id);
    const pdfUrl = `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`;
    const response = await generateAIResponse(pdfUrl, 'pdf', chatId);
    await sendAIResponse(bot, chatId, response, loadingMsg.message_id);
  } catch (error) {
    console.error('PDF processing error:', error);
    if (loadingMsg) {
      await bot.deleteMessage(chatId, loadingMsg.message_id);
    }
    if (ErrorHandler.isOpenAIError(error)) {
      clearConversation(chatId);
      await ErrorHandler.handleOpenAIError(bot, chatId, error);
    } else {
      await showErrorMessage(bot, chatId);
    }
  }
}

async function handleHeyKatsMessage(bot, msg) {
  const chatId = msg.chat.id;
  const question = msg.text.substring(8).trim(); // Remove "Hey Kats"
  
  if (!question) {
    await bot.sendMessage(chatId, 'How can I help you today?');
    return;
  }
  
  const loadingMsg = await bot.sendMessage(chatId, '🦴 Courage fetching...');
  
  try {
    const response = await generateAIResponse(question, 'chat', chatId);
    await sendAIResponse(bot, chatId, response, loadingMsg.message_id);
  } catch (error) {
    console.error('Chat processing error:', error);
    if (loadingMsg) {
      await bot.deleteMessage(chatId, loadingMsg.message_id);
    }
    if (ErrorHandler.isOpenAIError(error)) {
      clearConversation(chatId);
      await ErrorHandler.handleOpenAIError(bot, chatId, error);
    } else {
      await showErrorMessage(bot, chatId);
    }
  }
}

async function handleUserInput(bot, chatId, input, state) {
  const loadingMsg = await bot.sendMessage(chatId, '🦴 Courage fetching...');
  
  try {
    let response;
    switch (state) {
      case 'WAITING_MEME_INPUT':
        response = await generateAIResponse(input, 'memeCapital', chatId);
        break;
      case 'WAITING_INVESTMENT_INPUT':
        response = await generateAIResponse(input, 'investment', chatId);
        break;
      case 'WAITING_LOAN_ANALYSIS_CONFIRMATION':
        if (input.toLowerCase() === 'yes') {
          const userData = UserState.getUserData(chatId);
          if (userData?.pendingLoans) {
            const prompt = `Analyze these loans: ${JSON.stringify(userData.pendingLoans)}`;
            response = await generateAIResponse(prompt, 'investment', chatId);
          } else {
            response = 'No loan data available for analysis. Please fetch loans first.';
          }
        } else {
          response = 'Loan analysis cancelled.';
        }
        break;
      default:
        response = await generateAIResponse(input, 'chat', chatId);
    }

    await sendAIResponse(bot, chatId, response, loadingMsg.message_id);
  } catch (error) {
    console.error('AI processing error:', error);
    if (loadingMsg) {
      await bot.deleteMessage(chatId, loadingMsg.message_id);
    }
    if (ErrorHandler.isOpenAIError(error)) {
      clearConversation(chatId);
      await ErrorHandler.handleOpenAIError(bot, chatId, error);
    } else {
      await showErrorMessage(bot, chatId);
    }
  }
}

async function sendAIResponse(bot, chatId, response, loadingMsgId = null) {
  if (loadingMsgId) {
    await bot.deleteMessage(chatId, loadingMsgId);
  }

  const keyboard = {
    inline_keyboard: [
      [
        { text: '🔄 Ask Another Question', callback_data: 'continue_chat' },
        { text: '↩️ Back to Menu', callback_data: 'back_to_menu' }
      ]
    ]
  };

  await bot.sendMessage(chatId, response, {
    parse_mode: 'Markdown',
    disable_web_page_preview: true,
    reply_markup: keyboard
  });
}

async function showErrorMessage(bot, chatId) {
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
    '❌ An error occurred. Please try again.',
    { reply_markup: keyboard }
  );
}

async function handleRetry(bot, chatId, state) {
  switch (state) {
    case 'WAITING_MEME_INPUT':
      await bot.sendMessage(chatId, 'What meme would you like me to analyze?');
      break;
    case 'WAITING_INVESTMENT_INPUT':
      await bot.sendMessage(chatId, 'What investment would you like advice about?');
      break;
    case 'WAITING_LOAN_ANALYSIS_CONFIRMATION':
      await bot.sendMessage(chatId, 'Would you like me to analyze these loans?');
      break;
    default:
      await bot.sendMessage(chatId, 'Please try your request again.');
  }
}

export function setupMessageHandler(bot) {
  bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const state = UserState.getState(chatId);

    try {
      // Handle voice messages
      if (msg.voice) {
        await handleVoiceMessage(bot, msg);
        return;
      }

      // Handle photos
      if (msg.photo) {
        await handlePhotoMessage(bot, msg);
        return;
      }

      // Handle documents (PDF)
      if (msg.document && msg.document.mime_type === 'application/pdf') {
        await handlePdfMessage(bot, msg);
        return;
      }

      // Handle "Hey Kats" messages
      if (msg.text && msg.text.toLowerCase().startsWith('hey kats')) {
        await handleHeyKatsMessage(bot, msg);
        return;
      }

      // Skip processing for menu navigation commands
      if (msg.text && (
        msg.text.startsWith('/') ||
        msg.text.includes('Switch Network') ||
        msg.text.includes('Rug Report') ||
        msg.text.includes('Trending Tokens') ||
        msg.text.includes('Scan Token') ||
        msg.text.includes('Wallets') ||
        msg.text.includes('Pump.fun') ||
        msg.text.includes('Settings') ||
        msg.text.includes('Help') ||
        msg.text.includes('Back to Menu')
      )) {
        return;
      }

      // Handle text messages based on state
      if (msg.text && state) {
        await handleUserInput(bot, chatId, msg.text, state);
      }
    } catch (error) {
      console.error('Message handling error:', error);
      if (ErrorHandler.isOpenAIError(error)) {
        clearConversation(chatId);
        await ErrorHandler.handleOpenAIError(bot, chatId, error);
      } else {
        await showErrorMessage(bot, chatId);
      }
      UserState.clearUserState(chatId);
    }
  });

  // Handle callback queries
  bot.on('callback_query', async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const action = callbackQuery.data;

    try {
      if (action === 'continue_chat') {
        await bot.sendMessage(chatId, 'Please continue with your question or request.');
      } else if (action === 'back_to_menu') {
        clearConversation(chatId);
        UserState.clearUserState(chatId);
      } else if (action === 'retry_action') {
        const state = UserState.getState(chatId);
        if (state) {
          await handleRetry(bot, chatId, state);
        }
      }
    } catch (error) {
      console.error('Callback handling error:', error);
      await showErrorMessage(bot, chatId);
    }

    await bot.answerCallbackQuery(callbackQuery.id);
  });
}