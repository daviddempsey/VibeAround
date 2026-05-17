/**
 * Session auth token plumbing for the web dashboard.
 *
 * The Tauri tray (or standalone launcher) opens the dashboard with a
 * `?token=<hex>` query parameter. On first load we:
 *
 *   1. Read the token from the URL (or, when the request was already
 *      authenticated by an upstream proxy like oauth2-proxy, from a
 *      `<meta name="vibearound-token">` tag the server splices into
 *      the HTML)
 *   2. Store it in `sessionStorage` so it survives in-app navigation
 *      but dies when the tab closes
 *   3. Strip the token from the address bar via `history.replaceState`
 *      so it never ends up in browser history or Referer headers
 *
 * Subsequent fetches add `Authorization: Bearer <token>` via the global
 * fetch wrapper in `main.tsx`. WebSocket URLs append `&token=<token>` via
 * `lib/ws-url.ts` since browsers can't set headers on WS handshakes.
 */

const STORAGE_KEY = "vibearound.auth.token";
const META_TOKEN_NAME = "vibearound-token";

export function isLoopbackHost(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  return normalized === "localhost" || normalized === "127.0.0.1" || normalized === "::1" || normalized === "[::1]";
}

export function initAuthFromUrl(): void {
  if (typeof window === "undefined") return;

  // 1. URL `?token=` — highest priority (Tauri tray, manual paste).
  const params = new URLSearchParams(window.location.search);
  const urlToken = params.get("token");
  if (urlToken) {
    window.sessionStorage.setItem(STORAGE_KEY, urlToken);
    // Strip ?token=... from the URL without reloading the page.
    params.delete("token");
    const query = params.toString();
    const newUrl =
      window.location.pathname + (query ? `?${query}` : "") + window.location.hash;
    window.history.replaceState(null, "", newUrl);
    return;
  }

  // 2. `<meta name="vibearound-token">` — set by the server when the
  // upstream proxy (oauth2-proxy etc.) injected a valid bearer. Lets the
  // SPA boot already-authed without any URL ceremony. Only adopt the meta
  // value if sessionStorage is empty so user-pasted tokens win on reload.
  if (window.sessionStorage.getItem(STORAGE_KEY)) return;
  const meta = document.querySelector(
    `meta[name="${META_TOKEN_NAME}"]`,
  ) as HTMLMetaElement | null;
  const metaToken = meta?.content?.trim();
  if (metaToken) {
    window.sessionStorage.setItem(STORAGE_KEY, metaToken);
  }
}

/** Return the currently cached auth token, if any. */
export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(STORAGE_KEY);
}

/** Local loopback dashboards are trusted without browser pairing. */
export function isLocalDashboard(): boolean {
  if (typeof window === "undefined") return false;
  return isLoopbackHost(window.location.hostname);
}
