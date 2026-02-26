import { NextResponse } from 'next/server';
import { simpleParser } from 'mailparser';

const Imap = require('imap');
const { promisify } = require('util');

export async function GET() {
  const user = process.env.GMAIL_IMAP_USER;
  const password = process.env.GMAIL_IMAP_PASS;

  if (!user || !password) {
    return NextResponse.json({ error: 'IMAP credentials not configured' }, { status: 500 });
  }

  const imap = new Imap({
    user,
    password,
    host: 'imap.gmail.com',
    port: 993,
    tls: true,
    tlsOptions: { rejectUnauthorized: false },
  });

  try {
    await new Promise((resolve, reject) => {
      imap.once('ready', resolve);
      imap.once('error', reject);
      imap.connect();
    });

    const openBox = promisify(imap.openBox.bind(imap));
    await openBox('INBOX', false);

    const search = promisify(imap.search.bind(imap));
    const results = await search(['UNSEEN']);

    if (!results || results.length === 0) {
      imap.end();
      return NextResponse.json({ emails: [] });
    }

    const fetch = imap.fetch(results.slice(0, 10), { bodies: '' });
    const emails: any[] = [];

    await new Promise((resolve, reject) => {
      fetch.on('message', (msg: any, seqno: number) => {
        let buffer = '';
        
        msg.on('body', (stream: any, info: any) => {
          stream.on('data', (chunk: any) => {
            buffer += chunk.toString('utf8');
          });
        });
        
        msg.once('end', async () => {
          try {
            const parsed = await simpleParser(buffer);
            emails.push({
              id: seqno,
              subject: parsed.subject || 'No Subject',
              from: parsed.from?.text || 'Unknown',
              date: parsed.date?.toISOString() || new Date().toISOString(),
              snippet: parsed.text?.substring(0, 200) || 'No preview',
            });
          } catch (e) {
            console.error('Parse error:', e);
          }
        });
      });

      fetch.once('error', reject);
      fetch.once('end', resolve);
    });

    imap.end();
    return NextResponse.json({ emails });

  } catch (error: any) {
    console.error('IMAP error:', error);
    return NextResponse.json({ error: error.message || 'IMAP connection failed' }, { status: 500 });
  }
}