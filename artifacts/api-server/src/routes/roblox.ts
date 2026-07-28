import { Router } from "express";

const router = Router();

router.post("/roblox/verify", async (req, res) => {
  const { username } = req.body as { username?: string };

  if (!username || typeof username !== "string") {
    res.status(400).json({ error: "Username is required" });
    return;
  }

  try {
    const searchRes = await fetch("https://users.roblox.com/v1/usernames/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usernames: [username.trim()], excludeBannedUsers: false }),
    });
    const searchData = (await searchRes.json()) as {
      data?: { id: number; name: string }[];
    };

    if (!searchData.data || searchData.data.length === 0) {
      res.json({ valid: false, found: false, error: "User not found" });
      return;
    }

    const userId = searchData.data[0]!.id;

    const [userRes, avatarRes] = await Promise.all([
      fetch(`https://users.roblox.com/v1/users/${userId}`),
      fetch(
        `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png&isCircular=false`,
      ),
    ]);

    const userData = (await userRes.json()) as {
      id: number;
      name: string;
      displayName: string;
      created: string;
    };
    const avatarData = (await avatarRes.json()) as {
      data?: { targetId: number; state: string; imageUrl: string }[];
    };

    const avatarUrl = avatarData.data?.[0]?.imageUrl ?? null;
    const created = new Date(userData.created);
    const accountAgeDays = Math.floor((Date.now() - created.getTime()) / (1000 * 60 * 60 * 24));

    res.json({
      found: true,
      valid: accountAgeDays >= 80,
      username: userData.name,
      displayName: userData.displayName,
      userId,
      accountAgeDays,
      created: userData.created,
      avatarUrl,
    });
  } catch {
    res.status(500).json({ error: "Failed to verify user" });
  }
});

export default router;
