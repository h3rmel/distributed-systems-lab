import type { Metadata } from "next";
import { geistSans, geistMono } from "#/styles/fonts";
import "#/styles/globals.css";

export const metadata: Metadata = {
  title: "Live Dashboard - Distributed Systems Lab",
  description: "Real-time webhook ingestion monitoring dashboard.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
