import { NextResponse } from 'next/server';
import tls from 'tls';

function sendCommand(socket: tls.TLSSocket, command: string): Promise<{ response: string; success: boolean }> {
  return new Promise((resolve, reject) => {
    let buffer = '';
    const timeout = setTimeout(() => reject(new Error('Timeout after 10s')), 10000);
    
    const onData = (data: Buffer) => {
      buffer += data.toString();
      // Wait for complete response (ends with OK or NO or BAD)
      if (buffer.includes(' OK ') || buffer.includes(' NO ') || buffer.includes(' BAD ')) {
        clearTimeout(timeout);
        socket.off('data', onData);
        const success = buffer.includes(' OK ');
        resolve({ response: buffer, success });
      }
    };
    
    socket.on('data', onData);
    socket.write(command + '\r\n');
  });
}

export async function GET() {
  const user = process.env.GMAIL_IMAP_USER;
  const password = process.env.GMAIL_IMAP_PASS;
  const debug: string[] = [];

  if (!user || !password) {
    return NextResponse.json({ error: 'IMAP credentials not configured' }, { status: 500 });
  }

  try {
    debug.push('Connecting to imap.gmail.com:993...');
    
    // Connect to Gmail IMAP
    const socket = tls.connect({
      host: 'imap.gmail.com',
      port: 993,
      rejectUnauthorized: false,
    });

    await new Promise((resolve, reject) => {
      socket.once('ready', () => {
        debug.push('TLS connection ready');
        resolve(undefined);
      });
      socket.once('error', (err) => {
        debug.push(`TLS error: ${err.message}`);
        reject(err);
      });
    });

    // Wait for server greeting
    await new Promise(resolve => setTimeout(resolve, 500));

    // Login
    debug.push('Sending LOGIN...');
    const loginResult = await sendCommand(socket, `A1 LOGIN "${user}" "${password}"`);
    debug.push(`Login response: ${loginResult.response.substring(0, 100)}`);
    
    if (!loginResult.success) {
      throw new Error(`Login failed: ${loginResult.response}`);
    }

    // Select inbox
    debug.push('Selecting INBOX...');
    const selectResult = await sendCommand(socket, 'A2 SELECT INBOX');
    debug.push(`Select response: ${selectResult.response.substring(0, 100)}`);

    // Search for ALL emails
    debug.push('Searching for emails...');
    const searchResult = await sendCommand(socket, 'A3 SEARCH ALL');
    debug.push(`Search response: ${searchResult.response.substring(0, 200)}`);
    
    // Parse UIDs
    const match = searchResult.response.match(/SEARCH\s+([\d\s]+)/);
    const uids = match ? match[1].trim().split(/\s+/).filter(Boolean) : [];
    debug.push(`Found ${uids.length} emails`);
    
    const emails = [];
    
    // Fetch first 5 emails
    for (const uid of uids.slice(-5)) { // Get last 5 (most recent)
      try {
        debug.push(`Fetching email ${uid}...`);
        const fetchResult = await sendCommand(socket, `A4 FETCH ${uid} (BODY[HEADER.FIELDS (SUBJECT FROM DATE)])`);
        
        const subjectMatch = fetchResult.response.match(/Subject:\s*([^\r\n]+)/i);
        const fromMatch = fetchResult.response.match(/From:\s*([^\r\n]+)/i);
        const dateMatch = fetchResult.response.match(/Date:\s*([^\r\n]+)/i);
        
        emails.push({
          id: uid,
          subject: subjectMatch?.[1]?.trim() || 'No Subject',
          from: fromMatch?.[1]?.trim() || 'Unknown',
          date: dateMatch?.[1]?.trim() || new Date().toISOString(),
        });
      } catch (e: any) {
        debug.push(`Fetch error for ${uid}: ${e.message}`);
      }
    }

    // Logout
    await sendCommand(socket, 'A5 LOGOUT');
    socket.end();

    return NextResponse.json({ 
      emails,
      debug,
      totalEmails: uids.length
    });

  } catch (error: any) {
    console.error('IMAP error:', error);
    return NextResponse.json({ 
      error: error.message || 'IMAP connection failed',
      debug,
      user: user,
      passwordLength: password.length,
    }, { status: 500 });
  }
}