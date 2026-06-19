// Shared operator-console authorization. When ADMIN_KEY is set (production), all
// admin endpoints require it via the `x-admin-key` header (or ?key= for quick
// checks). When unset (local/demo), the console is open. One helper so the read
// dashboard, claw-back, and station registration all gate identically.

import { config } from "./config";

export function adminAuthed(req: Request): boolean {
  if (!config.adminKey) return true;
  const provided = req.headers.get("x-admin-key") ?? new URL(req.url).searchParams.get("key");
  return provided === config.adminKey;
}

/** Whether an operator key is required (so the client knows to prompt). */
export function adminKeyRequired(): boolean {
  return Boolean(config.adminKey);
}
