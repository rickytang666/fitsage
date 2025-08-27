"use client";

import Link from "next/link";
import Image from "next/image";
import { ModeToggle } from "@/components/ModeToggle";

export default function IntroPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 px-8 py-4 mb-8 w-full flex justify-between items-center bg-background/50 backdrop-blur-lg">
        <div className="flex items-center gap-2">
          <Image
            src="/logo.svg"
            alt="FitSage Logo"
            className="text-3xl"
            height={40}
            width={40}
          />
          <span className="text-2xl font-bold text-primary">FitSage</span>
        </div>
        <ModeToggle />
      </header>

      {/* Hero Section */}
      <main className="mt-20 flex-1 flex items-center justify-center p-8 text-center">
        <div className="max-w-[50%] mx-auto animate-[fadeInUp_1s_ease-out]">
          <h1 className="text-5xl font-semibold text-foreground mb-4 leading-tight animate-[fadeInUp_1s_ease-out_0.2s_both]">
            Your{" "}
            <a
              href="https://deepmind.google/models/gemini/"
              target="_blank"
              className="text-primary font-extrabold underline decoration-dashed decoration-3 underline-offset-2 decoration-primary hover:cursor-pointer hover:no-underline hover:bg-primary hover:text-primary-foreground transition-all duration-300 ease-in-out animate-[fadeInUp_1s_ease-out_0.1s_both]"
            >
              AI-Powered
            </a>{" "}
            Fitness Companion
          </h1>
          <p className="text-xl text-foreground mb-8 opacity-90 leading-relaxed animate-[fadeInUp_1s_ease-out_0.4s_both]">
            Transform your fitness journey with intelligent workout tracking,
            voice-based diary entries, personalized insights, and progress
            monitoring all in one place.
          </p>

          <div
            className="grid gap-4 mb-12 max-w-4xl mx-auto animate-[fadeInUp_1s_ease-out_0.8s_both]"
            style={{
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            }}
          >
            <div className="flex flex-col items-center gap-2 p-4 bg-card rounded-xl border border-border min-w-0">
              <span className="text-3xl">📊</span>
              <span className="text-sm font-medium text-foreground text-center">
                Smart Analytics
              </span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 bg-card rounded-xl border border-border min-w-0">
              <span className="text-3xl">🎯</span>
              <span className="text-sm font-medium text-foreground text-center">
                Health Tracking
              </span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 bg-card rounded-xl border border-border min-w-0">
              <span className="text-3xl">🎤</span>
              <span className="text-sm font-medium text-foreground text-center">
                Voice Recording
              </span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 bg-card rounded-xl border border-border min-w-0">
              <span className="text-3xl">📝</span>
              <span className="text-sm font-medium text-foreground text-center">
                Workout Diary
              </span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 bg-card rounded-xl border border-border min-w-0">
              <span className="text-3xl">🤖</span>
              <span className="text-sm font-medium text-foreground text-center">
                AI Insights
              </span>
            </div>
          </div>

          <div className="flex gap-4 justify-center flex-wrap animate-[fadeInUp_1s_ease-out_0.6s_both]">
            <Link
              href="/auth/signup"
              className="bg-primary text-foreground px-8 py-3 rounded-lg font-semibold text-base no-underline transition-all duration-300 ease-in-out border-2 border-transparent shadow-md hover:scale-105 hover:shadow-lg hover:bg-ring"
            >
              Get Started Free
            </Link>
            <Link
              href="/auth/login"
              className="bg-transparent px-8 py-3 rounded-lg font-semibold text-base no-underline transition-all duration-300 ease-in-out border-2 border-ring hover:bg-ring"
            >
              Sign In
            </Link>
          </div>
        </div>
      </main>

      {/* Benefits Section */}
      <section className="py-16 px-8">
        <div className="max-w-[80%] mx-auto">
          <h2 className="text-4xl font-bold text-center text-foreground mb-12">
            Why Choose FitSage?
          </h2>
          <div
            className="grid gap-8"
            style={{
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            }}
          >
            <div className="text-center p-8 bg-card rounded-2xl shadow-md transition-transform duration-300 ease-in-out hover:-translate-y-1 border border-border">
              <div className="text-5xl mb-4">🚀</div>
              <h3 className="text-xl font-bold text-foreground mb-4">
                Easy to Use
              </h3>
              <p className="text-base text-foreground leading-relaxed opacity-80">
                Simple, intuitive interface that gets you started in minutes
              </p>
            </div>
            <div className="text-center p-8 bg-card rounded-2xl shadow-md transition-transform duration-300 ease-in-out hover:-translate-y-1 border border-border">
              <div className="text-5xl mb-4">🎤</div>
              <h3 className="text-xl font-bold text-foreground mb-4">
                Natural Voice Diary
              </h3>
              <p className="text-base text-foreground leading-relaxed opacity-80">
                Speak naturally about your workouts with real-time
                speech-to-text processing
              </p>
            </div>
            <div className="text-center p-8 bg-card rounded-2xl shadow-md transition-transform duration-300 ease-in-out hover:-translate-y-1 border border-border">
              <div className="text-5xl mb-4">🧠</div>
              <h3 className="text-xl font-bold text-foreground mb-4">
                AI-Powered
              </h3>
              <p className="text-base text-foreground leading-relaxed opacity-80">
                Get personalized recommendations based on your progress
              </p>
            </div>
            <div className="text-center p-8 bg-card rounded-2xl shadow-md transition-transform duration-300 ease-in-out hover:-translate-y-1 border border-border">
              <div className="text-5xl mb-4">📈</div>
              <h3 className="text-xl font-bold text-foreground mb-4">
                Track Progress
              </h3>
              <p className="text-base text-foreground leading-relaxed opacity-80">
                Monitor your fitness journey with detailed analytics
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-accent text-center text-foreground text-base py-6 space-y-4">
        <p>© {new Date().getFullYear()} FitSage. All rights reserved.</p>
        <p>Made with ❤️ and 💪 by the FitSage Team.</p>
        <div className="flex justify-center gap-2">
          <Image
            src="https://go-skill-icons.vercel.app/api/icons?i=nextjs&theme=dark"
            alt="nextjs"
            width={35}
            height={35}
          />
          <Image
            src="https://go-skill-icons.vercel.app/api/icons?i=supabase&theme=dark"
            alt="supabase"
            width={35}
            height={35}
          />
          <Image
            src="https://go-skill-icons.vercel.app/api/icons?i=tailwind&theme=dark"
            alt="tailwind"
            width={35}
            height={35}
          />
          <Image
            src="https://go-skill-icons.vercel.app/api/icons?i=gemini&theme=dark"
            alt="gemini"
            width={35}
            height={35}
          />
          <Image
            src="https://go-skill-icons.vercel.app/api/icons?i=hf&theme=dark"
            alt="huggingface"
            width={35}
            height={35}
          />
          <Image
            src="https://go-skill-icons.vercel.app/api/icons?i=vercel&theme=dark"
            alt="vercel"
            width={35}
            height={35}
          />
        </div>
      </footer>
    </div>
  );
}
