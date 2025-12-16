// layout.tsx

import "./globals.css";
import { Inter } from "next/font/google";

// Import directly from file to avoid barrel file issues
import { AppShell } from "@/components/sidebar/AppShell";
import CookieConsent from "@/components/CookieConsent";

import { GoogleAnalytics } from '@next/third-parties/google'

import { Providers } from "./providers";

export const metadata = {
  title: "Hanabira.org - Free Open Source No Ads Japanese Learning Platform",
  description: "Learn Japanese for free with Hanabira.org, an open-source platform with no ads.",
  keywords: ["Hanabira", "Japanese Learning", "JLPT", "Open Source", "No Ads"],
  authors: [{ name: "hanabira.org" }],
  applicationName: "Hanabira.org",
  robots: "index, follow",
  openGraph: {
    title: "Hanabira.org - Free Open Source No Ads Japanese Learning Platform",
    description: "Learn Japanese for free with Hanabira.org, an open-source platform with no ads.",
    url: "https://hanabira.org/",
    images: ["https://hanabira.org/path-to-your-image.jpg"],
    type: "website",
    siteName: "Hanabira.org"
  },
  twitter: {
    card: "summary_large_image",
    title: "Hanabira.org - Free Open Source No Ads Japanese Learning Platform",
    description: "Learn Japanese for free with Hanabira.org, an open-source platform with no ads.",
    url: "https://hanabira.org/",
    images: ["https://hanabira.org/path-to-your-image.jpg"]
  },
};

const GA_MEASUREMENT_ID = process.env.GA_MEASUREMENT_ID;

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <AppShell>
            {children}
          </AppShell>
          <CookieConsent />
          {GA_MEASUREMENT_ID && <GoogleAnalytics gaId={GA_MEASUREMENT_ID} />}
        </Providers>
      </body>
    </html>
  );
}
