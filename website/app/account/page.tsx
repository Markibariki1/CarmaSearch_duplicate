'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import AccountForm from './account-form';

export default function AccountPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  console.log('Account Page Debug:', { user, isAuthenticated, loading });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      console.log('Redirecting to homepage - not authenticated');
      // Show a better redirect experience
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    }
  }, [loading, isAuthenticated]);

  // Show loading while checking authentication
  if (loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading...</h1>
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Show redirect message for unauthenticated users
  if (!loading && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please Sign In</h1>
          <p className="text-muted-foreground mb-4">You need to be signed in to access your account.</p>
          <p className="text-sm text-muted-foreground">Redirecting to homepage...</p>
          <p className="text-xs text-muted-foreground mt-4">Debug: {JSON.stringify({ isAuthenticated, user: !!user, loading })}</p>
        </div>
      </div>
    );
  }

  // Show content for authenticated users
  if (isAuthenticated && user) {
    return <AccountForm user={user} />;
  }

  return null;
}
