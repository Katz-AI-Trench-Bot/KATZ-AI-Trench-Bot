import { setupMessageHandler } from './message.js';
import { setupErrorHandler } from './error.js';

export function setupEventHandlers(bot) {
  setupMessageHandler(bot);
  setupErrorHandler(bot);
}