import { NextRequest, NextResponse } from 'next/server';
import { clearMemHistory, deleteMemHistoryItem } from '@/lib/historyStore';

async function tryMongoDB() {
  try {
    const { connectDB, HistoryModel } = await import('@/lib/mongodb');
    await connectDB();
    return HistoryModel;
  } catch {
    return null;
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  const Model = await tryMongoDB();
  if (Model) {
    try {
      if (id === 'all') {
        await Model.deleteMany({ userId: 'anonymous' });
      } else {
        await Model.findByIdAndDelete(id);
      }
      return NextResponse.json({ success: true });
    } catch { /* fall through */ }
  }

  if (id === 'all') {
    clearMemHistory('anonymous');
  } else {
    deleteMemHistoryItem(id);
  }

  return NextResponse.json({ success: true });
}
