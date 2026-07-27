import type { Metadata } from "next";
import { StackProvider, StackTheme } from "@stackframe/stack";
import { stackClientApp } from "../stack/client";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ConvexClientProvider from "@/components/ConvexClientProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AdminViewModeProvider } from "@/components/AdminViewModeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Tools Directory",
  description: "Discover the future of AI tools, powered by Convex + Next.js",
  icons: {
    icon: "/convex.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <StackProvider app={stackClientApp}>
          <StackTheme>
            <ConvexClientProvider>
              <AdminViewModeProvider>
                <ThemeProvider
                  attribute="class"
                  defaultTheme="light"
                  enableSystem={false}
                  disableTransitionOnChange
                >
                  {children}
                </ThemeProvider>
              </AdminViewModeProvider>
            </ConvexClientProvider>
          </StackTheme>
        </StackProvider>
      </body>
    </html>
  );
}
