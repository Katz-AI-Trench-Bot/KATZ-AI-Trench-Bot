import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  telegramId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  username: String,
  firstName: String,
  lastName: String,
  registeredAt: {
    type: Date,
    default: Date.now
  },
  wallets: {
    ethereum: [{
      address: String,
      encryptedPrivateKey: String,
      createdAt: Date
    }],
    base: [{
      address: String,
      encryptedPrivateKey: String,
      createdAt: Date
    }],
    solana: [{
      address: String,
      encryptedPrivateKey: String,
      createdAt: Date
    }]
  },
  settings: {
    defaultNetwork: {
      type: String,
      enum: ['ethereum', 'base', 'solana'],
      default: 'ethereum'
    }
  }
});

// indexes after schema definition
UserSchema.index({ telegramId: 1 });
UserSchema.index({ 'wallets.ethereum.address': 1 });
UserSchema.index({ 'wallets.base.address': 1 });
UserSchema.index({ 'wallets.solana.address': 1 });

export const User = mongoose.model('User', UserSchema);