import { NextResponse } from 'next/server';

export async function GET() {
  // Check if IMAP credentials are configured
  const imapConfigured = !!(process.env.GMAIL_IMAP_USER && process.env.GMAIL_IMAP_PASS);
  
  return NextResponse.json({
    configured: imapConfigured,
    method: 'IMAP'
  });
}