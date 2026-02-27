import { NextResponse } from 'next/server';

export async function GET() {
  const user = process.env.GMAIL_IMAP_USER;
  const password = process.env.GMAIL_IMAP_PASS;

  if (!user || !password) {
    return NextResponse.json({ error: 'IMAP credentials not configured' }, { status: 500 });
  }

  try {
    // Use a simpler approach with node-imap library
    const Imap = require('imap');
    
    const imap = new Imap({
      user,
      password,
      host: 'imap.gmail.com',
      port: 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
    });

    const emails = await new Promise((resolve, reject) => {
      const results: any[] = [];

      imap.once('ready', () => {
        imap.openBox('INBOX', true, (err: any, box: any) => {
          if (err) {
            reject(err);
            return;
          }

          // Search for all emails
          imap.search(['ALL'], (err: any, uids: number[]) => {
            if (err) {
              reject(err);
              return;
            }

            if (uids.length === 0) {
              imap.end();
              resolve([]);
              return;
            }

            // Get last 10 emails
            const last10 = uids.slice(-10);
            const fetch = imap.fetch(last10, { bodies: 'HEADER.FIELDS (FROM TO SUBJECT DATE)' });

            fetch.on('message', (msg: any, seqno: number) => {
              let header = '';
              
              msg.on('body', (stream: any, info: any) => {
                stream.on('data', (chunk: any) => {
                  header += chunk.toString('utf8');
                });
              });

              msg.once('end', () => {
                const subject = header.match(/Subject:\s*([^\r\n]+)/i)?.[1]?.trim() || 'No Subject';
                const from = header.match(/From:\s*([^\r\n]+)/i)?.[1]?.trim() || 'Unknown';
                const date = header.match(/Date:\s*([^\r\n]+)/i)?.[1]?.trim() || new Date().toISOString();
                
                results.push({
                  id: seqno,
                  subject,
                  from,
                  date,
                });
              });
            });

            fetch.once('error', (err: any) => reject(err));
            
            fetch.once('end', () => {
              imap.end();
              resolve(results);
            });
          });
        });
      });

      imap.once('error', (err: any) => reject(err));
      imap.connect();
    });

    return NextResponse.json({ 
      emails,
      total: emails.length
    });

  } catch (error: any) {
    console.error('IMAP error:', error);
    return NextResponse.json({ 
      error: error.message || 'IMAP connection failed',
      user,
      passwordLength: password.length,
    }, { status: 500 });
  }
}