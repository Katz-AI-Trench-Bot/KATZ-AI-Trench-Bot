import dotenv from 'dotenv';
import { validateConfig } from './utils/validation.js';

dotenv.config();

export const config = {
  botToken: process.env.BOT_TOKEN,
  openaiApiKey: process.env.OPENAI_API_KEY,
  smartContractAddress: process.env.SMART_CONTRACT_ADDRESS,
  alchemyApiKey: 'ip7ONCr6sDycSojM_PZoWawrVM_2c0RW',
  solanaApiKey: 'ip7ONCr6sDycSojM_PZoWawrVM_2c0RW',
  networks: {
    ethereum: {
      name: 'Ethereum',
      rpcUrl: process.env.ETHEREUM_RPC_URL,
      chainId: 1
    },
    base: {
      name: 'Base',
      rpcUrl: process.env.BASE_RPC_URL,
      chainId: 8453
    },
    solana: {
      name: 'Solana',
      rpcUrl: 'https://api.mainnet-beta.solana.com'
    }
  }
};

validateConfig(config);