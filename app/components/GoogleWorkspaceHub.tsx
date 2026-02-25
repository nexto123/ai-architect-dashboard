'use client';

import { useState, useEffect } from 'react';
import { Mail, Calendar, FolderOpen, FileSpreadsheet, FileText, RefreshCw, Send, Plus } from 'lucide-react';
import { googleConfig, GOOGLE_AUTH_URL } from '../lib/google-config';

interface GoogleWorkspaceHubProps {
  accessToken: string | null;
  onAuth: () => void;
}

export default function GoogleWorkspaceHub({ accessToken, onAuth }: GoogleWorkspaceHubProps) {
  const [activeTab, setActiveTab] = useState('gmail');

  const tabs = [
    { id: 'gmail', label: 'Gmail', icon: Mail },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'drive', label: 'Drive', icon: FolderOpen },
    { id: 'sheets', label: 'Sheets', icon: FileSpreadsheet },
    { id: 'docs', label: 'Docs', icon: FileText },
  ];

  if (!accessToken) {
    const authUrl = `${GOOGLE_AUTH_URL}?client_id=${googleConfig.clientId}&redirect_uri=${encodeURIComponent(googleConfig.redirectUri)}&response_type=code&scope=${encodeURIComponent(googleConfig.scopes.join(' '))}&access_type=offline&prompt=consent`;
    
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h3 style={{ marginBottom: '1rem' }}>Connect Google Workspace</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          Grant access to Gmail, Calendar, Drive, Sheets, and Docs
        </p>
        <a
          href={authUrl}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.5rem',
            background: 'var(--accent-cyan)',
            color: '#0a0a0f',
            borderRadius: 8,
            textDecoration: 'none',
            fontWeight: 600,
          }}
        >
          Connect Google Account
        </a>
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
        <p style={{ color: 'var(--text-muted)' }}>
          {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} integration active. 
          Access token: {accessToken.substring(0, 20)}...
        </p>
      </div>
    </div>
  );
}