// Runs once when a Next.js server instance starts. We use it to fail fast on an
// unsafe production configuration (e.g. shipping with the default dev secret).
// No-op in development so local `next dev` is never blocked.

export async function register() {
  if (process.env.NODE_ENV !== "production") return;
  const { assertProductionReady } = await import("./lib/server/config");
  assertProductionReady();
}
