import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Branded social-share card shown when vandyloop.vercel.app is pasted into
// LinkedIn / Slack / iMessage / X / a YC application. Satori renders flexbox only.
export const alt = "Recoup / VandyLoop · verified recycle-to-reward for universities";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const logo = await readFile(join(process.cwd(), "public/recoup-logo.png"));
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#fafaf7",
          padding: 80,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <img src={logoSrc} width={92} height={92} alt="" />
          <span style={{ fontSize: 50, fontWeight: 700, color: "#0f1511", letterSpacing: -1 }}>
            Recoup
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 76, fontWeight: 700, color: "#0f1511", lineHeight: 1.05, letterSpacing: -2 }}>
            Every can,
          </span>
          <span style={{ fontSize: 76, fontWeight: 700, color: "#1e5b46", lineHeight: 1.05, letterSpacing: -2 }}>
            verified, rewarded,
          </span>
          <span style={{ fontSize: 76, fontWeight: 700, color: "#1e5b46", lineHeight: 1.05, letterSpacing: -2 }}>
            learned from.
          </span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <span style={{ fontSize: 28, color: "#4b5350" }}>
            Verified campus recycling · piloting at Vanderbilt
          </span>
          <span style={{ fontSize: 28, fontWeight: 600, color: "#1e5b46" }}>vandyloop.vercel.app</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
