// Google OAuth configuration
export const googleConfig = {
  clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  redirectUri: typeof window !== 'undefined' 
    ? `${window.location.origin}/api/auth/google/callback`
    : 'http://localhost:3000/api/auth/google/callback',
  scopes: {
    calendar: 'https://www.googleapis.com/auth/calendar',
    drive: 'https://www.googleapis.com/auth/drive',
  }
};

export const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
export const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';