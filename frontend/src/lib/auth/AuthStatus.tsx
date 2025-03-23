import { usePrivy } from '@privy-io/react-auth';
import { LogOut, LogIn } from 'lucide-react';

export default function AuthStatus() {
  const { ready, authenticated, user, login, logout } = usePrivy();

  if (!ready) {
    return null;
  }

  if (authenticated) {
    return (
      <div className="flex items-center gap-3">
        <div className="text-sm text-gray-400">
            {user?.email?.address ? (
              <span>{user.email.address}</span>
            ) : (
              <span>{user?.wallet?.address}</span>
            )}
        </div>
        <button
          onClick={() => logout()}
          className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-800 hover:bg-gray-700 transition-colors rounded-full"
        >
          <LogOut size={14} /> Logout
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => login()}
      className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 transition-colors rounded-full"
    >
      <LogIn size={14} /> Login
    </button>
  );
} 