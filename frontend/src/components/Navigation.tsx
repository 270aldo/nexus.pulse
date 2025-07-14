import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSidebar } from '../hooks/useSidebar';
import { 
  Home, 
  Activity, 
  Apple, 
  Heart, 
  MessageCircle, 
  Settings,
  BarChart3,
  Calendar,
  BookOpen,
  Menu,
  X
} from 'lucide-react';

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  color: string;
}

const navigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <Home className="w-5 h-5" />,
    path: '/dashboard-page',
    color: 'text-violet-400'
  },
  {
    id: 'training',
    label: 'Entrenamientos',
    icon: <Activity className="w-5 h-5" />,
    path: '/training-log-page',
    color: 'text-orange-400'
  },
  {
    id: 'nutrition',
    label: 'Nutrición',
    icon: <Apple className="w-5 h-5" />,
    path: '/nutrition-log-page',
    color: 'text-green-400'
  },
  {
    id: 'wellness',
    label: 'Bienestar',
    icon: <Heart className="w-5 h-5" />,
    path: '/wellness-log-page',
    color: 'text-pink-400'
  },
  {
    id: 'biometrics',
    label: 'Biometría',
    icon: <BarChart3 className="w-5 h-5" />,
    path: '/biometric-log-page',
    color: 'text-blue-400'
  },
  {
    id: 'checkin',
    label: 'Check-in',
    icon: <Calendar className="w-5 h-5" />,
    path: '/daily-checkin-page',
    color: 'text-indigo-400'
  },
  {
    id: 'chat',
    label: 'AI Coach',
    icon: <MessageCircle className="w-5 h-5" />,
    path: '/chat-page',
    color: 'text-purple-400'
  },
  {
    id: 'resources',
    label: 'Recursos',
    icon: <BookOpen className="w-5 h-5" />,
    path: '/resource-library-page',
    color: 'text-neutral-400'
  },
  {
    id: 'settings',
    label: 'Configuración',
    icon: <Settings className="w-5 h-5" />,
    path: '/settings-page',
    color: 'text-neutral-400'
  }
];

export const BottomNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  // Mostrar solo los 5 elementos más importantes en móvil
  const mobileItems = navigationItems.slice(0, 5);

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-ngx-neutral-900 border-t border-ngx-neutral-700 z-50 md:hidden">
      <div className="flex justify-around items-center py-2 px-4">
        {mobileItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.path)}
              className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 ${
                isActive 
                  ? 'bg-violet-600/20 text-violet-400' 
                  : 'text-neutral-400 hover:text-neutral-300'
              }`}
            >
              <div className={`mb-1 ${isActive ? 'text-violet-400' : item.color}`}>
                {item.icon}
              </div>
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

// Tooltip component for collapsed state
const Tooltip: React.FC<{ children: React.ReactNode; content: string; isVisible: boolean }> = ({ children, content, isVisible }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  if (!isVisible) return <>{children}</>;

  return (
    <div 
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {children}
      {showTooltip && (
        <div className="absolute left-full ml-2 px-2 py-1 bg-neutral-800 text-white text-sm rounded-md whitespace-nowrap z-50 border border-neutral-700 shadow-lg">
          {content}
        </div>
      )}
    </div>
  );
};

export const SideNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isCollapsed, toggleSidebar } = useSidebar();

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <nav className={`hidden md:flex md:fixed md:left-0 md:top-0 md:bottom-0 md:z-40 transition-all duration-300 ease-in-out ${
      isCollapsed ? 'md:w-18' : 'md:w-64'
    }`}>
      {/* Glassmorphism background */}
      <div className="absolute inset-0 bg-gradient-to-b from-ngx-neutral-950 to-ngx-neutral-900 backdrop-blur-xl border-r border-ngx-primary/10" 
           style={{
             background: 'linear-gradient(135deg, rgba(10, 10, 10, 0.95) 0%, rgba(23, 23, 23, 0.98) 100%)',
             backdropFilter: 'blur(20px)',
             borderRight: '1px solid rgba(139, 92, 246, 0.1)',
             boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 0 20px rgba(0, 0, 0, 0.3)'
           }} />
      
      <div className="relative flex flex-col w-full overflow-hidden">
        {/* Logo */}
        <div className={`p-6 border-b border-neutral-700/50 ${isCollapsed ? 'px-4' : 'px-6'} relative`}>
          {/* Toggle button */}
          <button
            onClick={() => {
              console.log('Toggle clicked, current state:', isCollapsed);
              toggleSidebar();
            }}
            className="absolute top-4 right-4 w-8 h-8 bg-neutral-800/80 hover:bg-violet-600/20 border border-neutral-700/50 rounded-lg flex items-center justify-center transition-all duration-300 hover:border-violet-500/50 z-10"
            aria-label={isCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
          >
            {isCollapsed ? (
              <Menu className="w-4 h-4 text-white" />
            ) : (
              <X className="w-4 h-4 text-white" />
            )}
          </button>
          {isCollapsed ? (
            <div className="flex justify-center">
              <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">N</span>
              </div>
            </div>
          ) : (
            <div className="transition-all duration-300">
              <h1 className="text-2xl font-bold text-violet-400">NGX Pulse</h1>
              <p className="text-sm text-neutral-400 mt-1">Health Platform</p>
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <div className="flex-1 py-6 overflow-y-auto">
          {navigationItems.map((item) => {
            const isActive = location.pathname === item.path;
            
            if (isCollapsed) {
              return (
                <Tooltip key={item.id} content={item.label} isVisible={true}>
                  <button
                    onClick={() => handleNavigation(item.path)}
                    className={`w-full flex items-center justify-center py-3 mx-2 mb-2 rounded-lg transition-all duration-250 ease-out group relative ${
                      isActive 
                        ? 'bg-gradient-to-r from-violet-500/20 via-violet-600/15 to-transparent text-violet-400 shadow-lg shadow-violet-500/30' 
                        : 'text-neutral-400 hover:text-neutral-300 hover:bg-neutral-800/50 hover:scale-105'
                    }`}
                    style={isActive ? {
                      boxShadow: '0 0 20px rgba(139, 92, 246, 0.15), 0 0 40px rgba(139, 92, 246, 0.1), inset 0 1px 0 rgba(139, 92, 246, 0.2)'
                    } : {}}
                  >
                    {/* Enhanced Active indicator with glow */}
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-violet-500 rounded-r-full shadow-[0_0_8px_rgba(139,92,246,0.8)]" />
                    )}
                    
                    <div className={`transition-all duration-300 ${
                      isActive ? 'text-violet-400 scale-110' : `${item.color} group-hover:scale-110`
                    }`}>
                      {item.icon}
                    </div>
                  </button>
                </Tooltip>
              );
            }
            
            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.path)}
                className={`w-full flex items-center px-6 py-3 text-left transition-all duration-250 ease-out group relative ${
                  isActive 
                    ? 'bg-gradient-to-r from-violet-500/20 via-violet-600/15 to-transparent text-violet-400' 
                    : 'text-neutral-400 hover:text-neutral-300 hover:bg-neutral-800/50 hover:translate-x-1'
                }`}
                style={isActive ? {
                  boxShadow: '0 0 20px rgba(139, 92, 246, 0.15), 0 0 40px rgba(139, 92, 246, 0.1), inset 0 1px 0 rgba(139, 92, 246, 0.2)'
                } : {}}
              >
                {/* Enhanced Active indicator with glow */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-10 bg-violet-500 rounded-r-full shadow-[0_0_12px_rgba(139,92,246,0.8)]" />
                )}
                
                <div className={`mr-3 transition-all duration-300 ${
                  isActive ? 'text-violet-400 scale-110' : `${item.color} group-hover:scale-105`
                }`}>
                  {item.icon}
                </div>
                <span className="font-medium transition-all duration-300 group-hover:text-violet-400/80 text-white">
                  {item.label}
                </span>
                
                {/* Hover glow effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-250 ease-out bg-gradient-to-r from-violet-500/10 to-transparent" />
              </button>
            );
          })}
        </div>

        {/* User Section */}
        <div className={`border-t border-ngx-neutral-700/50 ${isCollapsed ? 'p-4' : 'p-6'}`}>
          {isCollapsed ? (
            <Tooltip content="Usuario Premium" isVisible={true}>
              <div className="flex justify-center">
                <div className="w-10 h-10 bg-violet-600 rounded-full flex items-center justify-center ring-2 ring-violet-500/20">
                  <span className="text-white font-semibold">U</span>
                </div>
              </div>
            </Tooltip>
          ) : (
            <div className="flex items-center transition-all duration-300">
              <div className="w-10 h-10 bg-violet-600 rounded-full flex items-center justify-center ring-2 ring-violet-500/20">
                <span className="text-white font-semibold">U</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-neutral-300">Usuario</p>
                <p className="text-xs text-neutral-500">Premium</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export const Navigation: React.FC = () => {
  const location = useLocation();
  
  // Hide navigation on landing page and auth pages
  const hideNavigation = ['/', '/auth-page', '/authpage', '/sign-up-page', '/signuppage'].includes(location.pathname);
  
  if (hideNavigation) {
    return null;
  }
  
  return (
    <>
      <SideNavigation />
      <BottomNavigation />
    </>
  );
};