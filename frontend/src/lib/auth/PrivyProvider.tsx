import { PrivyProvider as PrivyAuthProvider } from '@privy-io/react-auth';
import { ReactNode } from 'react';

interface PrivyProviderProps {
  children: ReactNode;
}

export default function PrivyProvider({ children }: PrivyProviderProps) {
  const appId = import.meta.env.VITE_PRIVY_APP_ID as string;
  
  if (!appId) {
    console.error('Missing VITE_PRIVY_APP_ID environment variable');
  }

  return (
    <PrivyAuthProvider
      appId={appId}
      config={{
        appearance: {
          theme: 'dark',
          accentColor: '#3B82F6', // blue-500
          logo: 'https://api.dicebear.com/9.x/pixel-art/svg?seed=Ronso&backgroundColor=b6e3f4',
        },
        loginMethods: ['wallet', 'email', 'google', 'github'],
      }}
    >
      {children}
    </PrivyAuthProvider>
  );
} 