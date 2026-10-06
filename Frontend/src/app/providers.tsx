'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/hooks/useAuth';
import { MobileNavProvider } from '@/hooks/useMobileNav';
import { useState } from 'react';

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000, // 30 seconds
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MobileNavProvider>
          {children}
        </MobileNavProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1a2332',
              color: '#e6edf3',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '10px',
              fontSize: '14px',
            },
            success: {
              iconTheme: { primary: '#3fb950', secondary: '#1a2332' },
            },
            error: {
              iconTheme: { primary: '#f85149', secondary: '#1a2332' },
            },
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  );
}
