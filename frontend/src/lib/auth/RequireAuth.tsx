import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { usePrivy } from '@privy-io/react-auth';

interface RequireAuthProps {
  children: ReactNode;
}

export default function RequireAuth({ children }: RequireAuthProps) {
  const { ready, authenticated } = usePrivy();
  const location = useLocation();

  // If Privy is still initializing, show a loading state
  if (!ready) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is not authenticated, redirect to login with the return path
  if (!authenticated) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  // If user is authenticated, render the protected route
  return <>{children}</>;
} 