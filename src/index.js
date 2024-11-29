import dotenv from 'dotenv';
dotenv.config();

import { bot } from './bot.js';
import { setupCommands } from './commands/index.js';
import { setupEventHandlers } from './events/index.js';
import { config } from './config.js';
import { pumpFunService } from './services/pumpfun.js';

async function startBot() {
  try {
    console.log('Starting Telegram bot...');
    
    // Initialize services
    pumpFunService.connect();
    
    // Setup command handlers
    setupCommands(bot);
    
    // Setup event handlers
    setupEventHandlers(bot);
    
    console.log('Bot is running...');
  } catch (error) {
    console.error('Error starting bot:', error);
    process.exit(1);
  }
}

startBot();

// Handle cleanup on exit
process.on('SIGINT', () => {
  console.log('Shutting down bot...');
  pumpFunService.disconnect();
  process.exit(0);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
});