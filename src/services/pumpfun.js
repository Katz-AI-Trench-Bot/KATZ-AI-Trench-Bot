import WebSocket from 'ws';
import { VersionedTransaction } from '@solana/web3.js';
import fetch from 'node-fetch';

class PumpFunService {
  constructor() {
    this.ws = null;
    this.subscribers = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.isConnecting = false;
  }

  async connect() {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
      return;
    }

    this.isConnecting = true;

    try {
      this.ws = new WebSocket('wss://pumpportal.fun/api/data');

      this.ws.on('open', () => {
        console.log('Connected to PumpFun WebSocket');
        this.reconnectAttempts = 0;
        this.isConnecting = false;
        this.subscribeToNewTokens();
      });

      this.ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      });

      this.ws.on('error', (error) => {
        console.error('PumpFun WebSocket error:', error);
        this.isConnecting = false;
      });

      this.ws.on('close', () => {
        console.log('PumpFun WebSocket closed');
        this.isConnecting = false;
        this.handleReconnect();
      });
    } catch (error) {
      console.error('Error connecting to PumpFun:', error);
      this.isConnecting = false;
      this.handleReconnect();
    }
  }

  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      console.log(`Reconnecting in ${delay}ms... (attempt ${this.reconnectAttempts})`);
      setTimeout(() => this.connect(), delay);
    } else {
      console.error('Max reconnection attempts reached');
      throw new Error('Failed to connect to PumpFun service');
    }
  }

  subscribeToNewTokens() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    const payload = {
      method: "subscribeNewToken"
    };
    
    this.ws.send(JSON.stringify(payload));
  }

  subscribe(type, callback) {
    if (!this.subscribers.has(type)) {
      this.subscribers.set(type, new Set());
    }
    this.subscribers.get(type).add(callback);
  }

  unsubscribe(type, callback) {
    if (this.subscribers.has(type)) {
      this.subscribers.get(type).delete(callback);
    }
  }

  handleMessage(message) {
    if (message.type === 'newToken') {
      this.notifySubscribers('newToken', message.data);
    }
  }

  notifySubscribers(type, data) {
    if (this.subscribers.has(type)) {
      this.subscribers.get(type).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in subscriber callback:', error);
        }
      });
    }
  }

  async fetchLatestTokens() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      await this.connect();
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout waiting for PumpFun data'));
      }, 10000);

      this.subscribe('newToken', (data) => {
        clearTimeout(timeout);
        resolve(data);
      });
    });
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.subscribers.clear();
    this.isConnecting = false;
  }
}

export const pumpFunService = new PumpFunService();