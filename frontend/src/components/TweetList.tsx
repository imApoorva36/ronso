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

        {/* Post Input */}
        <div className="p-4 border-b border-gray-800 flex">
          <div className="mr-4">
            <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden">
              <img
                src="/placeholder.svg?height=40&width=40"
                alt="Profile"
                className="object-cover w-10 h-10"
              />
            </div>
          </div>
          <div className="flex-1">
            <div className="mb-4">
              <input
                type="text"
                placeholder="What's happening?"
                className="bg-transparent text-white w-full outline-none text-xl"
              />
            </div>
            <div className="flex justify-between items-center">
              <div className="flex space-x-4 text-blue-500">
                <button>
                  <img
                    className="h-5 w-5"
                    src="/placeholder.svg?height=20&width=20"
                    alt="Media"
                  />
                </button>
                <button>
                  <img
                    className="h-5 w-5"
                    src="/placeholder.svg?height=20&width=20"
                    alt="GIF"
                  />
                </button>
                <button>
                  <BarChart2 className="h-5 w-5" />
                </button>
                <button>
                  <Smile className="h-5 w-5" />
                </button>
                <button>
                  <Calendar className="h-5 w-5" />
                </button>
                <button>
                  <MapPin className="h-5 w-5" />
                </button>
              </div>
              <button className="bg-blue-500 text-white rounded-full px-4 py-1 font-bold">Post</button>
            </div>
          </div>
        </div>

        {/* Posts */}
        <div>
          {/* Post 1 */}
          <div className="p-4 border-b border-gray-800 hover:bg-gray-900/50">
            <div className="flex">
              <div className="mr-4">
                <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden">
                  <img
                    src="https://api.dicebear.com/9.x/pixel-art/svg"
                    alt="Profile"
                    className="object-cover w-10 h-10"
                  />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center">
                  <span className="font-bold">hamptonism</span>
                  <span className="text-gray-500 ml-2">@hamptonism · 12h</span>
                  <button className="ml-auto text-gray-500">
                    <MoreHorizontal className="h-5 w-5" />
                  </button>
                </div>
                <div className="mt-2">
                  <p>Blackrock Quant Interview Question:</p>
                  <div className="flex justify-between mt-4 text-gray-500">
                    <button className="flex items-center">
                      <span>377</span>
                    </button>
                    <button className="flex items-center">
                      <span>245</span>
                    </button>
                    <button className="flex items-center">
                      <span>3.6K</span>
                    </button>
                    <button className="flex items-center">
                      <span>607K</span>
                    </button>
                    <button className="flex items-center">
                      <Bookmark className="h-5 w-5" />
                    </button>
                    <button className="flex items-center">
                      <span>Share</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="w-80 p-4">
        {/* Search */}
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-500" />
          </div>
          <input
            type="text"
            placeholder="Search"
            className="bg-gray-900 text-white w-full pl-10 pr-4 py-2 rounded-full focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Premium */}
        <div className="bg-gray-900 rounded-xl p-4 mb-4">
          <h2 className="text-xl font-bold mb-2">Subscribe to Premium</h2>
          <p className="text-sm mb-4">Subscribe to unlock new features and if eligible, receive a share of revenue.</p>
          <button className="bg-blue-500 text-white rounded-full py-2 px-4 font-bold">Subscribe</button>
        </div>

        {/* What's happening */}
        <div className="bg-gray-900 rounded-xl p-4 mb-4">
          <h2 className="text-xl font-bold mb-4">What's happening</h2>

          <div className="mb-6">
            <div className="flex justify-between">
              <div>
                <div className="flex items-center text-gray-500 text-sm">
                  <span>LIVE</span>
                </div>
                <h3 className="font-bold">Khloé in Wonder Land</h3>
              </div>
              <div className="h-16 w-16 bg-gray-800 rounded-lg overflow-hidden">
                <img
                  src="/placeholder.svg?height=64&width=64"
                  alt="Khloé"
                  className="object-cover h-16 w-16"
                />
              </div>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex justify-between">
              <div>
                <div className="flex items-center text-gray-500 text-sm">
                  <span>Trending in India</span>
                </div>
                <h3 className="font-bold">Rain</h3>
                <div className="text-gray-500 text-sm">112K posts</div>
              </div>
              <button className="text-gray-500">
                <MoreHorizontal className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex justify-between">
              <div>
                <div className="flex items-center text-gray-500 text-sm">
                  <span>Sports · Trending</span>
                </div>
                <h3 className="font-bold">#ipltickets</h3>
                <div className="text-gray-500 text-sm">1,255 posts</div>
              </div>
              <button className="text-gray-500">
                <MoreHorizontal className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex justify-between">
              <div>
                <div className="flex items-center text-gray-500 text-sm">
                  <span>Trending in India</span>
                </div>
                <h3 className="font-bold">F-47</h3>
                <div className="text-gray-500 text-sm">110K posts</div>
              </div>
              <button className="text-gray-500">
                <MoreHorizontal className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex justify-between">
              <div>
                <div className="flex items-center text-gray-500 text-sm">
                  <span>Sports · Trending</span>
                </div>
                <h3 className="font-bold">#KKRvsRCB</h3>
                <div className="text-gray-500 text-sm">6,399 posts</div>
              </div>
              <button className="text-gray-500">
                <MoreHorizontal className="h-5 w-5" />
              </button>
            </div>
          </div>

          <button className="text-blue-500 hover:text-blue-400">Show more</button>
        </div>

        {/* Who to follow */}
        <div className="bg-gray-900 rounded-xl p-4">
          <h2 className="text-xl font-bold mb-4">Who to follow</h2>
          {/* We would add follow suggestions here */}
        </div>
      </div>
    </div>
  )
}
