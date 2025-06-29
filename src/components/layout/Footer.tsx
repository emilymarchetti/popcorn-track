import React from 'react';
import { Heart, Github } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t bg-background">
      <div className="container py-8 px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            Made with <Heart className="h-4 w-4 text-red-500" fill="currentColor" /> for movie lovers
          </div>
          
          <div className="flex items-center gap-4">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Github className="h-4 w-4" />
              GitHub
            </a>
            <p className="text-xs text-muted-foreground">
              Data provided by TMDB
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};