import { NextRequest, NextResponse } from 'next/server';
import { parseRequest } from '@/lib/request';
import { simpleUsageManager } from '@/lib/services/simple-usage-manager';

export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
  const { auth, error } = await parseRequest(request);
  if (error) return error();

  // Check if user can access this usage data
  if (auth.user.id !== params.userId && !auth.user.isAdmin) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  try {
    const usageSummary = await simpleUsageManager.getUsageSummary(params.userId);
    return NextResponse.json(usageSummary);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch usage summary' }, { status: 500 });
  }
}
