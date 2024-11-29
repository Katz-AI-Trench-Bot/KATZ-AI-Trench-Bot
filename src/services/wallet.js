import { ethers } from 'ethers';
import { Keypair } from '@solana/web3.js';
import * as bip39 from 'bip39';
import HDKey from 'hdkey';
import { UserState } from '../utils/userState.js';
import { networkState } from '../services/networkState.js';
import { fetchEVMTokenMetadata, fetchSolanaTokenMetadata } from './tokens.js';

class WalletService {
  constructor() {
    this.wallets = new Map();
  }

  async createWallet(userId, network) {
    try {
      let wallet;
      let mnemonic;
      let address;
      let privateKey;

      if (network === 'solana') {
        // Generate Solana wallet
        mnemonic = bip39.generateMnemonic();
        const seed = await bip39.mnemonicToSeed(mnemonic);
        const hdkey = HDKey.fromMasterSeed(seed);
        const childKey = hdkey.derive("m/44'/501'/0'/0'");
        wallet = Keypair.fromSeed(childKey.privateKey);
        address = wallet.publicKey.toString();
        privateKey = Buffer.from(wallet.secretKey).toString('hex');
      } else {
        // Generate EVM wallet (Ethereum/Base)
        wallet = ethers.Wallet.createRandom();
        mnemonic = wallet.mnemonic.phrase;
        address = wallet.address;
        privateKey = wallet.privateKey;
      }

      const walletInfo = {
        network,
        address,
        createdAt: new Date().toISOString()
      };

      if (!this.wallets.has(userId)) {
        this.wallets.set(userId, []);
      }
      
      this.wallets.get(userId).push(walletInfo);
      
      // Return sensitive info only once
      return {
        address,
        privateKey,
        mnemonic,
        network
      };
    } catch (error) {
      console.error('Error creating wallet:', error);
      throw error;
    }
  }

  async getWalletTokens(userId, address) {
    const wallet = this.getWallet(userId, address);
    if (!wallet) {
      throw new Error('Wallet not found');
    }

    try {
      if (wallet.network === 'solana') {
        return await fetchSolanaTokenMetadata(address);
      } else {
        return await fetchEVMTokenMetadata(wallet.network, address);
      }
    } catch (error) {
      console.error('Error fetching wallet tokens:', error);
      throw error;
    }
  }

  getWallets(userId) {
    return this.wallets.get(userId) || [];
  }

  getWallet(userId, address) {
    const wallets = this.getWallets(userId);
    return wallets.find(w => w.address.toLowerCase() === address.toLowerCase());
  }

  setActiveWallet(userId, address) {
    const wallet = this.getWallet(userId, address);
    if (wallet) {
      UserState.setUserData(userId, { activeWallet: address });
      return true;
    }
    return false;
  }

  getActiveWallet(userId) {
    const userData = UserState.getUserData(userId);
    if (userData?.activeWallet) {
      return this.getWallet(userId, userData.activeWallet);
    }
    return null;
  }
}

export const walletService = new WalletService();