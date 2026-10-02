import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dhaka Tesla Pool",
  description:
    "Share a seat. Split the fare. Survive Dhaka traffic. A ride-pooling MVP for passengers, drivers, and the seats in between.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-white text-zinc-900">{children}</body>
    </html>
  );
}