import type { VercelRequest, VercelResponse } from '@vercel/node';

interface GeoData {
  country?: string;
  regionName?: string;
  city?: string;
  isp?: string;
  status?: string;
}

async function getGeoData(ip: string): Promise<GeoData> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,country,regionName,city,isp`,
      { signal: controller.signal },
    );
    clearTimeout(timeout);
    return (await res.json()) as GeoData;
  } catch {
    return {};
  }
}

function extractIp(req: VercelRequest): string {
  const fwd = req.headers['x-forwarded-for'];
  if (fwd) {
    const first = Array.isArray(fwd) ? fwd[0] : fwd.split(',')[0];
    const clean = (first ?? '').trim().replace(/^::ffff:/, '');
    if (clean) return clean;
  }
  const realIp = req.headers['x-real-ip'];
  if (realIp) {
    const ip = Array.isArray(realIp) ? realIp[0] : realIp;
    return (ip ?? '').trim().replace(/^::ffff:/, '');
  }
  return 'unknown';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const webhookUrl =
    process.env['DISCORD_WEBHOOK_URLSS'] ||
    process.env['DISCORD_WEBHOOK_URLS'] ||
    process.env['DISCORD_WEBHOOK_URL'] ||
    process.env['DISCORD_WEBHGOOK_URH'] ||
    process.env['DISCORD_WEBHOOK_URLL'];

  if (!webhookUrl) return res.status(500).json({ error: 'Webhook not configured' });

  const body = req.body as { event?: string; data?: Record<string, unknown> } | null;
  const event = body?.event;
  const data = body?.data ?? {};

  const cleanIp = extractIp(req);
  const geo = await getGeoData(cleanIp);

  const avatarUrl = typeof data['avatarUrl'] === 'string' ? data['avatarUrl'] : null;

  const fields: { name: string; value: string; inline: boolean }[] = Object.entries(data)
    .filter(([k]) => k !== 'avatarUrl')
    .map(([name, value]) => ({ name, value: String(value), inline: true }));

  fields.push({ name: '🌐 IP', value: cleanIp, inline: true });
  if (geo.status === 'success') {
    if (geo.country) fields.push({ name: '🏳️ País', value: geo.country, inline: true });
    if (geo.city)
      fields.push({
        name: '🏙️ Cidade',
        value: `${geo.city}${geo.regionName ? `, ${geo.regionName}` : ''}`,
        inline: true,
      });
    if (geo.isp) fields.push({ name: '📡 ISP', value: geo.isp, inline: true });
  }

  const embed: Record<string, unknown> = {
    title: `🔔 ${event ?? 'Log Event'}`,
    color: 0x3b82f6,
    fields,
    timestamp: new Date().toISOString(),
    footer: { text: 'Roblox Condo • Sistema de Logs' },
  };

  if (avatarUrl) embed['thumbnail'] = { url: avatarUrl };

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] }),
    });
    return res.json({ ok: true });
  } catch {
    return res.status(500).json({ error: 'Failed to send log' });
  }
}
