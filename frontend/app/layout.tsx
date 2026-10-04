import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Chrome } from "@/components/Layout/chrome";
import { AuthProvider } from "@/lib/auth-context";

/**
 * Figtree for interface text, Outfit for headings and figures.
 *
 * These are `local`, not `next/font/google`, on purpose. A Google font would be
 * downloaded during `next build`, and the container build has to work with no
 * network - a build-time fetch is exactly the dependency that used to break it.
 * The `.woff2` files are committed under `public/fonts/` and are *variable*
 * (Figtree 300-900, Outfit 100-900), so the dashboard's `650` and `750` weights
 * render as real weights instead of being synthesised by the browser from 600
 * and 700.
 *
 * `next/font/local` hashes the files and self-hosts them from the build output,
 * so nothing here is served out of `public/` at runtime.
 */
const figtree = localFont({
  src: "../public/fonts/figtree-latin-var.woff2",
  variable: "--font-figtree",
  display: "swap",
  weight: "300 900",
});

const outfit = localFont({
  src: "../public/fonts/outfit-latin-var.woff2",
  variable: "--font-outfit",
  display: "swap",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Dhaka Tesla Pool",
  description:
    "Share a seat. Split the fare. Survive Dhaka traffic. A ride-pooling MVP for passengers, drivers, and the seats in between.",
};

/**
 * The root layout owns the shell every screen inherits: the chrome, and the auth
 * provider.
 *
 * `Chrome` renders the navbar and footer for every route except `/dashboard`,
 * which supplies its own navigation rail, so the rule about which pages get the
 * standard chrome lives in one component instead of in this layout.
 *
 * `flex min-h-full flex-col` on body plus `flex-1` on each page's Layout keeps
 * the footer pinned to the bottom on a short page instead of letting it ride up
 * next to the content.
 */
const RootLayout = ({ children }: LayoutProps<"/">) => (
  <html
    lang="en"
    data-theme="corporate"
    className={`${figtree.variable} ${outfit.variable} h-full antialiased`}
  >
    <body className="flex min-h-full flex-col bg-base-200 text-base-content">
      <AuthProvider>
        <Chrome>{children}</Chrome>
      </AuthProvider>
    </body>
  </html>
);

export default RootLayout;