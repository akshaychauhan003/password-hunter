import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  addMemHistoryItem,
  queryMemHistory,
  type MemoryHistoryItem,
} from '@/lib/historyStore';

const HistorySchema = z.object({
  target:             z.string().min(1).max(100),
  maskedTarget:       z.string(),
  totalAttempts:      z.number().int().nonnegative(),
  timeTakenMs:        z.number().nonnegative(),
  modeUsed:           z.string(),
  difficultyLabel:    z.string(),
  difficultyScore:    z.number(),
  estimatedCrackTime: z.string(),
  charLength:         z.number().int(),
  charsetSize:        z.number().int(),
  entropy:            z.number(),
});

async function tryMongoDB() {
  try {
    const { connectDB, HistoryModel } = await import('@/lib/mongodb');
    await connectDB();
    return HistoryModel;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page       = Math.max(1, parseInt(searchParams.get('page')  || '1'));
  const limit      = Math.min(50, parseInt(searchParams.get('limit') || '20'));
  const search     = searchParams.get('search')     || '';
  const difficulty = searchParams.get('difficulty') || '';

  const Model = await tryMongoDB();
  if (Model) {
    try {
      const query: Record<string, unknown> = { userId: 'anonymous' };
      if (search)     query.maskedTarget    = { $regex: search, $options: 'i' };
      if (difficulty) query.difficultyLabel = difficulty;

      const [items, total] = await Promise.all([
        Model.find(query).sort({ dateTime: -1 }).skip((page - 1) * limit).limit(limit).lean(),
        Model.countDocuments(query),
      ]);
      return NextResponse.json({ success: true, data: { items, total, page, limit } });
    } catch { /* fall through */ }
  }

  const data = queryMemHistory({ search, difficulty, page, limit });
  return NextResponse.json({ success: true, data });
}

export async function POST(req: NextRequest) {
  try {
    const body   = await req.json();
    const parsed = HistorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid data' }, { status: 400 });
    }

    const data = parsed.data;

    const Model = await tryMongoDB();
    if (Model) {
      try {
        const doc = await Model.create({ ...data, userId: 'anonymous', dateTime: new Date() });
        return NextResponse.json({ success: true, data: doc }, { status: 201 });
      } catch { /* fall through */ }
    }

    const item = addMemHistoryItem(data as Omit<MemoryHistoryItem, '_id' | 'userId' | 'dateTime'>);
    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (e) {
    console.error('[history POST]', e);
    return NextResponse.json({ success: false, error: 'Failed to save' }, { status: 500 });
  }
}
