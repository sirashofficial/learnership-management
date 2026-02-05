import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { StudentProvider } from "@/contexts/StudentContextSimple";
import { GroupsProvider } from "@/contexts/GroupsContext";

const inter = Inter({ subsets: ["latin"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: "YEHA - Youth Education & Skills Management",
  description: "Comprehensive SSETA NVC Level 2 Training Management Platform",
  keywords: "SSETA,NVC,training,education,skills development",
  themeColor: "#1a3c27",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.variable} font-sans antialiased bg-background text-text`}>
        <GroupsProvider>
          <StudentProvider>
            <div className="min-h-screen bg-background">
              <Sidebar />
              <main className="transition-all duration-300 lg:ml-64">
                {children}
              </main>
            </div>
          </StudentProvider>
        </GroupsProvider>
      </body>
    </html>
  );
}
