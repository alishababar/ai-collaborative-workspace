import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Weave — AI Collaborative Workspace",
  description: "Talk. The AI listens. The canvas builds itself."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
