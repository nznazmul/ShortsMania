import type { Metadata } from "next";
import { Navbar } from "../components/navbar";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://shortsmania.app"),
  title: {
    default: "ShortsMania - AI-Powered Automated Short Video Generator",
    template: "%s | ShortsMania",
  },
  description:
    "Generate viral, high-retention short videos for TikTok, YouTube Shorts, and Instagram Reels with AI scriptwriting, neural voiceovers, stock footage, and styled karaoke captions.",
  keywords: [
    "AI Video Generator",
    "Short Video Creator",
    "TikTok Automation",
    "YouTube Shorts Generator",
    "ShortsMania",
    "Text to Video AI",
    "Edge-TTS Subtitles",
    "Auto Captions AI",
    "Viral Reels Generator",
  ],
  authors: [{ name: "ShortsMania Team", url: "https://github.com/nznazmul/ShortsMania" }],
  creator: "nznazmul",
  publisher: "ShortsMania",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "ShortsMania - AI-Powered Automated Short Video Generator",
    description:
      "Automate high-retention short videos for TikTok, YouTube Shorts, and Reels with AI scriptwriting, neural voiceovers, and dynamic karaoke captions.",
    url: "https://shortsmania.app",
    siteName: "ShortsMania",
    images: [
      {
        url: "/favicon.svg",
        width: 1200,
        height: 630,
        alt: "ShortsMania - AI Short Video Generator",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ShortsMania - AI-Powered Automated Short Video Generator",
    description:
      "Generate viral, high-retention short videos for TikTok, YouTube Shorts, and Instagram Reels in seconds.",
    creator: "@shortsmania",
    images: ["/favicon.svg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className="bg-[#08080d] text-[#f1f1f6] antialiased selection:bg-purple-500 selection:text-white"
        suppressHydrationWarning
      >
        <div className="relative min-h-screen flex flex-col">
          {/* Background Ambient Glow Gradients */}
          <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
            <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[900px] rounded-full bg-gradient-to-tr from-purple-700/20 via-indigo-600/15 to-cyan-500/20 blur-[130px]" />
            <div className="absolute top-[600px] -right-40 h-[450px] w-[500px] rounded-full bg-gradient-to-br from-cyan-600/10 to-transparent blur-[120px]" />
          </div>

          <Navbar />
          <main className="flex-1 pb-16">{children}</main>

          <footer className="border-t border-white/[0.06] bg-[#08080d]/60 py-8 text-center text-xs text-zinc-500">
            <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span>© 2026 ShortsMania Turbo. Powered by FastAPI, FFmpeg, Next.js & Edge-TTS.</span>
              <div className="flex items-center gap-4 text-zinc-400">
                <span className="hover:text-purple-400 cursor-pointer">Documentation</span>
                <span>•</span>
                <span className="hover:text-purple-400 cursor-pointer">GitHub Workflow</span>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
