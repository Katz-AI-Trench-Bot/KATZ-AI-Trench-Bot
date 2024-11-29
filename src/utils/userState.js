class UserStateManager {
  constructor() {
    this.states = new Map();
    this.userData = new Map();
    this.timeouts = new Map();
    this.messageIds = new Map();
    this.aiRequiredStates = new Set([
      'WAITING_MEME_INPUT',
      'WAITING_INVESTMENT_INPUT',
      'WAITING_LOAN_ANALYSIS_CONFIRMATION',
      'WAITING_SCAN_INPUT',
      'WAITING_REPORT_INPUT',
      'WAITING_PUMP_ACTION',
      'WATCHING_PUMP_TOKENS',
      'WAITING_PRICE_ALERT',
      'WAITING_EVENT_DETAILS',
      'WAITING_TRANSFER_ADDRESS',
      'WAITING_TRANSFER_AMOUNT'
    ]);

    setInterval(() => this.cleanupExpiredStates(), 15 * 60 * 1000);
  }

  setState(userId, state) {
    this.states.set(userId, state);
    const timeout = setTimeout(() => this.clearUserState(userId), 30 * 60 * 1000);
    this.timeouts.set(userId, timeout);
  }

  getState(userId) {
    return this.states.get(userId);
  }

  setUserData(userId, data) {
    const currentData = this.userData.get(userId) || {};
    this.userData.set(userId, { ...currentData, ...data });
  }

  getUserData(userId) {
    return this.userData.get(userId);
  }

  clearUserState(userId) {
    this.states.delete(userId);
    this.messageIds.delete(userId);
    if (this.timeouts.has(userId)) {
      clearTimeout(this.timeouts.get(userId));
      this.timeouts.delete(userId);
    }
  }

  clearPendingData(userId) {
    const userData = this.getUserData(userId);
    if (userData) {
      delete userData.pendingLoans;
      delete userData.pendingNetwork;
      delete userData.pendingTransfer;
      this.setUserData(userId, userData);
    }
  }

  isConfigured(userId) {
    const userData = this.getUserData(userId);
    return !!(userData?.walletAddress);
  }

  isAIRequired(state) {
    return this.aiRequiredStates.has(state);
  }

  trackMessage(userId, messageId) {
    if (!this.messageIds.has(userId)) {
      this.messageIds.set(userId, new Set());
    }
    this.messageIds.get(userId).add(messageId);
  }

  getTrackedMessages(userId) {
    return Array.from(this.messageIds.get(userId) || []);
  }

  cleanupExpiredStates() {
    const now = Date.now();
    for (const [userId, timeout] of this.timeouts.entries()) {
      if (now - timeout > 30 * 60 * 1000) {
        this.clearUserState(userId);
      }
    }
  }

  getMenuState(userId) {
    const state = this.getState(userId);
    return {
      isWaitingForInput: this.aiRequiredStates.has(state),
      currentState: state,
      network: this.getUserData(userId)?.network || 'ethereum'
    };
  }

  setMenuState(userId, menuState) {
    this.setState(userId, menuState);
    if (!this.aiRequiredStates.has(menuState)) {
      this.clearPendingData(userId);
    }
  }
}

export const UserState = new UserStateManager();