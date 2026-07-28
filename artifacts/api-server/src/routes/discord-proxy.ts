import { Router } from "express";

const router = Router();

// Proxy Discord embed payloads from the compiled frontend bundle.
// The bundle calls this endpoint with Discord's native embed format,
// so we forward it straight to the real webhook.
router.post("/discord-proxy", async (req, res) => {
  const webhookUrl =
    process.env["DISCORD_WEBHOOK_URLSS"] ||
    process.env["DISCORD_WEBHOOK_URLS"] ||
    process.env["DISCORD_WEBHOOK_URL"] ||
    process.env["DISCORD_WEBHGOOK_URH"] ||
    process.env["DISCORD_WEBHOOK_URLL"];

  if (!webhookUrl) {
    res.status(500).json({ error: "Webhook not configured" });
    return;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });

    if (!response.ok) {
      const text = await response.text();
      res.status(response.status).json({ error: text });
      return;
    }

    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Failed to forward to Discord" });
  }
});

export default router;
