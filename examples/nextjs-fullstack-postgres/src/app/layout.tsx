import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Guestbook",
  description: "Leave a message in the guestbook.",
  icons: "/favicon.svg",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
