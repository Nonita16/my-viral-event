import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { connection } from "next/server";
import "./globals.css";
import PostHogProvider from "@/components/PostHogProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import NavBar from "@/components/NavBar";

export const dynamic = "force-dynamic";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "My Viral Event",
  description: "Manage and track viral events",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Force dynamic rendering to avoid static generation issues
  connection();

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <PostHogProvider>
            <NavBar />
            <main>{children}</main>
          </PostHogProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
