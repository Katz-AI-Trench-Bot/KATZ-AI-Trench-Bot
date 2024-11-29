import { google } from 'googleapis';
import { config } from '../config.js';

class GoogleService {
  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      config.googleClientId,
      config.googleClientSecret,
      config.googleRedirectUri
    );
    
    this.SCOPES = [
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/calendar.readonly'
    ];
    
    this.tokens = new Map();
  }

  async getAuthUrl(userId) {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: this.SCOPES,
      state: userId.toString()
    });
  }

  async handleCallback(code, userId) {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      this.tokens.set(userId, tokens);
      return true;
    } catch (error) {
      console.error('Error getting Google tokens:', error);
      return false;
    }
  }

  async getAuth(userId) {
    const tokens = this.tokens.get(userId);
    if (!tokens) return null;

    const oauth2Client = new google.auth.OAuth2(
      config.googleClientId,
      config.googleClientSecret,
      config.googleRedirectUri
    );
    
    oauth2Client.setCredentials(tokens);
    return oauth2Client;
  }

  async createCalendarEvent(auth, event) {
    const calendar = google.calendar({ version: 'v3', auth });
    
    const calendarEvent = {
      summary: event.name,
      description: event.description,
      start: {
        dateTime: event.datetime.toISOString(),
        timeZone: 'UTC'
      },
      end: {
        dateTime: new Date(event.datetime.getTime() + 60*60*1000).toISOString(),
        timeZone: 'UTC'
      }
    };

    try {
      const response = await calendar.events.insert({
        calendarId: 'primary',
        resource: calendarEvent
      });
      return response.data;
    } catch (error) {
      console.error('Error creating calendar event:', error);
      throw error;
    }
  }
}

export const googleService = new GoogleService();