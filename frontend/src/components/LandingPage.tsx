import { useNavigate } from 'react-router-dom';
import { ArrowRight, Play, ArrowUpRight, Check } from 'lucide-react';
import { getOrCreateSession } from '../lib/audioApi';
import { usePrivy } from '@privy-io/react-auth';
import AuthStatus from '../lib/auth/AuthStatus';
import { useState, useEffect } from 'react';

// Import sponsor logos
import ethGlobalLogo from '../assets/ethglobal.png';
import recallLogo from '../assets/trecll.png';
import autonomeLogo from '../assets/autonomepic.jpg';
import nethermindLogo from '../assets/nethermind.png';
import privyLogo from '../assets/privy.png';

const LandingPage = () => {
  const navigate = useNavigate();
  const { authenticated } = usePrivy();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Handle window scroll for navbar effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Animation on first load
  useEffect(() => {
    setIsLoaded(true);
  }, []);

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
    <div className="bg-black text-white min-h-screen flex flex-col overflow-x-hidden">
      {/* Navbar */}
      <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-black/80 backdrop-blur-md py-3' : 'bg-transparent py-5'}`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-violet-500">Ronso</h1>
          
          <div className="flex items-center gap-6">
            <a href="#features" className="hidden md:block text-gray-300 hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hidden md:block text-gray-300 hover:text-white transition-colors">How it works</a>
            <AuthStatus />
          </div>
        </div>
      </nav>
      
      {/* Hero Section with Gradient Background */}
      <section className="pt-32 pb-24 px-6 relative overflow-hidden">
        {/* Gradient orbs - making them animated */}
        <div className={`absolute top-10 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl transition-all duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0 translate-x-20'}`}></div>
        <div className={`absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl transition-all duration-1000 delay-300 ${isLoaded ? 'opacity-100' : 'opacity-0 -translate-x-20'}`}></div>
        
        <div className="max-w-6xl mx-auto relative z-10">
          <div className={`max-w-3xl transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <span className="text-sm font-medium bg-gradient-to-r from-blue-500 to-violet-500 py-1 px-3 rounded-full">AI-Powered Crypto Conversations</span>
            <h1 className="text-5xl md:text-7xl font-bold mt-6 leading-tight">
              Crypto Debates, <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-violet-500">Simplified</span>
            </h1>
            <p className="text-xl text-gray-400 mt-6 mb-10 max-w-xl">
              Create dynamic crypto conversations between AI hosts. Generate scripts, analyze trends, and explore perspectives with Ronso.
            </p>
            
            {authenticated ? (
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={createNewSession}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-violet-600 rounded-full font-medium hover:opacity-90 transition-all duration-200 flex items-center justify-center gap-2 text-white hover:shadow-lg hover:shadow-blue-500/20"
                >
                  New Newsroom <ArrowRight size={16} />
                </button>
                <button
                  onClick={goToSessions}
                  className="px-6 py-3 bg-transparent border border-gray-700 rounded-full font-medium hover:bg-gray-900 transition-all duration-200 text-white hover:border-blue-500/50"
                >
                  View Newsrooms
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center sm:items-start">
                <p className="mb-6 text-gray-400">Sign in to create and manage crypto newsrooms</p>
                <AuthStatus />
              </div>
            )}
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-gradient-to-b from-black to-gray-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">Generate <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-violet-500">powerful crypto debates</span></h2>
            <p className="text-gray-400 mt-4 max-w-xl mx-auto">Our platform enables you to create dynamic conversations between AI hosts.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-blue-500/50 transition-all duration-300 hover:translate-y-[-5px]">
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mb-4">
                <Play size={20} className="text-blue-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">Generate Scripts</h3>
              <p className="text-gray-400">Create engaging conversation scripts between multiple AI hosts discussing crypto topics.</p>
            </div>
            
            {/* Feature 2 */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-blue-500/50 transition-all duration-300 hover:translate-y-[-5px]">
              <div className="w-12 h-12 rounded-full bg-violet-500/20 flex items-center justify-center mb-4">
                <ArrowUpRight size={20} className="text-violet-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">AI Hosts</h3>
              <p className="text-gray-400">Each host has a unique personality and expertise to enrich the conversation.</p>
            </div>
            
            {/* Feature 3 */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-blue-500/50 transition-all duration-300 hover:translate-y-[-5px]">
              <div className="w-12 h-12 rounded-full bg-pink-500/20 flex items-center justify-center mb-4">
                <Check size={20} className="text-pink-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">Audio Generation</h3>
              <p className="text-gray-400">Turn your scripts into realistic audio conversations with natural sounding voices.</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Demo Section */}
      <section id="how-it-works" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-12 items-center">
            <div className="flex-1">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">How it <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-violet-500">works</span></h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-500 font-bold">1</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Create a Newsroom</h3>
                    <p className="text-gray-400">Start by creating a new crypto newsroom session.</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-violet-500 font-bold">2</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Generate the Script</h3>
                    <p className="text-gray-400">Our AI will create a dynamic conversation between hosts with different perspectives.</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-pink-500 font-bold">3</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Listen and Share</h3>
                    <p className="text-gray-400">Play the audio and share your crypto newsroom with others.</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Mockup Display */}
            <div className="flex-1 bg-gray-900 border border-gray-800 rounded-xl overflow-hidden transform hover:scale-[1.02] transition-all duration-300 shadow-xl shadow-blue-900/10">
              <div className="p-6">
                <div className="flex justify-around items-center py-4">
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-blue-500 animate-pulse">
                      <img
                        src="https://api.dicebear.com/9.x/pixel-art/svg?seed=Alex&backgroundColor=b6e3f4"
                        alt="Alex"
                        className="w-full h-full"
                      />
                    </div>
                    <span className="mt-2 text-sm font-medium">Alex</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-violet-500">
                      <img
                        src="https://api.dicebear.com/9.x/pixel-art/svg?seed=Morgan&backgroundColor=d8b4fe"
                        alt="Morgan"
                        className="w-full h-full"
                      />
                    </div>
                    <span className="mt-2 text-sm font-medium">Morgan</span>
                  </div>
                </div>
                <div className="mt-8 space-y-4">
                  <div className="bg-gray-800 p-3 rounded-lg rounded-tl-none max-w-[80%] animate-fadeIn">
                    <p className="text-sm">Today we're discussing the latest developments in Ethereum's ecosystem.</p>
                  </div>
                  <div className="bg-gray-800 p-3 rounded-lg rounded-tr-none max-w-[80%] ml-auto animate-fadeIn animation-delay-300">
                    <p className="text-sm">I've been monitoring the ETH price action, and it's showing some interesting patterns after the recent update.</p>
                  </div>
                </div>
                <div className="mt-6 flex justify-center">
                  <button className="p-3 bg-gradient-to-r from-blue-500 to-violet-600 rounded-full hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300">
                    <Play size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-violet-500/10"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready to create your first crypto newsroom?</h2>
          <p className="text-gray-400 mb-10 text-lg">Join Ronso today and start generating engaging crypto conversations.</p>
          
          {authenticated ? (
            <button
              onClick={createNewSession}
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-violet-600 rounded-full font-medium hover:opacity-90 transition-all duration-200 flex items-center justify-center gap-2 mx-auto hover:shadow-lg hover:shadow-blue-500/20"
            >
              Get Started <ArrowRight size={18} />
            </button>
          ) : (
            <div className="transform hover:scale-105 transition-transform duration-300">
              <AuthStatus />
            </div>
          )}
        </div>
      </section>
      
      {/* Sponsors Section */}
      <section className="py-20 px-6 bg-gradient-to-b from-gray-900/80 to-black border-y border-gray-800">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-lg font-medium bg-gradient-to-r from-blue-500 to-violet-500 py-1 px-3 rounded-full mb-4 inline-block">Our Partners</span>
            <p className="text-gray-400 max-w-lg mx-auto">Proudly supported by leading organizations in the blockchain and AI ecosystem</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center justify-items-center">
            {/* ETHGlobal */}
            <a href="https://ethglobal.com" target="_blank" rel="noopener noreferrer" className="bg-gray-900/80 p-5 rounded-xl hover:bg-gray-800 transition-all duration-300 flex flex-col items-center justify-center h-32 w-full border border-gray-700 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-900/20 group">
              <div className="h-14 w-full flex items-center justify-center mb-3">
                <img 
                  src={ethGlobalLogo} 
                  alt="ETHGlobal" 
                  className="h-12 max-w-full object-contain"
                />
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors duration-300">ETHGlobal</h3>
            </a>
            
            {/* Recall */}
            <a href="https://recall.ai" target="_blank" rel="noopener noreferrer" className="bg-gray-900/80 p-5 rounded-xl hover:bg-gray-800 transition-all duration-300 flex flex-col items-center justify-center h-32 w-full border border-gray-700 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-900/20 group">
              <div className="h-14 w-full flex items-center justify-center mb-3">
                <img 
                  src={recallLogo} 
                  alt="Recall" 
                  className="h-12 max-w-full object-contain"
                />
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors duration-300">Recall</h3>
            </a>
            
            {/* Autonome */}
            <a href="https://autonome.ai" target="_blank" rel="noopener noreferrer" className="bg-gray-900/80 p-5 rounded-xl hover:bg-gray-800 transition-all duration-300 flex flex-col items-center justify-center h-32 w-full border border-gray-700 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-900/20 group">
              <div className="h-14 w-full flex items-center justify-center mb-3">
                <img 
                  src={autonomeLogo} 
                  alt="Autonome" 
                  className="h-10 max-w-full object-contain"
                />
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors duration-300">Autonome</h3>
            </a>
            
            {/* Nethermind */}
            <a href="https://nethermind.io" target="_blank" rel="noopener noreferrer" className="bg-gray-900/80 p-5 rounded-xl hover:bg-gray-800 transition-all duration-300 flex flex-col items-center justify-center h-32 w-full border border-gray-700 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-900/20 group">
              <div className="h-14 w-full flex items-center justify-center mb-3">
                <img 
                  src={nethermindLogo} 
                  alt="Nethermind" 
                  className="h-12 max-w-full object-contain"
                />
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors duration-300">Nethermind</h3>
            </a>            
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-12 border-t border-gray-800">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-violet-500">Ronso</h2>
              <p className="text-gray-400 mt-2">AI-powered crypto conversations</p>
            </div>
            
            <div className="flex flex-col md:flex-row gap-8">
              <div>
                <h3 className="text-sm font-bold uppercase text-gray-400 mb-4">Product</h3>
                <ul className="space-y-2">
                  <li><a href="#features" className="text-gray-400 hover:text-white transition-colors">Features</a></li>
                  <li><a href="#how-it-works" className="text-gray-400 hover:text-white transition-colors">How it works</a></li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-sm font-bold uppercase text-gray-400 mb-4">Legal</h3>
                <ul className="space-y-2">
                  <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Terms of Service</a></li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500 text-sm">© {new Date().getFullYear()} Ronso. All rights reserved.</p>
            
            <div className="flex gap-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-white transition-colors hover:scale-110 transform duration-200">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd"></path>
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors hover:scale-110 transform duration-200">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors hover:scale-110 transform duration-200">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"></path>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>

       {/* Add custom animations to tailwind */}
       <style>{`
         @keyframes fadeIn {
           from { opacity: 0; transform: translateY(10px); }
           to { opacity: 1; transform: translateY(0); }
         }
         .animate-fadeIn {
           animation: fadeIn 0.5s ease-out forwards;
         }
         .animation-delay-300 {
           animation-delay: 0.3s;
         }
         .animate-pulse {
           animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
         }
         @keyframes pulse {
           0%, 100% { opacity: 1; }
           50% { opacity: .7; }
         }
       `}</style>
    </div>
  );
};

export default LandingPage;