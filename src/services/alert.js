import { dextools } from './dextools/index.js';
import { googleService } from './google.js';
import { networkState } from './networkState.js';

class AlertService {
  constructor() {
    this.alerts = new Map();
    this.events = new Map();
    this.checkInterval = 15 * 60 * 1000; // 15 minutes
    this.startPriceChecks();
  }

  async createPriceAlert(userId, { tokenAddress, targetPrice }) {
    const network = networkState.getCurrentNetwork(userId);
    const tokenInfo = await dextools.getTokenInfo(network, tokenAddress);

    const alert = {
      id: `price_${Date.now()}`,
      userId,
      network,
      tokenAddress,
      tokenSymbol: tokenInfo.symbol,
      targetPrice,
      createdAt: new Date()
    };

    if (!this.alerts.has(userId)) {
      this.alerts.set(userId, []);
    }
    this.alerts.get(userId).push(alert);

    return alert;
  }

  async createEvent(userId, { name, datetime, description }) {
    const event = {
      id: `event_${Date.now()}`,
      userId,
      name,
      datetime: new Date(datetime),
      description,
      createdAt: new Date()
    };

    if (!this.events.has(userId)) {
      this.events.set(userId, []);
    }
    this.events.get(userId).push(event);

    // If Google Calendar is connected, sync event
    const googleAuth = await googleService.getAuth(userId);
    if (googleAuth) {
      await googleService.createCalendarEvent(googleAuth, event);
    }

    return event;
  }

  getPriceAlerts(userId) {
    return this.alerts.get(userId) || [];
  }

  getEvents(userId) {
    return this.events.get(userId) || [];
  }

  deleteAlert(userId, alertId) {
    if (this.alerts.has(userId)) {
      this.alerts.set(
        userId,
        this.alerts.get(userId).filter(a => a.id !== alertId)
      );
    }
  }

  deleteEvent(userId, eventId) {
    if (this.events.has(userId)) {
      this.events.set(
        userId,
        this.events.get(userId).filter(e => e.id !== eventId)
      );
    }
  }

  startPriceChecks() {
    setInterval(async () => {
      for (const [userId, userAlerts] of this.alerts) {
        for (const alert of userAlerts) {
          try {
            const price = await dextools.getTokenPrice(
              alert.network,
              alert.tokenAddress
            );

            if (price >= alert.targetPrice) {
              this.notifyUser(userId, alert, price);
              this.deleteAlert(userId, alert.id);
            }
          } catch (error) {
            console.error('Error checking price alert:', error);
          }
        }
      }
    }, this.checkInterval);
  }

  async notifyUser(userId, alert, currentPrice) {
    // Implementation will be added when we integrate with the bot
    console.log(`Alert triggered for user ${userId}:`, alert);
  }
}

export const alertService = new AlertService();