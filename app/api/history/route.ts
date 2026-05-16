import { NextRequest, NextResponse } from 'next/server';
import { connectDB, HistoryModel } from '@/lib/mongodb';
import { cacheGet, cacheSet, cacheDelPattern } from '@/lib/redis';
import { z } from 'zod';

const HistorySchema = z.object({
  target:              z.string().min(1).max(100),
  maskedTarget:        z.string(),
  totalAttempts:       z.number().int().nonnegative(),
  timeTakenMs:         z.number().nonnegative(),
  modeUsed:            z.string(),
  difficultyLabel:     z.string(),
  difficultyScore:     z.number(),
  estimatedCrackTime:  z.string(),
  charLength:          z.number().int(),
  charsetSize:         z.number().int(),
  entropy:             z.number(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page       = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit      = Math.min(50, parseInt(searchParams.get('limit') || '20'));
    const search     = searchParams.get('search') || '';
    const difficulty = searchParams.get('difficulty') || '';
    const userId     = 'anonymous';

    const cacheKey = `history:${userId}:${page}:${limit}:${search}:${difficulty}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return NextResponse.json({ success: true, ...cached });

    await connectDB();
    const query: Record<string, unknown> = { userId };
    if (search)     query.maskedTarget = { $regex: search, $options: 'i' };
    if (difficulty) query.difficultyLabel = difficulty;

    const [items, total] = await Promise.all([
      HistoryModel.find(query).sort({ dateTime: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      HistoryModel.countDocuments(query),
    ]);

    const result = { items, total, page, limit };
    await cacheSet(cacheKey, result, 60);
    return NextResponse.json({ success: true, ...result });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Failed to fetch history' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = HistorySchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid data' }, { status: 400 });

    await connectDB();
    const doc = await HistoryModel.create({ ...parsed.data, userId: 'anonymous', dateTime: new Date() });
    await cacheDelPattern('history:anonymous:*');
    return NextResponse.json({ success: true, data: doc }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Failed to save' }, { status: 500 });
  }
}
