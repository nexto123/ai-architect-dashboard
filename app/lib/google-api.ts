// Google Workspace API helper functions

import { GOOGLE_API_BASE } from './google-config';

// Generic API call with auth token
async function googleApiCall(endpoint: string, accessToken: string, options: RequestInit = {}) {
  const response = await fetch(`${GOOGLE_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    throw new Error(`Google API error: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

// Gmail API
export async function getGmailMessages(accessToken: string, maxResults = 10) {
  return googleApiCall(`/gmail/v1/users/me/messages?maxResults=${maxResults}`, accessToken);
}

export async function getGmailMessage(accessToken: string, messageId: string) {
  return googleApiCall(`/gmail/v1/users/me/messages/${messageId}`, accessToken);
}

export async function sendGmailMessage(accessToken: string, to: string, subject: string, body: string) {
  const message = btoa(
    `To: ${to}\n` +
    `Subject: ${subject}\n` +
    `Content-Type: text/plain; charset=utf-8\n\n` +
    `${body}`
  ).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  
  return googleApiCall('/gmail/v1/users/me/messages/send', accessToken, {
    method: 'POST',
    body: JSON.stringify({ raw: message }),
  });
}

// Calendar API
export async function getCalendarEvents(accessToken: string, timeMin?: string, timeMax?: string) {
  let url = '/calendar/v3/calendars/primary/events';
  const params = new URLSearchParams();
  if (timeMin) params.append('timeMin', timeMin);
  if (timeMax) params.append('timeMax', timeMax);
  if (params.toString()) url += `?${params.toString()}`;
  
  return googleApiCall(url, accessToken);
}

export async function createCalendarEvent(accessToken: string, event: {
  summary: string;
  description?: string;
  start: { dateTime: string };
  end: { dateTime: string };
  attendees?: { email: string }[];
}) {
  return googleApiCall('/calendar/v3/calendars/primary/events', accessToken, {
    method: 'POST',
    body: JSON.stringify(event),
  });
}

// Drive API
export async function getDriveFiles(accessToken: string, pageSize = 10) {
  return googleApiCall(`/drive/v3/files?pageSize=${pageSize}&fields=files(id,name,mimeType,modifiedTime)`, accessToken);
}

export async function createDriveFolder(accessToken: string, name: string, parentId?: string) {
  const metadata: any = {
    name,
    mimeType: 'application/vnd.google-apps.folder',
  };
  if (parentId) metadata.parents = [parentId];
  
  return googleApiCall('/drive/v3/files', accessToken, {
    method: 'POST',
    body: JSON.stringify(metadata),
  });
}

// Sheets API
export async function getSpreadsheet(accessToken: string, spreadsheetId: string) {
  return googleApiCall(`/sheets/v4/spreadsheets/${spreadsheetId}`, accessToken);
}

export async function updateSpreadsheet(accessToken: string, spreadsheetId: string, range: string, values: any[][]) {
  return googleApiCall(`/sheets/v4/spreadsheets/${spreadsheetId}/values/${range}`, accessToken, {
    method: 'PUT',
    body: JSON.stringify({ values }),
  });
}

// Docs API
export async function createDocument(accessToken: string, title: string) {
  return googleApiCall('/docs/v1/documents', accessToken, {
    method: 'POST',
    body: JSON.stringify({ title }),
  });
}

export async function getDocument(accessToken: string, documentId: string) {
  return googleApiCall(`/docs/v1/documents/${documentId}`, accessToken);
}