import TelegramBot from 'node-telegram-bot-api';
import { config } from './config.js';

export const bot = new TelegramBot(config.botToken, { polling: true });