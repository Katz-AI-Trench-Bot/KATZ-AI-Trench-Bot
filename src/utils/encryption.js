import CryptoJS from 'crypto-js';
import { config } from '../config.js';

const ENCRYPTION_KEY = config.encryptionKey;

export function encrypt(text) {
  return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
}

export function decrypt(ciphertext) {
  const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}