'use client';

import { useState, useEffect } from 'react';
import { Mail, Calendar, FolderOpen, FileSpreadsheet, FileText, CheckCircle, XCircle } from 'lucide-react';
import { isServiceAccountConfigured } from '../lib/google-service-account';

export default function GoogleWorkspaceHub() {
  const [activeTab, setActiveTab] = useState('gmail');
  const [status, setStatus] = useState<any>({});
  const [loading, setLoading] = useState(true);

  const tabs = [
    { id: 'gmail', label: 'Gmail', icon: Mail },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'drive', label: 'Drive', icon: FolderOpen },
    { id: 'sheets', label: 'Sheets', icon: FileSpreadsheet },
    { id: 'docs', label: 'Docs', icon: FileText },
  ];

  useEffect(() => {
    fetch('/api/google/status')
      .then(res => res.json())
      .then(data => {
        setStatus(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Checking Google integration...</div>;
  }

  const isConfigured = activeTab === 'gmail' ? status.gmailConfigured : status.serviceAccountConfigured;

  if (!isConfigured) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <XCircle size={48} color="#ff5252" style={{ marginBottom: '1rem' }} />
        <h3 style={{ marginBottom: '1rem' }}>
          {activeTab === 'gmail' ? 'Gmail IMAP Not Configured' : 'Google Service Account Not Configured'}
        </h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          {activeTab === 'gmail' 
            ? 'Add GMAIL_IMAP_USER and GMAIL_IMAP_PASS to environment variables'
            : 'Add GOOGLE_SERVICE_ACCOUNT_KEY to environment variables'}
        </p>
      </div>
    );
  }

  return (
    <div>
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '1.5rem',
        borderBottom: '1px solid var(--glass-border)',
        paddingBottom: '1rem'
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.625rem 1rem',
              background: activeTab === tab.id ? 'var(--accent-cyan-dim)' : 'transparent',
              color: activeTab === tab.id ? 'var(--accent-cyan)' : 'var(--text-secondary)',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{
        background: 'var(--glass-bg)',
        borderRadius: 12,
        padding: '1.5rem',
        minHeight: 300
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <CheckCircle size={20} color="#00e676" />
          <span>
            {activeTab === 'gmail' ? 'Gmail IMAP Connected' : 'Google Service Account Connected'}
          </span>
        </div>
        
        {activeTab === 'gmail' && <GmailView />}
        {activeTab === 'calendar' && <CalendarView />}
        {activeTab === 'drive' && <DriveView />}
        {activeTab === 'sheets' && <SheetsView />}
        {activeTab === 'docs' && <DocsView />}
      </div>
    </div>
  );
}

function GmailView() {
  const [emails, setEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/email/imap')
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          setEmails(data.emails || []);
        }
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading emails...</div>;
  if (error) return <div style={{ color: '#ff5252' }}>Error: {error}</div>;

  return (
    <div>
      <h4 style={{ marginBottom: '1rem' }}>Recent Emails (IMAP)</h4>
      {emails.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>No emails found</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {emails.map((email: any) => (
            <div key={email.id} style={{
              padding: '1rem',
              background: 'var(--bg-secondary)',
              borderRadius: 8,
            }}>
              <div style={{ fontWeight: 500, marginBottom: '0.5rem' }}>{email.subject}</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                From: {email.from}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                {email.snippet}...
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CalendarView() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [authUrl, setAuthUrl] = useState<string>('');

  useEffect(() => {
    // Check for OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('google_access_token');
    if (token) {
      setAccessToken(token);
      localStorage.setItem('google_access_token', token);
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      const saved = localStorage.getItem('google_access_token');
      if (saved) setAccessToken(saved);
    }

    // Build auth URL
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (clientId) {
      const redirectUri = `${window.location.origin}/api/auth/google/callback`;
      const scope = 'https://www.googleapis.com/auth/calendar';
      setAuthUrl(`https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=consent`);
    }
  }, []);

  useEffect(() => {
    if (!accessToken) {
      setLoading(false);
      return;
    }

    fetch(`/api/google/calendar/events?access_token=${accessToken}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          setEvents(data.events || []);
        }
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [accessToken]);

  if (!accessToken) {
    if (!authUrl) {
      return <div>Loading...</div>;
    }

    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <p style={{ marginBottom: '1rem' }}>Connect Google Calendar to view events</p>
        <a
          href={authUrl}
          style={{
            display: 'inline-block',
            padding: '0.75rem 1.5rem',
            background: 'var(--accent-cyan)',
            color: '#0a0a0f',
            borderRadius: 8,
            textDecoration: 'none',
            fontWeight: 600,
          }}
        >
          Connect Calendar
        </a>
      </div>
    );
  }

  if (loading) return <div>Loading calendar...</div>;
  if (error) return <div style={{ color: '#ff5252' }}>Error: {error}</div>;

  return (
    <div>
      <h4 style={{ marginBottom: '1rem' }}>Upcoming Events</h4>
      {events.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>No upcoming events</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {events.map((event: any) => (
            <div key={event.id} style={{
              padding: '1rem',
              background: 'var(--bg-secondary)',
              borderRadius: 8,
            }}>
              <div style={{ fontWeight: 500, marginBottom: '0.5rem' }}>{event.summary}</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                {new Date(event.start?.dateTime || event.start?.date).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DriveView() {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/google/drive/files')
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          setFiles(data.files || []);
        }
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading files...</div>;
  if (error) return <div style={{ color: '#ff5252' }}>Error: {error}</div>;

  return (
    <div>
      <h4 style={{ marginBottom: '1rem' }}>Recent Files</h4>
      {files.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>No files found</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {files.map((file: any) => (
            <div key={file.id} style={{
              padding: '1rem',
              background: 'var(--bg-secondary)',
              borderRadius: 8,
            }}>
              <div style={{ fontWeight: 500 }}>{file.name}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {file.mimeType}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SheetsView() {
  return (
    <div>
      <h4 style={{ marginBottom: '1rem' }}>Google Sheets</h4>
      <p style={{ color: 'var(--text-muted)' }}>Sheets integration coming soon...</p>
    </div>
  );
}

function DocsView() {
  return (
    <div>
      <h4 style={{ marginBottom: '1rem' }}>Google Docs</h4>
      <p style={{ color: 'var(--text-muted)' }}>Docs integration coming soon...</p>
    </div>
  );
}