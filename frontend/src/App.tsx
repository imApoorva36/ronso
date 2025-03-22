import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import TweetList from './components/TweetList';
import CryptoNewsroom from './components/CryptoNewsroom/CryptoNewsroom';

function App() {
  
  return (
    <Router>
      <div className="min-h-screen bg-background flex">
        <div className="fixed top-4 right-4 z-10">
          <Link 
            to="/crypto-newsroom" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow-sm flex items-center"
          >
            Crypto Newsroom
          </Link>
        </div>
        <main className="w-full">
          <Routes>
            <Route path="/" element={<TweetList />} />
            <Route path="/crypto-newsroom" element={<CryptoNewsroom />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
