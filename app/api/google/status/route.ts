import { NextResponse } from 'next/server';

export async function GET() {
  // Check what Google services are configured
  const gmailConfigured = !!(process.env.GMAIL_IMAP_USER && process.env.GMAIL_IMAP_PASS);
  const serviceAccountConfigured = !!process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  
  return NextResponse.json({
    gmailConfigured,
    serviceAccountConfigured,
    calendarConfigured: serviceAccountConfigured, // For now
    driveConfigured: serviceAccountConfigured,
  });
}