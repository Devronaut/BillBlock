import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import { checkJwt } from './middleware/auth';
import axios from 'axios';

dotenv.config();

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 5000;

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/protected', checkJwt, (req, res) => {
  console.log(req.headers);
  res.json({ message: 'You are authenticated!', user: req.auth });
});

app.post('/test-gmail', async (req: Request, res: Response): Promise<any> => {
  const { accessToken } = req.body;
  if (!accessToken) {
    return res.status(400).json({ error: 'Access token required' });
  }

  try {
    const gmailRes = await axios.get('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    res.json({ profile: gmailRes.data });
  } catch (err: any) {
    res.status(500).json({ error: err.message, details: err.response?.data });
  }
});

app.post('/fetch-subscription-emails', async (req, res): Promise<any> => {
  const { accessToken } = req.body;
  if (!accessToken) {
    return res.status(400).json({ error: 'Access token required' });
  }

  try {
    // Search for emails with keywords in subject
    const query = 'subject:receipt OR subject:subscription OR subject:renewal OR subject:invoice';
    const listRes = await axios.get(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=10`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const messageIds = (listRes.data.messages || []).map((msg: any) => msg.id);

    // Fetch details for each message
    const messages = [];
    for (const id of messageIds) {
      const msgRes = await axios.get(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=full`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      const msg = msgRes.data;
      const headers = msg.payload.headers;
      const subjectHeader = headers.find((h: any) => h.name === 'Subject');
      const subject = subjectHeader ? subjectHeader.value : '';
      const snippet = msg.snippet || '';

      // Simple parsing logic
      const fromHeader = headers.find((h: any) => h.name === 'From');
      let service = null;
      if (fromHeader) {
        const emailMatch = fromHeader.value.match(/<(.+?)>/);
        if (emailMatch) {
          // Extract domain before first dot (e.g., netflix from no-reply@netflix.com)
          const domain = emailMatch[1].split('@')[1].split('.')[0];
          service = domain.charAt(0).toUpperCase() + domain.slice(1);
        } else {
          // Fallback: use the sender's name
          service = fromHeader.value.split(' ')[0];
        }
      }
      // Fallback: extract from subject
      if (!service) {
        const subjectServiceMatch = subject.match(/(?:your|from)?\s*([A-Za-z0-9]+)\s*(?:subscription|receipt|invoice)/i);
        if (subjectServiceMatch) {
          service = subjectServiceMatch[1];
        }
      }
      const amountMatch = snippet.match(/\$([0-9]+(\.[0-9]{2})?)/);
      const dateMatch = snippet.match(/(\d{1,2}\/\d{1,2}\/\d{2,4})/);

      messages.push({
        id: msg.id,
        subject,
        snippet,
        service,
        amount: amountMatch ? amountMatch[0] : null,
        renewalDate: dateMatch ? dateMatch[0] : null,
      });
    }

    res.json({ messages });
  } catch (err: any) {
    res.status(500).json({ error: err.message, details: err.response?.data });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
