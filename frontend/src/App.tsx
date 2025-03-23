import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import './App.css';
import CryptoNewsroom from './components/CryptoNewsroom/CryptoNewsroom';
import { getAllSessions, getOrCreateSession } from './lib/audioApi';
import { Home, Search, Users, XIcon } from "lucide-react";
import LandingPage from './components/LandingPage';
import PrivyProvider from './lib/auth/PrivyProvider';
import RequireAuth from './lib/auth/RequireAuth';
import AuthStatus from './lib/auth/AuthStatus';

// Session list component
const SessionList = () => {
  const [sessions, setSessions] = useState<Array<{sessionId: string; name: string; createdAt: string}>>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const sessionData = await getAllSessions();
        setSessions(sessionData);
      } catch (error) {
        console.error('Error fetching sessions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, []);

  const createNewSession = async () => {
    try {
      setLoading(true);
      const sessionId = await getOrCreateSession(undefined, true);
      navigate(`/crypto-newsroom/${sessionId}`);
    } catch (error) {
      console.error('Error creating session:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen bg-black text-white">Loading sessions...</div>;
  }

  return (
    <div className="flex min-h-screen bg-black text-white">
      {/* Left Sidebar */}
      <div className="w-64 border-r border-gray-800 p-4 flex flex-col justify-between">
        <div className="space-y-6">
          <div className="p-2 flex justify-between items-center">
            <AuthStatus />
          </div>

          <nav className="space-y-4">
            <Link to="/" className="flex items-center gap-4 text-xl hover:bg-gray-900 p-2 rounded-full">
              <Home className="h-6 w-6" />
              <span>Home</span>
            </Link>
            <a href="#" className="flex items-center gap-4 text-xl hover:bg-gray-900 p-2 rounded-full">
              <Search className="h-6 w-6" />
              <span>Explore</span>
            </a>
            <Link to="/sessions" className="flex items-center gap-4 text-xl hover:bg-gray-900 p-2 rounded-full">
              <Users className="h-6 w-6" />
              <span>Newsrooms</span>
            </Link>
          </nav>
        </div>

        <button 
          onClick={createNewSession}
          className="bg-blue-500 text-white rounded-full py-3 px-4 font-bold w-full cursor-pointer"
        >
          Create Newsroom
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 border-r border-gray-800">
        {/* Header */}
        <div className="border-b border-gray-800 p-4">
          <h1 className="text-xl font-bold">Crypto Newsrooms</h1>
        </div>

        {/* Sessions List */}
        <div className="divide-y divide-gray-800">
          {sessions.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <p>No newsrooms found. Create your first one!</p>
            </div>
          ) : (
            sessions.map(session => (
              <div 
                key={session.sessionId} 
                className="p-4 hover:bg-gray-900/50 transition-colors"
              >
                <div className="flex">
                  <div className="mr-4">
                    <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden">
                      <img
                        src={`https://api.dicebear.com/9.x/pixel-art/svg?seed=${session.sessionId}`}
                        alt="Newsroom"
                        className="object-cover w-10 h-10"
                      />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center">
                      <span className="font-bold">{session.name}</span>
                      <span className="text-gray-500 ml-2">
                        · {new Date(session.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="mt-2">
                      <p className="text-gray-400">Crypto newsroom session</p>
                      <div className="mt-4">
                        <Link 
                          to={`/crypto-newsroom/${session.sessionId}`}
                          className="text-blue-500 hover:underline"
                        >
                          Open Newsroom
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="hidden lg:block w-80 p-4">
        <div className="bg-gray-900 rounded-2xl p-4 mb-4">
          <h2 className="text-xl font-bold mb-2">What's happening</h2>
          <p className="text-gray-400">Create a new crypto newsroom to simulate a conversation between hosts.</p>
        </div>
      </div>
    </div>
  );
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route 
        path="/sessions" 
        element={
          <RequireAuth>
            <SessionList />
          </RequireAuth>
        } 
      />
      <Route 
        path="/crypto-newsroom/:sessionId" 
        element={
          <RequireAuth>
            <CryptoNewsroom />
          </RequireAuth>
        } 
      />
      <Route 
        path="/crypto-newsroom" 
        element={
          <RequireAuth>
            <CryptoNewsroom />
          </RequireAuth>
        } 
      />
    </Routes>
  );
}

function App() {
  return (
    <PrivyProvider>
      <Router>
        <AppRoutes />
      </Router>
    </PrivyProvider>
  );
}

export default App;
