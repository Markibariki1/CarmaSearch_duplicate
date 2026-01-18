'use client';

import { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';

export default function LoginPage() {
  const { isAuthenticated } = useAuth();
  
  useEffect(() => {
    if (isAuthenticated) {
      // If user is already authenticated, redirect to account
      window.location.href = '/account';
    } else {
      // If not authenticated, redirect back to homepage
      // The homepage will show the auth modal
      window.location.href = '/';
    }
  }, [isAuthenticated]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Redirecting...</h1>
        <p className="text-muted-foreground">
          {isAuthenticated ? 'Taking you to your account' : 'Returning to homepage'}
        </p>
      </div>
    </div>
  );
}
