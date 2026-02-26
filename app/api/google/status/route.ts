import { NextResponse } from 'next/server';
import { isServiceAccountConfigured } from '@/app/lib/google-service-account';

export async function GET() {
  return NextResponse.json({
    configured: isServiceAccountConfigured()
  });
}