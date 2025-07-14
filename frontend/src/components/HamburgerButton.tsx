import React from 'react';
import { useSidebar } from '../hooks/useSidebar';

export const HamburgerButton: React.FC = () => {
  const { isCollapsed, toggleSidebar } = useSidebar();

  return (
    <button
      onClick={toggleSidebar}
      className="fixed top-4 left-4 z-50 w-10 h-10 bg-ngx-neutral-800/90 backdrop-blur-sm border border-ngx-neutral-700/50 rounded-lg flex items-center justify-center transition-all duration-300 hover:bg-ngx-primary/20 hover:border-ngx-primary/50 hover:shadow-lg hover:shadow-ngx-primary/25 focus:outline-none focus:ring-2 focus:ring-ngx-primary/50"
      aria-label={isCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
    >
      <div className="relative w-5 h-5">
        {/* Top line */}
        <span
          className={`absolute block h-0.5 w-5 bg-ngx-neutral-300 transform transition-all duration-300 ease-in-out ${
            isCollapsed 
              ? 'rotate-45 translate-y-2' 
              : 'translate-y-0'
          }`}
        />
        {/* Middle line */}
        <span
          className={`absolute block h-0.5 w-5 bg-ngx-neutral-300 transform transition-all duration-300 ease-in-out translate-y-2 ${
            isCollapsed 
              ? 'opacity-0 scale-0' 
              : 'opacity-100 scale-100'
          }`}
        />
        {/* Bottom line */}
        <span
          className={`absolute block h-0.5 w-5 bg-ngx-neutral-300 transform transition-all duration-300 ease-in-out ${
            isCollapsed 
              ? '-rotate-45 translate-y-2' 
              : 'translate-y-4'
          }`}
        />
      </div>
    </button>
  );
};