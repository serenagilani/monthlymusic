import { storageGet, storageSet } from "../../lib/storage";
import { currentMonthCode } from "../../lib/date";
import { getAccessToken, findPlaylistUrlByExactName } from "../../lib/spotify";

export const config = { runtime: "edge" };

const EDGE_KEY = "current_playlist_url";
const EDGE_MONTH_KEY = "current_month_code";

export default async function handler() {
  try {
    const month = currentMonthCode();

    // If we already have this month saved, do nothing (idempotent).
    const savedMonth = await storageGet(EDGE_MONTH_KEY);
    const savedUrl = await storageGet(EDGE_KEY);
    if (savedMonth === month && savedUrl) {
      return new Response(JSON.stringify({ ok: true, message: "Already set for this month.", month, url: savedUrl }), {
        status: 200,
        headers: { "content-type": "application/json" }
      });
    }

    // Find playlist by exact name for YOUR user
    const token = await getAccessToken();
    const url = await findPlaylistUrlByExactName(token, month);

    if (!url) {
      // Not found yet; we'll try again on tomorrow's retry window.
      return new Response(JSON.stringify({ ok: true, message: "Playlist not found yet. Will retry.", month }), {
        status: 200,
        headers: { "content-type": "application/json" }
      });
    }

    // Save to Edge Config (instant reads by /current)
    await storageSet(EDGE_KEY, url);
    await storageSet(EDGE_MONTH_KEY, month);

    return new Response(JSON.stringify({ ok: true, message: "Updated current playlist.", month, url }), {
      status: 200,
      headers: { "content-type": "application/json" }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ ok: false, error: err?.message ?? "unknown error" }), {
      status: 500,
      headers: { "content-type": "application/json" }
    });
  }
}
