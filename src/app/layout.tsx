import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TopNav } from "@/components/shell/top-nav";
import { ModeBanner } from "@/components/shell/mode-banner";
import { AuthProvider } from "@/lib/challenge/useAuth";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Recoup / VandyLoop — AI-powered recycling optimization",
  description:
    "VandyLoop turns campus recycling into verified behavior, measurable outcomes, and optimized operations. Vanderbilt pilot by Recoup.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-paper text-ink">
        <AuthProvider>
          <TopNav />
          <ModeBanner />
          <main className="flex-1 flex flex-col">{children}</main>
          <footer className="border-t border-line bg-paper-2">
            <div className="mx-auto max-w-7xl px-6 py-6 flex flex-wrap items-center justify-between gap-4 text-xs text-ink-4">
              <div className="flex items-center gap-2">
                <span className="font-display tracking-tight text-ink-2 font-semibold">
                  Recoup
                </span>
                <span className="text-ink-5">·</span>
                <span>VandyLoop · Vanderbilt March Madness recycling challenge</span>
              </div>
              <div className="flex items-center gap-4">
                <a href="/admin" className="hover:text-ink transition-colors">
                  Operator console
                </a>
                <span className="text-ink-5">·</span>
                <span>© 2026 Recoup, Inc.</span>
              </div>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
