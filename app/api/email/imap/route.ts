import { NextResponse } from 'next/server';
import tls from 'tls';

function sendCommand(socket: tls.TLSSocket, command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    let buffer = '';
    const timeout = setTimeout(() => reject(new Error('Timeout')), 10000);
    
    const onData = (data: Buffer) => {
      buffer += data.toString();
      if (buffer.includes('\r\n')) {
        clearTimeout(timeout);
        socket.off('data', onData);
        resolve(buffer);
      }
    };
    
    socket.on('data', onData);
    socket.write(command + '\r\n');
  });
}

export async function GET() {
  const user = process.env.GMAIL_IMAP_USER;
  const password = process.env.GMAIL_IMAP_PASS;

  if (!user || !password) {
    return NextResponse.json({ error: 'IMAP credentials not configured' }, { status: 500 });
  }

  try {
    // Connect to Gmail IMAP
    const socket = tls.connect({
      host: 'imap.gmail.com',
      port: 993,
      rejectUnauthorized: false,
    });

    await new Promise((resolve, reject) => {
      socket.once('ready', resolve);
      socket.once('error', reject);
    });

    // Login
    await sendCommand(socket, `A1 LOGIN "${user}" "${password}"`);
    
    // Select inbox
    await sendCommand(socket, 'A2 SELECT INBOX');
    
    // Search for unread
    const searchResult = await sendCommand(socket, 'A3 SEARCH UNSEEN');
    
    // Parse UIDs
    const match = searchResult.match(/SEARCH\s+(.+)/);
    const uids = match ? match[1].trim().split(' ').filter(Boolean) : [];
    
    const emails = [];
    
    // Fetch first 10 emails
    for (const uid of uids.slice(0, 10)) {
      try {
        const fetchResult = await sendCommand(socket, `A4 FETCH ${uid} (BODY[HEADER.FIELDS (SUBJECT FROM DATE)])`);
        const subject = fetchResult.match(/Subject:\s*(.+)/i)?.[1] || 'No Subject';
        const from = fetchResult.match(/From:\s*(.+)/i)?.[1] || 'Unknown';
        const date = fetchResult.match(/Date:\s*(.+)/i)?.[1] || new Date().toISOString();
        
        emails.push({
          id: uid,
          subject: subject.replace(/\r\n/g, ''),
          from: from.replace(/\r\n/g, ''),
          date: date.replace(/\r\n/g, ''),
          snippet: 'Email content preview...',
        });
      } catch (e) {
        console.error('Fetch error:', e);
      }
    }

    // Logout
    await sendCommand(socket, 'A5 LOGOUT');
    socket.end();

    return NextResponse.json({ emails });

  } catch (error: any) {
    console.error('IMAP error:', error);
    return NextResponse.json({ 
      error: error.message || 'IMAP connection failed',
      user: user,
      passwordLength: password.length,
      hint: 'Make sure you are using an App Password (16 characters), not your regular Gmail password'
    }, { status: 500 });
  }
}