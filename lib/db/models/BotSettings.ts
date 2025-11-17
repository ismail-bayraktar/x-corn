import mongoose, { Schema, Model } from 'mongoose';

export interface BotSettings {
  id: string;
  autoDistribution: {
    enabled: boolean;
    likePercentage: number;
    retweetPercentage: number;
    commentPercentage: number;
  };
  createdAt: string;
  updatedAt: string;
}

const BotSettingsSchema = new Schema<BotSettings>({
  id: { type: String, required: true, unique: true },
  autoDistribution: {
    enabled: { type: Boolean, required: true, default: false },
    likePercentage: { type: Number, required: true, default: 100, min: 0, max: 100 },
    retweetPercentage: { type: Number, required: true, default: 30, min: 0, max: 100 },
    commentPercentage: { type: Number, required: true, default: 35, min: 0, max: 100 },
  },
  createdAt: { type: String, required: true },
  updatedAt: { type: String, required: true },
});

const BotSettingsModel: Model<BotSettings> =
  mongoose.models.BotSettings || mongoose.model<BotSettings>('BotSettings', BotSettingsSchema);

export default BotSettingsModel;
