import { NextResponse } from 'next/server';

export async function GET() {
  const user = process.env.GMAIL_IMAP_USER;
  const password = process.env.GMAIL_IMAP_PASS;

  if (!user || !password) {
    return NextResponse.json({ error: 'IMAP credentials not configured' }, { status: 500 });
  }

  try {
    // Use emailjs-imap-client which is pure JavaScript
    const ImapClient = require('emailjs-imap-client');
    
    const client = new ImapClient.default('imap.gmail.com', 993, {
      auth: {
        user,
        pass: password,
      },
      useSecureTransport: true,
      requireTLS: true,
    });

    await client.connect();

    // Select inbox
    const mailbox = await client.selectMailbox('INBOX');
    const totalMessages = mailbox.exists || 0;

    let emails = [];
    
    if (totalMessages > 0) {
      // Fetch last 10 messages
      const messages = await client.listMessages('INBOX', `${Math.max(1, totalMessages - 9)}:${totalMessages}`, ['uid', 'envelope']);
      
      emails = messages.map((msg: any) => ({
        id: msg.uid,
        subject: msg.envelope.subject || 'No Subject',
        from: msg.envelope.from?.[0]?.name || msg.envelope.from?.[0]?.address || 'Unknown',
        date: msg.envelope.date || new Date().toISOString(),
      }));
    }

    await client.close();

    return NextResponse.json({ 
      emails,
      total: totalMessages
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