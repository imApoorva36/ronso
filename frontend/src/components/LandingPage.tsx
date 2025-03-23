import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { getOrCreateSession } from '../lib/audioApi';
import { usePrivy } from '@privy-io/react-auth';
import AuthStatus from '../lib/auth/AuthStatus';

const LandingPage = () => {
  const navigate = useNavigate();
  const { ready, authenticated } = usePrivy();

  const createNewSession = async () => {
    try {
      const sessionId = await getOrCreateSession(undefined, true);
      navigate(`/crypto-newsroom/${sessionId}`);
    } catch (error) {
      console.error('Error creating session:', error);
    }
  };

  const goToSessions = () => {
    navigate('/sessions');
  };

  return (
    <div className="bg-black text-white min-h-screen flex flex-col">
      {/* Header with Auth Status */}
      <header className="border-b border-gray-800 p-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Ronso</h1>
          <AuthStatus />
        </div>
      </header>
      
      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        <div className="max-w-2xl w-full text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-white">
            Ronso
          </h1>
          <p className="text-lg text-gray-400 mb-10">
            AI-powered crypto conversations, simplified.
          </p>
          
          {authenticated ? (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={createNewSession}
                className="px-6 py-3 bg-blue-500 rounded-full font-medium hover:bg-blue-600 transition-all duration-200 flex items-center justify-center gap-2"
              >
                New Newsroom <ArrowRight size={16} />
              </button>
              <button
                onClick={goToSessions}
                className="px-6 py-3 bg-transparent border border-gray-700 rounded-full font-medium hover:bg-gray-900 transition-all duration-200"
              >
                View Newsrooms
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <p className="mb-6 text-gray-400">Sign in to create and manage crypto newsrooms</p>
              <AuthStatus />
            </div>
          )}
        </div>

        {/* Simple Preview */}
        <div className="mt-16 w-full max-w-md mx-auto bg-gray-900 rounded-xl overflow-hidden border border-gray-800">
          <div className="p-6">
            <div className="flex justify-around items-center py-4">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full overflow-hidden">
                  <img
                    src="https://api.dicebear.com/9.x/pixel-art/svg?seed=Alex&backgroundColor=b6e3f4"
                    alt="Alex"
                    className="w-full h-full"
                  />
                </div>
                <span className="mt-2 text-sm text-gray-400">Alex</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full overflow-hidden">
                  <img
                    src="https://api.dicebear.com/9.x/pixel-art/svg?seed=Morgan&backgroundColor=d8b4fe"
                    alt="Morgan"
                    className="w-full h-full"
                  />
                </div>
                <span className="mt-2 text-sm text-gray-400">Morgan</span>
              </div>
            </div>
            <div className="mt-4 flex justify-center">
              <button className="p-2 bg-blue-500 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-6 border-t border-gray-800">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-gray-600 text-sm">© {new Date().getFullYear()} Ronso</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;