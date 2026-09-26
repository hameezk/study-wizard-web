/**
 * Coupon validation.
 *
 * Wraps the validate_coupon RPC, which returns a verdict and an amount but
 * never a coupon row — the coupons table has no read policy at all, so codes
 * cannot be enumerated by guessing.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const schema = z.object({
  code: z.string().trim().min(1).max(64),
  plan: z.string().regex(/^[a-z_]{2,20}$/),
});

export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ valid: false, reason: 'invalid_request' }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc('validate_coupon', {
    p_code: parsed.data.code,
    p_plan_code: parsed.data.plan,
  });

  if (error) {
    return NextResponse.json({ valid: false, reason: 'unavailable' }, { status: 200 });
  }
  return NextResponse.json(data);
}
