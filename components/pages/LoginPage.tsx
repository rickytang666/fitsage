import { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import SignIn from "@/components/auth/SignIn";
import { ModeToggle } from "@/components/ModeToggle";
import { IconArrowLeft } from "@tabler/icons-react";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your FitSage account to track your fitness journey.",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center p-12 sm:p-8 bg-background text-foreground">
      {/* Header with Theme Toggle */}
      <div className="fixed top-0 right-0 p-6 z-50">
        <ModeToggle />
      </div>

      <div className="w-full max-w-md mx-auto">
        {/* Back Button */}
        <div className="mb-6 sm:mb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-primary bg-accent no-underline font-medium text-sm px-4 py-2 rounded-lg bg-card border border-border transition-all duration-200 ease-in-out hover:border-primary hover:text-primary hover:-translate-y-0.5 hover:shadow-md"
          >
            <IconArrowLeft />
            <span>Back to Home</span>
          </Link>
        </div>

        <div className="text-center mb-12">
          <div className="flex items-center justify-center text-4xl font-extrabold text-primary mb-2">
            <Image
              src="/logo.svg"
              alt="FitSage Logo"
              style={{
                verticalAlign: "middle",
                marginRight: 12,
              }}
              width={48}
              height={48}
            />
            <h1>FitSage</h1>
          </div>
          <h2 className="text-lg font-medium text-foreground tracking-wide">
            Your personal fitness companion
          </h2>
        </div>

        <div className="bg-card rounded-2xl shadow-lg border border-border overflow-hidden">
          <Suspense
            fallback={
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-foreground">Loading...</p>
              </div>
            }
          >
            <SignIn />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
