import { readFileSync } from 'fs';
import { join } from 'path';
import { serve } from '@hono/node-server';
import { google } from 'googleapis';
import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();
app.use(cors());

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'http://localhost:5173/callback'
);

const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

app.get('/events', (c) => {
  const eventsPath = join(process.cwd(), 'src', 'server', 'events.json');
  const events = JSON.parse(readFileSync(eventsPath, 'utf-8'));
  return c.json(events);
});

app.get('/auth/url', (c) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar.events'],
  });
  return c.json({ url });
});

app.post('/auth/callback', async (c) => {
  const { code } = await c.req.json();
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  return c.json({ success: true });
});

app.post('/calendar/add', async (c) => {
  const { events } = await c.req.json();

  try {
    const results = await Promise.all(
      events.map(async (event: any) => {
        const [year, month, day] = event.date.split('/');
        const [hour, minute] = event.time.split(':');
        const startTime = new Date(
          2024,
          Number.parseInt(month) - 1,
          Number.parseInt(day),
          Number.parseInt(hour),
          Number.parseInt(minute)
        );
        const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour duration

        return calendar.events.insert({
          calendarId: 'primary',
          requestBody: {
            summary: event.title,
            description: `Platform: ${event.platform.join(', ')}`,
            start: {
              dateTime: startTime.toISOString(),
              timeZone: 'Asia/Tokyo',
            },
            end: {
              dateTime: endTime.toISOString(),
              timeZone: 'Asia/Tokyo',
            },
          },
        });
      })
    );
    return c.json({ success: true, results });
  } catch (error) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

const port = process.env.PORT || 3000;
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port: Number(port),
});
