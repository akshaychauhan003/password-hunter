import mongoose from 'mongoose';

declare global {
  var _mongooseConn: typeof mongoose | null;
}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/password_hunter';

if (!MONGODB_URI) throw new Error('MONGODB_URI environment variable not set');

let cached = global._mongooseConn;

export async function connectDB(): Promise<typeof mongoose> {
  if (cached) return cached;
  cached = await mongoose.connect(MONGODB_URI, {
    bufferCommands: false,
    serverSelectionTimeoutMS: 5000,
  });
  global._mongooseConn = cached;
  return cached;
}

// ── Schemas ────────────────────────────────────────────────────

const HistorySchema = new mongoose.Schema({
  userId:              { type: String, default: 'anonymous' },
  target:              { type: String, required: true },
  maskedTarget:        { type: String, required: true },
  dateTime:            { type: Date, default: Date.now },
  totalAttempts:       { type: Number, required: true },
  timeTakenMs:         { type: Number, required: true },
  modeUsed:            { type: String, required: true },
  discoveryMode:       { type: String, default: 'open' },
  eyeState:            { type: String, default: 'open' },
  difficultyLabel:     { type: String, required: true },
  difficultyScore:     { type: Number, default: 0 },
  estimatedCrackTime:  { type: String, default: '' },
  charLength:          { type: Number, required: true },
  charsetSize:         { type: Number, default: 26 },
  entropy:             { type: Number, default: 0 },
}, { timestamps: true });

HistorySchema.index({ userId: 1, dateTime: -1 });
HistorySchema.index({ difficultyLabel: 1 });

export const HistoryModel =
  mongoose.models.History || mongoose.model('History', HistorySchema);

const UserSchema = new mongoose.Schema({
  email:        { type: String, required: true, unique: true, lowercase: true },
  username:     { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  createdAt:    { type: Date, default: Date.now },
});

export const UserModel =
  mongoose.models.User || mongoose.model('User', UserSchema);
