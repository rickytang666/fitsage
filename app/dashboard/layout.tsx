'use client';

import Sidebar from '@/components/dashboard/Sidebar';

// Ultra minimal dashboard layout - just sidebar and content

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ 
      display: 'flex', 
      height: '100vh', 
      width: '100%'
    }}>
      {/* Sidebar */}
      <Sidebar />
      
      {/* Content */}
      <div style={{ 
        flex: 1, 
        overflow: 'auto', 
        padding: '20px'
      }}>
        {children}
      </div>
    </div>
  );
}
