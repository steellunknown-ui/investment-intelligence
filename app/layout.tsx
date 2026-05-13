import "./globals.css";
import type { Metadata } from "next";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Investment Intelligence | Secure Portfolio Monitoring",
  description: "Advanced investment portfolio intelligence platform with secure nominee access and inactivity protection.",
  keywords: ["investments", "portfolio", "nominee access", "financial security", "asset management"],
  authors: [{ name: "Investment Intelligence Team" }],
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            try {
              var theme = localStorage.getItem('theme') || 'light';
              var colorTheme = localStorage.getItem('colorTheme') || 'infinix-2';
              if (theme === 'dark') document.documentElement.classList.add('dark');
              document.documentElement.classList.add('theme-' + colorTheme);
            } catch (e) {}
          })()
        ` }} />
      </head>
      <body>
        <ThemeProvider>
          {children}
          <Toaster position="top-right" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
