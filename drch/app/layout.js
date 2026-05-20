/**
 * Layout - Root Layout Component
 * DriveChat@KMITL Application Layout
 */

import localFont from "next/font/local";
import "./globals.css";

// Custom Fonts (ฟอนต์)
const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

// Metadata (ข้อมูล SEO)
export const metadata = {
  title: "DriveChat@KMITL",
  description: "Real-time chat application for KMITL transportation",
};

// Root Layout Component
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
