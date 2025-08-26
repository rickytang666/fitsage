import { AuthProvider } from "@/components/auth/AuthProvider";
import LayoutWrapper from "@/components/LayoutWrapper";
import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-plus-jakarta-sans",
});

export const metadata: Metadata = {
  title: {
    template: "%s | FitSage",
    default: "FitSage",
  },
  description:
    "Track your workouts, nutrition, and fitness goals with FitSage, your personal fitness companion.",
  keywords: [
    "fitness",
    "workout",
    "tracking",
    "health",
    "nutrition",
    "exercise",
  ],
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={plusJakartaSans.variable}>
      <head></head>
      <body>
        <AuthProvider>
          <LayoutWrapper>{children}</LayoutWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
