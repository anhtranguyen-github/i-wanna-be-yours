// layout.tsx

import "./globals.css";
import { Inter } from "next/font/google";

// Import directly from file to avoid barrel file issues
import { AppShell } from "@/components/sidebar/AppShell";
import CookieConsent from "@/components/CookieConsent";
import { GlobalAuthProvider } from "@/context/GlobalAuthContext";
import GlobalAuthModal from "@/components/auth/GlobalAuthModal";

import { GoogleAnalytics } from '@next/third-parties/google'

import { Providers } from "./providers";
import { ChatLayoutProvider } from "@/components/chat/ChatLayoutContext";

export const metadata = {
  title: "hanachan.org - Free Open Source No Ads Japanese Learning Platform",
  description: "Learn Japanese for free with hanachan.org, an open-source platform with no ads.",
  keywords: ["hanachan", "Japanese Learning", "JLPT", "Open Source", "No Ads"],
  authors: [{ name: "hanachan.org" }],
  applicationName: "hanachan.org",
  robots: "index, follow",
  openGraph: {
    title: "hanachan.org - Free Open Source No Ads Japanese Learning Platform",
    description: "Learn Japanese for free with hanachan.org, an open-source platform with no ads.",
    url: "https://hanachan.org/",
    images: ["https://hanachan.org/path-to-your-image.jpg"],
    type: "website",
    siteName: "hanachan.org"
  },
  twitter: {
    card: "summary_large_image",
    title: "hanachan.org - Free Open Source No Ads Japanese Learning Platform",
    description: "Learn Japanese for free with hanachan.org, an open-source platform with no ads.",
    url: "https://hanachan.org/",
    images: ["https://hanachan.org/path-to-your-image.jpg"]
  },
};

const GA_MEASUREMENT_ID = process.env.GA_MEASUREMENT_ID;

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <GlobalAuthProvider>
            <GlobalAuthModal />
            <ChatLayoutProvider>
              <AppShell>
                {children}
              </AppShell>
            </ChatLayoutProvider>
            <CookieConsent />
            {GA_MEASUREMENT_ID && <GoogleAnalytics gaId={GA_MEASUREMENT_ID} />}
          </GlobalAuthProvider>
        </Providers>
      </body>
    </html>
  );
}
