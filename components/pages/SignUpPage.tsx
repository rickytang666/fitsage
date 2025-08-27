import Link from "next/link";
import Image from "next/image";
import SignUp from "@/components/auth/SignUp";
import { ModeToggle } from "@/components/ModeToggle";
import { IconArrowLeft } from "@tabler/icons-react";

export default function SignUpPage() {
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
            Start your fitness journey today
          </h2>
        </div>

        <div className="bg-card rounded-2xl shadow-lg border border-border overflow-hidden">
          <SignUp />
        </div>
      </div>
    </div>
  );
}
