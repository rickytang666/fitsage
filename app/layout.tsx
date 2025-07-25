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
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}