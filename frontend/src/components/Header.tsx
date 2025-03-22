import React from 'react';
import { Search } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="flex items-center justify-between p-4">
        <h1 className="text-xl font-bold text-primary">Ronso</h1>
        
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search..."
              className="bg-muted/50 rounded-full py-2 px-4 pl-10 w-64 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
