import { NextResponse } from 'next/server';
import { JWT } from 'google-auth-library';

// Get service account credentials
function getServiceAccount() {
  const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!keyJson) return null;
  try {
    return JSON.parse(keyJson);
  } catch {
    return null;
  }
}

// Create authenticated client
async function getAuthClient(scopes: string[]) {
  const key = getServiceAccount();
  if (!key) throw new Error('Service account not configured');

  const client = new JWT({
    email: key.client_email,
    key: key.private_key,
    scopes,
  });

  return client;
}

// GET /api/google/calendar/events
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'list';

  try {
    const auth = await getAuthClient(['https://www.googleapis.com/auth/calendar']);
    const accessToken = await auth.getAccessToken();

    if (action === 'list') {
      // List upcoming events
      const timeMin = new Date().toISOString();
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&maxResults=10&orderBy=startTime&singleEvents=true`,
        {
          headers: { Authorization: `Bearer ${accessToken.token}` },
        }
      );

      if (!response.ok) {
        const error = await response.text();
        return NextResponse.json({ error }, { status: response.status });
      }

      const data = await response.json();
      return NextResponse.json({ events: data.items || [] });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    console.error('Calendar API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/google/calendar/events
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { summary, description, start, end } = body;

    const auth = await getAuthClient(['https://www.googleapis.com/auth/calendar']);
    const accessToken = await auth.getAccessToken();

    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          summary,
          description,
          start: { dateTime: start },
          end: { dateTime: end },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json({ error }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Calendar API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}