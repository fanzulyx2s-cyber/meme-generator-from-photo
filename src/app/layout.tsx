import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Meme Generator from Photo",
  description:
    "Create photo memes in your browser with local Canvas processing and PNG download.",
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
