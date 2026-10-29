import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import { Header } from "@/components/layout/Header";
import "./globals.css";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  verification: { google: "r4vs5K6kyRpFbT2eQ3xlFxlQbUmRrk_8z6irkNv4HmM" },
  title: {
    default: "Scale Compass｜コード進行から使えるスケールを提案",
    template: "%s｜Scale Compass",
  },
  description:
    "Scale Compass（スケールコンパス）は、コード進行を入力すると各コードで使えるスケールを理由つきで提案し、ギター／ベースの指板とタブ譜で確認できる Web アプリです。",
  applicationName: "Scale Compass",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f7f5" },
    { media: "(prefers-color-scheme: dark)", color: "#121317" },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja" suppressHydrationWarning className="h-full">
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Header />
          <main
            id="main"
            className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6"
          >
            {children}
          </main>
          <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
            Scale Compass —
            コード進行の中で「どのスケールを使えばいいか」の道しるべ
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
