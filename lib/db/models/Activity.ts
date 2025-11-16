import mongoose, { Schema, Model } from 'mongoose';

export interface BotActivity {
  id: string;
  tweetUrl: string;
  accountName: string;
  actions: {
    liked: boolean;
    retweeted: boolean;
    commented: boolean;
  };
  timestamp: string;
}

const ActivitySchema = new Schema<BotActivity>({
  id: { type: String, required: true, unique: true },
  tweetUrl: { type: String, required: true },
  accountName: { type: String, required: true },
  actions: {
    liked: { type: Boolean, required: true },
    retweeted: { type: Boolean, required: true },
    commented: { type: Boolean, required: true },
  },
  timestamp: { type: String, required: true },
});

// Index for faster queries
ActivitySchema.index({ timestamp: -1 });
ActivitySchema.index({ accountName: 1 });

const Activity: Model<BotActivity> =
  mongoose.models.Activity || mongoose.model<BotActivity>('Activity', ActivitySchema);

export default Activity;
