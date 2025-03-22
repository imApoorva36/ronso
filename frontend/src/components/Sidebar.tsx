import React from 'react';
import { Home, User, Bell, Mail, Bookmark, List, Hash, MoreHorizontal, Plus } from 'lucide-react';
import { Button } from './ui/button';

const Sidebar: React.FC = () => {
  const navItems = [
    { name: 'Home', icon: <Home className="h-5 w-5 mr-4" /> },
    { name: 'Explore', icon: <Hash className="h-5 w-5 mr-4" /> },
    { name: 'Notifications', icon: <Bell className="h-5 w-5 mr-4" /> },
    { name: 'Messages', icon: <Mail className="h-5 w-5 mr-4" /> },
    { name: 'Bookmarks', icon: <Bookmark className="h-5 w-5 mr-4" /> },
    { name: 'Lists', icon: <List className="h-5 w-5 mr-4" /> },
    { name: 'Profile', icon: <User className="h-5 w-5 mr-4" /> },
    { name: 'More', icon: <MoreHorizontal className="h-5 w-5 mr-4" /> },
  ];

  return (
    <div className="w-64 h-screen p-4 flex flex-col justify-between border-r">
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-primary">Ronso</h1>
        </div>
        
        <nav>
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.name}>
                <a
                  href="#"
                  className="flex items-center py-3 px-4 rounded-full hover:bg-muted transition-colors text-foreground hover:text-primary"
                >
                  {item.icon}
                  <span className="font-medium">{item.name}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      
      <div className="mb-4">
        <Button className="w-full rounded-full py-6" size="lg">
          <Plus className="h-5 w-5 mr-2" />
          Tweet
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;
