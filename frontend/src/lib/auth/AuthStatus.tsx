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
          className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-700 bg-transparent hover:bg-gray-800 hover:border-blue-500/50 transition-all duration-200 rounded-full font-medium"
        >
          <LogOut size={14} /> Logout
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => login()}
      className="flex items-center gap-2 px-4 py-2 text-sm bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700 transition-all duration-200 rounded-full font-medium shadow-md hover:shadow-lg hover:shadow-blue-500/20"
    >
      <LogIn size={14} /> Login
    </button>
  );
} 