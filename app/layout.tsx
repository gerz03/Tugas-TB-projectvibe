import type { Metadata } from "next";
import { AppChrome } from "@/components/chrome";
import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "FOOTBALL IDENTITY",
  description: "Football player and club identity database with Match The Player game."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppChrome>{children}</AppChrome>
      </body>
    </html>
  );
}
