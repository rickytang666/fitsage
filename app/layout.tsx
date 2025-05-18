import { AuthProvider } from '@/components/auth/AuthProvider'
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// Temporarily removed AuthProvider and ErrorBoundary for routing test

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: '%s | FitSage',
    default: 'FitSage - Your Fitness Buddy',
  },
  description: 'Track your workouts, nutrition, and fitness goals with FitSage, your personal fitness companion.',
  keywords: ['fitness', 'workout', 'tracking', 'health', 'nutrition', 'exercise'],
  icons: {
    icon: '/fitsage_icon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}