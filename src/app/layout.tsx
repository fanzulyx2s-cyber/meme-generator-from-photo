import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MemePhoto AI - Browser-Based Photo Meme Maker",
  description:
    "Create memes from your photos in your browser. Add captions, emojis, and image stickers, choose a format, and export a PNG.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
