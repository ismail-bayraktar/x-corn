import mongoose, { Schema, Model } from 'mongoose';
import { BotLog, LogLevel } from '@/lib/bot/types';

const LogSchema = new Schema<BotLog>({
  id: { type: String, required: true, unique: true },
  accountName: { type: String, required: true },
  level: { type: String, required: true, enum: ['info', 'success', 'error', 'warning'] },
  message: { type: String, required: true },
  timestamp: { type: String, required: true },
  accountColor: { type: String, required: true },
});

// Index for faster queries
LogSchema.index({ timestamp: -1 });

const Log: Model<BotLog> =
  mongoose.models.Log || mongoose.model<BotLog>('Log', LogSchema);

export default Log;
