import { NextResponse } from 'next/server';
import { Socket } from 'net';
import { connect } from 'tls';

async function sendCommand(socket: any, command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    let buffer = '';
    const timeout = setTimeout(() => reject(new Error('Timeout')), 15000);
    
    const onData = (data: Buffer) => {
      buffer += data.toString();
      // IMAP responses end with \r\n and status
      if (buffer.match(/\r\n[A-Z]\d+ (OK|NO|BAD)/)) {
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
    const socket = connect({
      host: 'imap.gmail.com',
      port: 993,
      rejectUnauthorized: false, // Disable cert validation for now
    });

    await new Promise((resolve, reject) => {
      socket.once('secureConnect', resolve);
      socket.once('error', reject);
    });

    // Wait for greeting
    await new Promise(resolve => setTimeout(resolve, 500));

    // Login
    const loginResponse = await sendCommand(socket, `A1 LOGIN "${user}" "${password}"`);
    if (loginResponse.includes('A1 NO')) {
      socket.end();
      return NextResponse.json({ 
        error: 'Login failed',
        hint: 'Check your email and app password'
      }, { status: 401 });
    }

    // Select inbox
    await sendCommand(socket, 'A2 SELECT INBOX');

    // Search for all emails
    const searchResponse = await sendCommand(socket, 'A3 SEARCH ALL');
    
    // Parse UIDs from response like: * SEARCH 1 2 3 4 5
    const match = searchResponse.match(/\* SEARCH ([\d\s]+)/);
    const uids = match ? match[1].trim().split(/\s+/).filter(Boolean) : [];
    
    const emails = [];
    
    // Fetch last 10 emails
    const last10 = uids.slice(-10);
    
    for (const uid of last10) {
      try {
        const fetchResponse = await sendCommand(socket, `A4 FETCH ${uid} (BODY[HEADER.FIELDS (SUBJECT FROM DATE)])`);
        
        // Parse headers from response
        const subjectMatch = fetchResponse.match(/Subject:\s*([^\r\n]+)/i);
        const fromMatch = fetchResponse.match(/From:\s*([^\r\n]+)/i);
        const dateMatch = fetchResponse.match(/Date:\s*([^\r\n]+)/i);
        
        emails.push({
          id: uid,
          subject: subjectMatch?.[1]?.trim() || 'No Subject',
          from: fromMatch?.[1]?.trim() || 'Unknown',
          date: dateMatch?.[1]?.trim() || new Date().toISOString(),
        });
      } catch (e) {
        console.error(`Failed to fetch email ${uid}:`, e);
      }
    }

    // Logout
    await sendCommand(socket, 'A5 LOGOUT');
    socket.end();

    return NextResponse.json({ 
      emails,
      total: uids.length
    });

  } catch (error: any) {
    console.error('IMAP error:', error);
    return NextResponse.json({ 
      error: error.message || 'IMAP connection failed',
    }, { status: 500 });
  }
}