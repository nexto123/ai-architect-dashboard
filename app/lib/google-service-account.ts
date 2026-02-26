// Google Service Account authentication
// Uses GOOGLE_SERVICE_ACCOUNT_KEY from environment variables

import { JWT } from 'google-auth-library';

interface ServiceAccountKey {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
}

// Parse service account key from environment
function getServiceAccountKey(): ServiceAccountKey | null {
  const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!keyJson) return null;
  
  try {
    return JSON.parse(keyJson);
  } catch {
    return null;
  }
}

// Create JWT client for service account
export async function getGoogleAuthClient(scopes: string[]) {
  const key = getServiceAccountKey();
  if (!key) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY not configured');
  }

  const client = new JWT({
    email: key.client_email,
    key: key.private_key,
    scopes,
    subject: process.env.GOOGLE_WORKSPACE_USER_EMAIL, // User to impersonate (for Gmail)
  });

  return client;
}

// Scopes for different Google services
export const GOOGLE_SCOPES = {
  gmail: ['https://www.googleapis.com/auth/gmail.modify'],
  calendar: ['https://www.googleapis.com/auth/calendar'],
  drive: ['https://www.googleapis.com/auth/drive'],
  sheets: ['https://www.googleapis.com/auth/spreadsheets'],
  docs: ['https://www.googleapis.com/auth/documents'],
  all: [
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/documents'
  ]
};

// Check if service account is configured
export function isServiceAccountConfigured(): boolean {
  return getServiceAccountKey() !== null;
}