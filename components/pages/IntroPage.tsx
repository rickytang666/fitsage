"use client";

import Link from "next/link";
import Image from "next/image";
import styles from "./IntroPage.module.css";

export default function IntroPage() {
  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.logo}>
          <Image
            src="/logo.svg"
            alt="FitSage Logo"
            className={styles.logoIcon}
            height={40}
            width={40}
          />
          <span className={styles.logoText}>FitSage</span>
        </div>
      </header>

      {/* Hero Section */}
      <main className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            Your{" "}
            <a
              href="https://deepmind.google/models/gemini/"
              target="_blank"
              className={styles.tech}
            >
              AI-Powered
            </a>{" "}
            Fitness Companion
          </h1>
          <p className={styles.heroSubtitle}>
            Transform your fitness journey with intelligent workout tracking,
            voice-based diary entries, personalized insights, and progress
            monitoring all in one place.
          </p>

          <div className={styles.features}>
            <div className={styles.feature}>
              <span className={styles.featureIcon}>📊</span>
              <span className={styles.featureText}>Smart Analytics</span>
            </div>
            <div className={styles.feature}>
              <span className={styles.featureIcon}>🎯</span>
              <span className={styles.featureText}>Health Tracking</span>
            </div>
            <div className={styles.feature}>
              <span className={styles.featureIcon}>🎤</span>
              <span className={styles.featureText}>Voice Recording</span>
            </div>
            <div className={styles.feature}>
              <span className={styles.featureIcon}>📝</span>
              <span className={styles.featureText}>Workout Diary</span>
            </div>
            <div className={styles.feature}>
              <span className={styles.featureIcon}>🤖</span>
              <span className={styles.featureText}>AI Insights</span>
            </div>
          </div>

          <div className={styles.ctaButtons}>
            <Link href="/auth/signup" className={styles.primaryButton}>
              Get Started Free
            </Link>
            <Link href="/auth/login" className={styles.secondaryButton}>
              Sign In
            </Link>
          </div>
        </div>
      </main>

      {/* Benefits Section */}
      <section className={styles.benefits}>
        <div className={styles.benefitsContainer}>
          <h2 className={styles.benefitsTitle}>Why Choose FitSage?</h2>
          <div className={styles.benefitsGrid}>
            <div className={styles.benefitCard}>
              <div className={styles.benefitIcon}>🚀</div>
              <h3 className={styles.benefitTitle}>Easy to Use</h3>
              <p className={styles.benefitDescription}>
                Simple, intuitive interface that gets you started in minutes
              </p>
            </div>
            <div className={styles.benefitCard}>
              <div className={styles.benefitIcon}>🎤</div>
              <h3 className={styles.benefitTitle}>Natural Voice Diary</h3>
              <p className={styles.benefitDescription}>
                Speak naturally about your workouts with real-time
                speech-to-text processing
              </p>
            </div>
            <div className={styles.benefitCard}>
              <div className={styles.benefitIcon}>🧠</div>
              <h3 className={styles.benefitTitle}>AI-Powered</h3>
              <p className={styles.benefitDescription}>
                Get personalized recommendations based on your progress
              </p>
            </div>
            <div className={styles.benefitCard}>
              <div className={styles.benefitIcon}>📈</div>
              <h3 className={styles.benefitTitle}>Track Progress</h3>
              <p className={styles.benefitDescription}>
                Monitor your fitness journey with detailed analytics
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>© {new Date().getFullYear()} FitSage. All rights reserved.</p>
        <p>Made with ❤️ and 💪 by the FitSage Team.</p>
        <div className={styles.techStack}>
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
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Google-gemini-icon.svg/1024px-Google-gemini-icon.svg.png?20240826133250"
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
