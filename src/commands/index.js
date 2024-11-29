import { setupStartCommand } from './start.js';
import { setupHelpCommand } from './help.js';
import { setupSettingsCommand } from './settings.js';
import { setupMemeCommand } from './meme.js';
import { setupInvestCommand } from './invest.js';
import { setupLoansCommand } from './loans.js';
import { setupNetworkCommand } from './network.js';
import { setupTrendingCommand } from './trending.js';
import { setupScanCommand } from './scan.js';
import { setupRugReportCommand } from './rugreport.js';
import { setupPumpFunCommand } from './pumpfun.js';
import { setupWalletsCommand } from './wallets.js';
import { setupButlerCommand } from './butler.js';

export function setupCommands(bot) {
  setupStartCommand(bot);
  setupHelpCommand(bot);
  setupSettingsCommand(bot);
  setupMemeCommand(bot);
  setupInvestCommand(bot);
  setupLoansCommand(bot);
  setupNetworkCommand(bot);
  setupTrendingCommand(bot);
  setupScanCommand(bot);
  setupRugReportCommand(bot);
  setupPumpFunCommand(bot);
  setupWalletsCommand(bot);
  setupButlerCommand(bot);
}