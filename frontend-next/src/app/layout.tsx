// layout.tsx

import "./globals.css";
import { Inter } from "next/font/google";

// import Nav from "@/components/Nav";
// import DashboardNav from "@/components/DashboardNav";
// import Sidebar from "@/components/Sidebar";
// import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
// import Footer from "@/components/Footer"; // Removed - no longer using footer
import CookieConsent from "@/components/CookieConsent";

import Script from "next/script";
// import Head from "next/head";  // REMOVED

import { GoogleAnalytics } from '@next/third-parties/google'
import { GoogleTagManager } from '@next/third-parties/google'

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

// we use config.json now instead, keeping it commented here, it is public anyways
// const GA_MEASUREMENT_ID = "G-P4SLLVSNCX"; // your hanabira.org code

// Import the config file
//import config from "@/../config.json"; // Adjust the path if needed
//const GA_MEASUREMENT_ID = config.GA_MEASUREMENT_ID; // Use the value from config.json

const GA_MEASUREMENT_ID = process.env.GA_MEASUREMENT_ID;




const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      {/* Head tags removed; see metadata above */}
      <body className={inter.className}>
        <Providers>
          {/* Page Layout - Redesigned: Fixed Sidebar + Main Content */}
          <div className="flex bg-slate-50 min-h-screen text-brand-dark">
            <Sidebar />
            <div className="flex-1 ml-32 flex flex-col min-h-screen transition-all duration-300">
              <div className="flex-1 overflow-auto">
                {children}
              </div>
            </div>
          </div>
          <CookieConsent />
          {GA_MEASUREMENT_ID && <GoogleAnalytics gaId={GA_MEASUREMENT_ID} />}
          {/* <GoogleTagManager gtmId={GA_MEASUREMENT_ID} /> */}
        </Providers>
      </body>
    </html>
  );
}




























// decently functioning stuff

// import "./globals.css";
// import type { Metadata } from "next";
// import { Inter } from "next/font/google";

// import Nav from "@/components/Nav";
// import DashboardNav from "@/components/DashboardNav";
// import Sidebar from "@/components/Sidebar";
// import Footer from "@/components/Footer";
// import CookieConsent from "@/components/CookieConsent";

// import { Html, Head, Main, NextScript } from 'next/document';


// import Script from "next/script";
// const GA_MEASUREMENT_ID = "G-P4SLLVSNCX"; //my hanabira.org code
// //const GA_MEASUREMENT_ID = "G-27EKDKSDWE"; // zen-lingo.com


// const inter = Inter({ subsets: ["latin"] });

// export const metadata: Metadata = {
//   title: "hanabira.org",
//   description: "Your path to Japanese fluency (JLPT N5-N1).",
// };

// export default function RootLayout({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   return (
//     <html lang="en">
//       <head>
//         <base href="/" />

//         <meta property="og:title" content="Hanabira.org - Free Open Source No Ads Japanese Learning Platform" />
//         <meta property="og:description" content="Learn Japanese for free with Hanabira.org, an open-source platform with no ads." />
//         <meta property="og:url" content="https://hanabira.org" />
//         <meta property="og:type" content="website" />
//         {/* Optionally include an image */}
//         <meta property="og:image" content="https://hanabira.org/path-to-your-image.jpg" />


//       </head>
//       <Script
//         src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
//         strategy="afterInteractive"
//       />
//       <Script id="google-analytics" strategy="afterInteractive">
//         {`
//           window.dataLayer = window.dataLayer || [];
//           function gtag(){window.dataLayer.push(arguments);}
//           gtag('js', new Date());
//           gtag('config', '${GA_MEASUREMENT_ID}');
//         `}
//       </Script>


//       <body className={inter.className}>
//             <div className="h-full grid lg:grid-cols-body overflow-auto">
//               <Sidebar />
//               <div className="flex flex-col h-full">
//                 <Nav />
//                 <DashboardNav />
//                 {children}
//               </div>
//             </div>
//           <Footer />
//           <CookieConsent />
//       </body>
//     </html>
//   );
// }
