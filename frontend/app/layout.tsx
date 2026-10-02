import type { Metadata } from "next";
import "./globals.css";
import { Footer } from "@/components/Layout/footer";
import { Navbar } from "@/components/Layout/navbar";
import { AuthProvider } from "@/lib/auth-context";

export const metadata: Metadata = {
  title: "Dhaka Tesla Pool",
  description:
    "Share a seat. Split the fare. Survive Dhaka traffic. A ride-pooling MVP for passengers, drivers, and the seats in between.",
};

/**
 * The root layout owns the shell every screen inherits: the navbar, the footer,
 * and the auth provider.
 *
 * `flex min-h-full flex-col` on body plus `flex-1` on each page's Layout keeps
 * the footer pinned to the bottom on a short page instead of letting it ride up
 * next to the content.
 */
const RootLayout = ({ children }: LayoutProps<"/">) => (
  <html lang="en" data-theme="corporate" className="h-full antialiased">
    <body className="flex min-h-full flex-col bg-base-200 text-base-content">
      <AuthProvider>
        <Navbar />
        {children}
        <Footer />
      </AuthProvider>
    </body>
  </html>
);

export default RootLayout;