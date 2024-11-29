import axios from 'axios';
import PQueue from 'p-queue';
import pRetry from 'p-retry';

const DEXTOOLS_API_KEY = 'QA2MWclN829VYyqBuCNmg5ei4vqnxtyAaHaOOzch';
const BASE_URL = 'https://public-api.dextools.io/trial/v2';

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'accept': 'application/json',
    'x-api-key': DEXTOOLS_API_KEY
  }
});

// Create queue for rate limiting - 1 request per 2 seconds
const requestQueue = new PQueue({
  concurrency: 1,
  interval: 2000,
  intervalCap: 1
});

// Helper function to make API calls with retries and rate limiting
export async function makeRequest(endpoint, params = {}) {
  return requestQueue.add(() => 
    pRetry(
      async () => {
        const response = await axiosInstance.get(endpoint, { params });
        return response.data;
      },
      {
        retries: 3,
        minTimeout: 2000,
        onFailedAttempt: error => {
          console.log(`Request to ${endpoint} failed, retrying...`, error.message);
        }
      }
    )
  );
}