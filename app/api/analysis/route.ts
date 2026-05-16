import { NextRequest, NextResponse } from 'next/server';
import { analysePassword } from '@/lib/passwordAnalyzer';
import { cacheGet, cacheSet } from '@/lib/redis';
import { z } from 'zod';

const Schema = z.object({ password: z.string().min(1).max(200) });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid input' }, { status: 400 });

    const { password } = parsed.data;
    const cacheKey = `analysis:${Buffer.from(password).toString('base64').slice(0, 40)}`;

    const cached = await cacheGet(cacheKey);
    if (cached) return NextResponse.json({ success: true, data: cached });

    const analysis = analysePassword(password);
    await cacheSet(cacheKey, analysis, 3600);

    return NextResponse.json({ success: true, data: analysis });
  } catch {
    return NextResponse.json({ success: false, error: 'Analysis failed' }, { status: 500 });
  }
}
