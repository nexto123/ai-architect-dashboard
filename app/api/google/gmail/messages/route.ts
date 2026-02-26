import { NextResponse } from 'next/server';
import { getGoogleAuthClient, GOOGLE_SCOPES } from '@/app/lib/google-service-account';

export async function GET() {
  try {
    const auth = await getGoogleAuthClient(GOOGLE_SCOPES.gmail);
    
    // Get access token
    const token = await auth.getAccessToken();
    
    // Call Gmail API
    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10', {
      headers: {
        'Authorization': `Bearer ${token.token}`,
      },
    });
    
    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json({ error }, { status: response.status });
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}