import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { InstallAppBanner } from "@/components/install-app-banner";
import { ThemeProvider } from "./theme-context";
import "./globals.css";

// Runs before hydration so the correct theme is set on <html> before first
// paint — otherwise there'd be a flash of the wrong theme, since Next's
// server render can't know localStorage or the OS preference.
const ANTI_FOUC_SCRIPT = `
  (function () {
    try {
      var stored = localStorage.getItem("theme");
      var theme =
        stored === "light" || stored === "dark"
          ? stored
          : window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light";
      document.documentElement.setAttribute("data-theme", theme);
    } catch (e) {
      document.documentElement.setAttribute("data-theme", "dark");
    }
  })();
`;

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ingredas",
  description: "Turn whatever's in your kitchen into a real recipe in seconds.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${inter.variable} h-full antialiased`}
        suppressHydrationWarning
      >
        <head>
          <script dangerouslySetInnerHTML={{ __html: ANTI_FOUC_SCRIPT }} />
        </head>
        <body className="min-h-full flex flex-col">
          <ThemeProvider>
            {children}
            <InstallAppBanner />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
