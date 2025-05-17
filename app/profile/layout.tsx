'use client';

import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        {children}
      </div>
    </ProtectedRoute>
  );
}

