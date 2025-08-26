import Link from "next/link";
import Image from "next/image";
import SignUp from "@/components/auth/SignUp";
import styles from "./SignUpPage.module.css";

export default function SignUpPage() {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {/* Back Button */}
        <div className={styles.backButton}>
          <Link href="/" className={styles.backLink}>
            ← Back to Home
          </Link>
        </div>
        <div className={styles.header}>
          <div className={styles.title}>
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
          <h2 className={styles.subtitle}>Start your fitness journey today</h2>
        </div>
        <div className={styles.formContainer}>
          <SignUp />
        </div>
      </div>
    </div>
  );
}
