import { NextResponse } from 'next/server';
import { json } from '@/lib/response';
import { getPlanPriceIds, validatePriceConfiguration } from '@/lib/server/plan-price-ids';

export async function GET() {
  try {
    // Validate configuration first
    const { isValid } = validatePriceConfiguration();

    if (!isValid) {
      return NextResponse.json(
        { error: 'Billing system configuration incomplete' },
        { status: 503 },
      );
    }

    // Get plan configurations from environment
    const planConfigurations = getPlanPriceIds();

    return json({
      success: true,
      plans: planConfigurations,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to load pricing information' }, { status: 500 });
  }
}
