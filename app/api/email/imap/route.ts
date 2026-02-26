import { NextResponse } from 'next/server';
import { simpleParser } from 'mailparser';

const Imap = require('imap-simple');

export async function GET() {
  const user = process.env.GMAIL_IMAP_USER;
  const password = process.env.GMAIL_IMAP_PASS;

  if (!user || !password) {
    return NextResponse.json({ error: 'IMAP credentials not configured' }, { status: 500 });
  }

  const config = {
    imap: {
      user,
      password,
      host: 'imap.gmail.com',
      port: 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
    },
  };

  try {
    const connection = await Imap.connect(config);
    await connection.openBox('INBOX');

    // Search for unread emails
    const searchCriteria = ['UNSEEN'];
    const fetchOptions = {
      bodies: ['HEADER', 'TEXT'],
      markSeen: false,
    };

    const messages = await connection.search(searchCriteria, fetchOptions);
    
    const emails = await Promise.all(
      messages.slice(0, 10).map(async (message: any) => {
        const header = message.parts.find((part: any) => part.which === 'HEADER');
        const body = message.parts.find((part: any) => part.which === 'TEXT');
        
        const parsed = await simpleParser(body?.body || '');
        
        return {
          id: message.attributes.uid,
          subject: header?.body?.subject?.[0] || 'No Subject',
          from: header?.body?.from?.[0] || 'Unknown',
          date: header?.body?.date?.[0] || new Date().toISOString(),
          snippet: parsed.text?.substring(0, 200) || 'No preview',
        };
      })
    );

    await connection.end();

    return NextResponse.json({ emails });
  } catch (error: any) {
    console.error('IMAP error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}