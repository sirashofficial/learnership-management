import type { Metadata } from "next";
import { Outfit, Lora } from "next/font/google";
import "./globals.css";
import MainLayout from "@/components/MainLayout";
import { StudentProvider } from "@/contexts/StudentContextSimple";
import { GroupsProvider } from "@/contexts/GroupsContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { Providers } from "@/components/providers";
import { AIChat } from "@/components/ai/AIChat";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import ThemeInitializer from "@/components/ThemeInitializer";

// Outfit - Modern, premium, distinctive sans-serif
const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

// Lora - Refined, editorial serif for high-contrast pairing
const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const viewport = {
  themeColor: "#0f172a",
};

export const metadata: Metadata = {
  title: "YEHA - Youth Education & Skills Management",
  description: "Comprehensive SSETA NVC Level 2 Training Management Platform",
  keywords: "SSETA,NVC,training,education,skills development",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${outfit.variable} ${lora.variable} font-sans antialiased bg-white text-slate-900`}>
        <ErrorBoundary>
          <Providers>
            <ThemeInitializer />
            <MainLayout>
              {children}
              <AIChat />
            </MainLayout>
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
