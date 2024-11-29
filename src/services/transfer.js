import { ethers } from 'ethers';
import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { config } from '../config.js';
import { walletService } from './wallet.js';
import { networkState } from './networkState.js';

class TransferService {
  constructor() {
    this.providers = {
      ethereum: new ethers.JsonRpcProvider(config.networks.ethereum.rpcUrl),
      base: new ethers.JsonRpcProvider(config.networks.base.rpcUrl),
      solana: new Connection(config.networks.solana.rpcUrl)
    };
  }

  async estimateTransfer(telegramId, {
    fromAddress,
    toAddress,
    tokenAddress,
    amount,
    network
  }) {
    try {
      if (network === 'solana') {
        return await this.estimateSolanaTransfer(fromAddress, toAddress, tokenAddress, amount);
      } else {
        return await this.estimateEVMTransfer(network, fromAddress, toAddress, tokenAddress, amount);
      }
    } catch (error) {
      console.error('Error estimating transfer:', error);
      throw error;
    }
  }

  async executeTransfer(telegramId, {
    fromAddress,
    toAddress,
    tokenAddress,
    amount,
    network
  }) {
    try {
      // Get wallet and decrypt private key
      const wallet = await walletService.getWallet(telegramId, fromAddress);
      if (!wallet) throw new Error('Wallet not found');

      if (network === 'solana') {
        return await this.executeSolanaTransfer(
          wallet.privateKey,
          fromAddress,
          toAddress,
          tokenAddress,
          amount
        );
      } else {
        return await this.executeEVMTransfer(
          network,
          wallet.privateKey,
          fromAddress,
          toAddress,
          tokenAddress,
          amount
        );
      }
    } catch (error) {
      console.error('Error executing transfer:', error);
      throw error;
    }
  }

  private async estimateEVMTransfer(network, fromAddress, toAddress, tokenAddress, amount) {
    const provider = this.providers[network];
    
    try {
      // ERC20 Token Transfer
      if (tokenAddress !== 'native') {
        const tokenContract = new ethers.Contract(
          tokenAddress,
          ['function transfer(address to, uint256 amount)', 'function decimals() view returns (uint8)'],
          provider
        );

        const decimals = await tokenContract.decimals();
        const amountInWei = ethers.parseUnits(amount.toString(), decimals);

        const gasEstimate = await tokenContract.transfer.estimateGas(toAddress, amountInWei);
        const feeData = await provider.getFeeData();

        const gasCost = gasEstimate * feeData.maxFeePerGas;
        
        return {
          estimatedGas: gasEstimate,
          maxFeePerGas: feeData.maxFeePerGas,
          maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
          totalCost: gasCost,
          formattedCost: ethers.formatEther(gasCost)
        };
      }
      
      // Native Token Transfer
      const gasEstimate = 21000; // Standard ETH transfer
      const feeData = await provider.getFeeData();
      const amountInWei = ethers.parseEther(amount.toString());
      const gasCost = gasEstimate * feeData.maxFeePerGas;

      return {
        estimatedGas: gasEstimate,
        maxFeePerGas: feeData.maxFeePerGas,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
        totalCost: gasCost,
        formattedCost: ethers.formatEther(gasCost),
        value: amountInWei
      };
    } catch (error) {
      console.error('Error estimating EVM transfer:', error);
      throw error;
    }
  }

  private async estimateSolanaTransfer(fromAddress, toAddress, tokenAddress, amount) {
    const connection = this.providers.solana;
    
    try {
      // SPL Token Transfer
      if (tokenAddress !== 'native') {
        const mint = new PublicKey(tokenAddress);
        const fromPubkey = new PublicKey(fromAddress);
        const toPubkey = new PublicKey(toAddress);

        const fromTokenAccount = await Token.getAssociatedTokenAddress(
          TOKEN_PROGRAM_ID,
          mint,
          fromPubkey
        );

        const toTokenAccount = await Token.getAssociatedTokenAddress(
          TOKEN_PROGRAM_ID,
          mint,
          toPubkey
        );

        const transaction = new Transaction().add(
          Token.createTransferInstruction(
            TOKEN_PROGRAM_ID,
            fromTokenAccount,
            toTokenAccount,
            fromPubkey,
            [],
            amount
          )
        );

        const fee = await connection.getFeeForMessage(
          transaction.compileMessage(),
          'confirmed'
        );

        return {
          estimatedFee: fee,
          formattedFee: `${fee / 1e9} SOL`
        };
      }
      
      // Native SOL Transfer
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: new PublicKey(fromAddress),
          toPubkey: new PublicKey(toAddress),
          lamports: amount * 1e9
        })
      );

      const fee = await connection.getFeeForMessage(
        transaction.compileMessage(),
        'confirmed'
      );

      return {
        estimatedFee: fee,
        formattedFee: `${fee / 1e9} SOL`
      };
    } catch (error) {
      console.error('Error estimating Solana transfer:', error);
      throw error;
    }
  }

  private async executeEVMTransfer(network, privateKey, fromAddress, toAddress, tokenAddress, amount) {
    const provider = this.providers[network];
    const wallet = new ethers.Wallet(privateKey, provider);
    
    try {
      // ERC20 Token Transfer
      if (tokenAddress !== 'native') {
        const tokenContract = new ethers.Contract(
          tokenAddress,
          ['function transfer(address to, uint256 amount)', 'function decimals() view returns (uint8)'],
          wallet
        );

        const decimals = await tokenContract.decimals();
        const amountInWei = ethers.parseUnits(amount.toString(), decimals);

        const tx = await tokenContract.transfer(toAddress, amountInWei);
        const receipt = await tx.wait();

        return {
          hash: receipt.hash,
          blockNumber: receipt.blockNumber,
          from: receipt.from,
          to: toAddress,
          success: true
        };
      }
      
      // Native Token Transfer
      const tx = await wallet.sendTransaction({
        to: toAddress,
        value: ethers.parseEther(amount.toString())
      });
      
      const receipt = await tx.wait();

      return {
        hash: receipt.hash,
        blockNumber: receipt.blockNumber,
        from: receipt.from,
        to: toAddress,
        success: true
      };
    } catch (error) {
      console.error('Error executing EVM transfer:', error);
      throw error;
    }
  }

  private async executeSolanaTransfer(privateKey, fromAddress, toAddress, tokenAddress, amount) {
    const connection = this.providers.solana;
    
    try {
      const fromKeypair = Keypair.fromSecretKey(Buffer.from(privateKey, 'hex'));
      
      // SPL Token Transfer
      if (tokenAddress !== 'native') {
        const mint = new PublicKey(tokenAddress);
        const fromPubkey = new PublicKey(fromAddress);
        const toPubkey = new PublicKey(toAddress);

        const fromTokenAccount = await Token.getAssociatedTokenAddress(
          TOKEN_PROGRAM_ID,
          mint,
          fromPubkey
        );

        const toTokenAccount = await Token.getAssociatedTokenAddress(
          TOKEN_PROGRAM_ID,
          mint,
          toPubkey
        );

        const transaction = new Transaction().add(
          Token.createTransferInstruction(
            TOKEN_PROGRAM_ID,
            fromTokenAccount,
            toTokenAccount,
            fromPubkey,
            [],
            amount
          )
        );

        const signature = await connection.sendTransaction(
          transaction,
          [fromKeypair]
        );
        
        const confirmation = await connection.confirmTransaction(signature);

        return {
          signature,
          slot: confirmation.context.slot,
          success: true
        };
      }
      
      // Native SOL Transfer
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: fromKeypair.publicKey,
          toPubkey: new PublicKey(toAddress),
          lamports: amount * 1e9
        })
      );

      const signature = await connection.sendTransaction(
        transaction,
        [fromKeypair]
      );
      
      const confirmation = await connection.confirmTransaction(signature);

      return {
        signature,
        slot: confirmation.context.slot,
        success: true
      };
    } catch (error) {
      console.error('Error executing Solana transfer:', error);
      throw error;
    }
  }
}

export const transferService = new TransferService();