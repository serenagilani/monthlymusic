const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID!;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET!;
const SPOTIFY_USER_ID = process.env.SPOTIFY_USER_ID!; // your Spotify user id

if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET || !SPOTIFY_USER_ID) {
  // Vercel will inject env at runtime; local dev uses .env.local
  console.warn("Missing SPOTIFY_* env vars.");
}

export async function getAccessToken(): Promise<string> {
  const creds = btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`);
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${creds}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({ grant_type: "client_credentials" })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Spotify token error: ${res.status} ${text}`);
  }
  const json = await res.json();
  return json.access_token as string;
}

/**
 * Search public playlists for exact `name` match and filter by owner.
 * Requires only client-credentials (works if your playlists are public).
 */
export async function findPlaylistUrlByExactName(
  token: string,
  name: string
): Promise<string | null> {
  // Search broadly, then filter locally by owner + exact name (case-insensitive).
  const q = encodeURIComponent(name);
  const url = `https://api.spotify.com/v1/search?type=playlist&limit=20&q=${q}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Spotify search error: ${res.status} ${text}`);
  }

  const data = await res.json();
  const items = (data?.playlists?.items ?? []) as Array<any>;

  const match = items.find((p) => {
    const ownerMatches =
      (p?.owner?.id && p.owner.id.toLowerCase() === SPOTIFY_USER_ID.toLowerCase()) ||
      (p?.owner?.display_name && p.owner.display_name.toLowerCase() === SPOTIFY_USER_ID.toLowerCase());
    const nameMatches = (p?.name ?? "").toLowerCase() === name.toLowerCase();
    return ownerMatches && nameMatches;
  });

  return match?.external_urls?.spotify ?? null;
}
