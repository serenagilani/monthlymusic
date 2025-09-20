import { storageGet } from "../lib/storage";

export const config = { runtime: "edge" };

export default async function handler() {
  const url = (await storageGet("current_playlist_url")) ?? "https://open.spotify.com";

  return new Response(null, {
    status: 302,
    headers: { Location: url }
  });
}
