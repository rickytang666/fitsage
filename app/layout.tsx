import { AuthProvider } from '@/components/auth/AuthProvider'
import LayoutWrapper from '@/components/LayoutWrapper'
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// Import request monitor for debugging (development only)
import '@/utils/request-monitor';

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
    icon: '/logo.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&" />
      </head>
      <body>
        <AuthProvider>
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}