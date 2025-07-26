import { AuthProvider } from '@/components/auth/AuthProvider'
import LayoutWrapper from '@/components/LayoutWrapper'
import type { Metadata } from "next";
import "./globals.css";

// Import request monitor for debugging (development only)
import '@/utils/request-monitor';

export const metadata: Metadata = {
  title: {
    template: '%s | FitSage',
    default: 'FitSage',
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&display=swap" rel="stylesheet" />
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