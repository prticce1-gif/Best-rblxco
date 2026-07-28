import type { VercelRequest, VercelResponse } from '@vercel/node';

// Proxy Discord embed payloads from the compiled frontend bundle.
// The bundle calls this endpoint with Discord's native embed format,
// so we forward it straight to the real webhook.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const webhookUrl =
    process.env['DISCORD_WEBHOOK_URLS'] ||
    process.env['DISCORD_WEBHOOK_URL'] ||
    process.env['DISCORD_WEBHGOOK_URH'] ||
    process.env['DISCORD_WEBHOOK_URLL'];

  if (!webhookUrl) return res.status(500).json({ error: 'Webhook not configured' });

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: text });
    }

    return res.json({ ok: true });
  } catch {
    return res.status(500).json({ error: 'Failed to forward to Discord' });
  }
}
