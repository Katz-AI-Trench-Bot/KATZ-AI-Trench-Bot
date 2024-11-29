import { Alchemy, Network as AlchemyNetwork } from 'alchemy-sdk';
import axios from 'axios';
import { config } from '../config.js';

const ALCHEMY_API_KEY = config.alchemyApiKey;

const alchemyNetworkMap = {
  ethereum: AlchemyNetwork.ETH_MAINNET,
  base: AlchemyNetwork.BASE_MAINNET
};

function getAlchemySettings(network) {
  const alchemyNetwork = alchemyNetworkMap[network];
  if (!alchemyNetwork) {
    throw new Error(`Unsupported network: ${network}`);
  }
  return {
    apiKey: ALCHEMY_API_KEY,
    network: alchemyNetwork
  };
}

export async function fetchEVMTokenMetadata(network, address) {
  try {
    const alchemy = new Alchemy(getAlchemySettings(network));
    const balances = await alchemy.core.getTokenBalances(address);
    
    const tokens = await Promise.all(
      balances.tokenBalances.map(async (token) => {
        const metadata = await alchemy.core.getTokenMetadata(token.contractAddress);
        return {
          name: metadata.name || 'Unknown',
          symbol: metadata.symbol || 'Unknown',
          address: token.contractAddress,
          balance: token.tokenBalance,
          decimals: metadata.decimals || 18,
          logo: metadata.logo
        };
      })
    );

    return tokens;
  } catch (error) {
    console.error('Error fetching EVM tokens:', error);
    throw error;
  }
}

export async function fetchSolanaTokenMetadata(address, apiKey) {
  try {
    const response = await axios.post(
      `https://solana-mainnet.g.alchemy.com/v2/${apiKey}`,
      {
        jsonrpc: '2.0',
        id: 1,
        method: 'getTokenAccountsByOwner',
        params: [
          address,
          { programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    const tokens = await Promise.all(
      response.data.result.value.map(async (account) => {
        const tokenData = await getTokenMetadata(account.account.data.parsed.info.mint, apiKey);
        return {
          name: tokenData.name || 'Unknown',
          symbol: tokenData.symbol || 'Unknown',
          address: account.account.data.parsed.info.mint,
          balance: account.account.data.parsed.info.tokenAmount.amount,
          decimals: account.account.data.parsed.info.tokenAmount.decimals,
          logo: tokenData.logo
        };
      })
    );

    return tokens;
  } catch (error) {
    console.error('Error fetching Solana tokens:', error);
    throw error;
  }
}

async function getTokenMetadata(mintAddress, apiKey) {
  try {
    const response = await axios.post(
      `https://solana-mainnet.g.alchemy.com/v2/${apiKey}`,
      {
        jsonrpc: '2.0',
        id: 1,
        method: 'getTokenMetadata',
        params: [mintAddress]
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.result || {};
  } catch (error) {
    console.error('Error fetching token metadata:', error);
    return {};
  }
}