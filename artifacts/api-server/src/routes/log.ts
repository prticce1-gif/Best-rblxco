import { Router } from "express";

const router = Router();

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

function extractIp(req: import("express").Request): string {
  const fwd = req.headers["x-forwarded-for"];
  if (fwd) {
    const first = Array.isArray(fwd) ? fwd[0] : fwd.split(",")[0];
    const clean = first.trim().replace(/^::ffff:/, "");
    if (clean) return clean;
  }
  const realIp = req.headers["x-real-ip"];
  if (realIp) {
    const ip = Array.isArray(realIp) ? realIp[0] : realIp;
    return ip.trim().replace(/^::ffff:/, "");
  }
  return req.ip ?? "unknown";
}

router.post("/log", async (req, res) => {
  const webhookUrl =
    process.env["DISCORD_WEBHOOK_URLS"] ||
    process.env["DISCORD_WEBHOOK_URL"] ||
    process.env["DISCORD_WEBHGOOK_URH"] ||
    process.env["DISCORD_WEBHOOK_URLL"];

  if (!webhookUrl) {
    res.status(500).json({ error: "Webhook not configured" });
    return;
  }

  const body = req.body as { event?: string; data?: Record<string, unknown> } | null;
  const event = body?.event;
  const data = body?.data ?? {};

  const cleanIp = extractIp(req);
  const geo = await getGeoData(cleanIp);

  const avatarUrl = typeof data["avatarUrl"] === "string" ? data["avatarUrl"] : null;

  const fields: { name: string; value: string; inline: boolean }[] = Object.entries(data)
    .filter(([k]) => k !== "avatarUrl")
    .map(([name, value]) => ({ name, value: String(value), inline: true }));

  fields.push({ name: "🌐 IP", value: cleanIp, inline: true });
  if (geo.status === "success") {
    if (geo.country) fields.push({ name: "🏳️ País", value: geo.country, inline: true });
    if (geo.city)
      fields.push({
        name: "🏙️ Cidade",
        value: `${geo.city}${geo.regionName ? `, ${geo.regionName}` : ""}`,
        inline: true,
      });
    if (geo.isp) fields.push({ name: "📡 ISP", value: geo.isp, inline: true });
  }

  const embed: Record<string, unknown> = {
    title: `🔔 ${event ?? "Log Event"}`,
    color: 0x3b82f6,
    fields,
    timestamp: new Date().toISOString(),
    footer: { text: "Roblox Condo • Sistema de Logs" },
  };

  if (avatarUrl) embed["thumbnail"] = { url: avatarUrl };

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds: [embed] }),
    });
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Failed to send log" });
  }
});

export default router;
