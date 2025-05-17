export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {children}
      
      <footer className="py-4 text-center text-sm text-gray-500 mt-auto">
        <p>© {new Date().getFullYear()} FitSage. All rights reserved.</p>
      </footer>
    </div>
  );
}

