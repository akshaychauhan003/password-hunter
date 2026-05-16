import { NextRequest, NextResponse } from 'next/server';
import { connectDB, HistoryModel } from '@/lib/mongodb';
import { cacheDelPattern } from '@/lib/redis';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    if (params.id === 'all') {
      await HistoryModel.deleteMany({ userId: 'anonymous' });
    } else {
      await HistoryModel.findByIdAndDelete(params.id);
    }
    await cacheDelPattern('history:anonymous:*');
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: 'Delete failed' }, { status: 500 });
  }
}
