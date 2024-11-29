import { ethers } from 'ethers';
import { config } from '../config.js';
import { UserState } from '../utils/userState.js';

const contractABI = [
  "function fetchLoans() view returns (tuple(address collateralToken, uint256 collateralAmount, address loanToken, uint256 loanAmount, uint256 repayAmountOffered, uint256 durationDays)[])"
];

export class BlockchainService {
  constructor() {
    this.providers = {
      ethereum: new ethers.JsonRpcProvider(config.networks.ethereum.rpcUrl),
      base: new ethers.JsonRpcProvider(config.networks.base.rpcUrl)
    };
    
    this.contracts = {
      ethereum: new ethers.Contract(
        config.smartContractAddress,
        contractABI,
        this.providers.ethereum
      ),
      base: new ethers.Contract(
        config.smartContractAddress,
        contractABI,
        this.providers.base
      )
    };
  }

  async fetchLoans(userId) {
    try {
      const userData = UserState.getUserData(userId);
      const network = userData?.network || 'ethereum';
      
      const loans = await this.contracts[network].fetchLoans();
      return {
        network,
        loans: loans.map(loan => ({
          collateralToken: loan.collateralToken,
          collateralAmount: ethers.formatEther(loan.collateralAmount),
          loanToken: loan.loanToken,
          loanAmount: ethers.formatEther(loan.loanAmount),
          repayAmountOffered: ethers.formatEther(loan.repayAmountOffered),
          durationDays: Number(loan.durationDays)
        }))
      };
    } catch (error) {
      console.error('Error fetching loans:', error);
      throw error;
    }
  }

  getNetworks() {
    return Object.keys(config.networks).map(key => ({
      id: key,
      name: config.networks[key].name
    }));
  }

  getCurrentNetwork(userId) {
    const userData = UserState.getUserData(userId);
    return userData?.network || 'ethereum';
  }
}