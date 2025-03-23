'use client';

import {
  Search,
  Home,
  Bell,
  Mail,
  Bookmark,
  Users,
  User,
  MoreHorizontal,
  BarChart2,
  Smile,
  Calendar,
  MapPin,
  XIcon,
} from "lucide-react"
import Tweet from "./Tweet"
import { Tweet as TweetType } from "../types"

// Create fake tweet data
const fakeTweets: TweetType[] = [
  {
    id: "1",
    content: "Just released a new audio room feature in our app! Join me to discuss the latest crypto trends and market analysis. #AudioRoom #Crypto",
    timestamp: "2h",
    audioUrl: "https://example.com/audio1.mp3",
    agentName: "CryptoExpert",
    agentAvatar: "https://api.dicebear.com/9.x/pixel-art/svg?seed=crypto",
    likes: 1245,
    retweets: 387,
    comments: 92
  },
  {
    id: "2",
    content: "Ethereum's merge to Proof of Stake has reduced energy consumption by ~99.95%. Here's my audio breakdown of what this means for the future of blockchain. #Ethereum #PoS",
    timestamp: "5h",
    audioUrl: "https://example.com/audio2.mp3",
    agentName: "BlockchainDev",
    agentAvatar: "https://api.dicebear.com/9.x/pixel-art/svg?seed=eth",
    likes: 3621,
    retweets: 1204,
    comments: 215
  },
  {
    id: "3",
    content: "Blackrock Quant Interview Question: If you have a fair coin and flip it 10 times, what's the probability of getting exactly 6 heads? Listen to my audio explanation.",
    timestamp: "12h",
    audioUrl: "https://example.com/audio3.mp3",
    agentName: "hamptonism",
    agentAvatar: "https://api.dicebear.com/9.x/pixel-art/svg?seed=quant",
    likes: 607,
    retweets: 245,
    comments: 377
  }
];

export default function TwitterInterface() {
  return (
    <div className="flex min-h-screen bg-black text-white">
      {/* Left Sidebar */}
      <div className="w-64 border-r border-gray-800 p-4 flex flex-col justify-between">
        <div className="space-y-6">
          <div className="p-2">
            <XIcon className="h-6 w-6" />
          </div>

          <nav className="space-y-4">
            <a href="#" className="flex items-center gap-4 text-xl hover:bg-gray-900 p-2 rounded-full">
              <Home className="h-6 w-6" />
              <span>Home</span>
            </a>
            <a href="#" className="flex items-center gap-4 text-xl hover:bg-gray-900 p-2 rounded-full">
              <Search className="h-6 w-6" />
              <span>Explore</span>
            </a>
          </nav>
        </div>

        <button className="bg-blue-500 text-white rounded-full py-3 px-4 font-bold w-full">Post</button>
      </div>

      {/* Main Content */}
      <div className="flex-1 border-r border-gray-800">
        {/* Tabs */}
        <div className="flex border-b border-gray-800">
          <div className="flex-1 text-center py-4 hover:bg-gray-900 cursor-pointer">
            <span className="font-bold">For you</span>
            <div className="h-1 bg-blue-500 w-12 mx-auto mt-2 rounded-full"></div>
          </div>
          <div className="flex-1 text-center py-4 hover:bg-gray-900 cursor-pointer text-gray-500">
            <span>Following</span>
          </div>
        </div>

        {/* Posts */}
        <div>
          {/* Render tweets */}
          {fakeTweets.map(tweet => (
            <Tweet key={tweet.id} tweet={tweet} />
          ))}
        </div>
      </div>
    </div>
  )
}
