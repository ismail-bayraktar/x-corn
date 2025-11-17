import mongoose, { Schema, Model } from 'mongoose';
import { TwitterAccount, TwitterCookie } from '@/lib/bot/types';

const CookieSchema = new Schema<TwitterCookie>({
  name: { type: String, required: true },
  value: { type: String, required: true },
  domain: { type: String },
  path: { type: String },
  httpOnly: { type: Boolean },
  secure: { type: Boolean },
});

const AccountSchema = new Schema<TwitterAccount>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  canComment: { type: Boolean, required: true, default: false },
  canLike: { type: Boolean, required: true, default: true },
  canRetweet: { type: Boolean, required: true, default: true },
  useAI: { type: Boolean, required: true, default: false },
  commentStyle: {
    type: String,
    required: true,
    default: 'professional',
    enum: ['professional', 'friendly', 'humorous', 'informative', 'supportive']
  },
  enabled: { type: Boolean, required: true, default: true },
  cookies: { type: [CookieSchema], required: true },
  createdAt: { type: String, required: true },
  updatedAt: { type: String, required: true },
  validated: { type: Boolean },
  lastValidated: { type: String },
});

const Account: Model<TwitterAccount> =
  mongoose.models.Account || mongoose.model<TwitterAccount>('Account', AccountSchema);

export default Account;
