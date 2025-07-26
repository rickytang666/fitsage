export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--card)] text-[var(--foreground)]">
      {children}
      
      <footer className="py-4 text-center text-sm mt-auto">
        <p>© {new Date().getFullYear()} FitSage. All rights reserved.</p>
      </footer>
    </div>
  );
}

