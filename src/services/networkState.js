import { UserState } from '../utils/userState.js';
import { config } from '../config.js';

class NetworkStateManager {
  constructor() {
    this.defaultNetwork = 'ethereum';
    this.networks = Object.keys(config.networks);
  }

  getCurrentNetwork(userId) {
    const userData = UserState.getUserData(userId);
    return userData?.network || this.defaultNetwork;
  }

  setCurrentNetwork(userId, network) {
    if (!this.networks.includes(network)) {
      throw new Error(`Invalid network: ${network}`);
    }
    UserState.setUserData(userId, { network });
  }

  getNetworkDisplay(network) {
    const networkMap = {
      ethereum: 'Ethereum',
      base: 'Base',
      solana: 'Solana'
    };
    return networkMap[network] || network;
  }

  async createSwitchNetworkButton(bot, chatId, currentMessage = '') {
    const keyboard = {
      inline_keyboard: [
        [{ text: '🔄 Switch Network', callback_data: 'switch_network' }]
      ]
    };

    if (currentMessage) {
      return bot.sendMessage(chatId, 
        `${currentMessage}\n\n_Load data from another chain:_`, 
        { 
          parse_mode: 'Markdown',
          reply_markup: keyboard 
        }
      );
    }
    return keyboard;
  }
}

export const networkState = new NetworkStateManager();