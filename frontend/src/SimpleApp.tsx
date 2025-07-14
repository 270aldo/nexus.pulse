import React from "react";
import { BrowserRouter, useLocation } from "react-router-dom";
import { ThemeProvider } from "./hooks/useTheme";
import { GlobalErrorBoundary } from "./components/GlobalErrorBoundary";
import { AppProvider } from "./components/AppProvider";
import { LazyPageLoader } from "./components/LazyPageLoader";
import { Navigation } from "./components/Navigation";
import { HamburgerButton } from "./components/HamburgerButton";
import { SidebarProvider, useSidebar } from "./hooks/useSidebar";
import { Toaster } from "sonner";
import AppRoutes from "./AppRoutes";

const AppContent = () => {
  const location = useLocation();
  const { isCollapsed } = useSidebar();
  
  // Pages without navigation
  const hideNavigation = ['/', '/auth-page', '/authpage', '/sign-up-page', '/signuppage'].includes(location.pathname);
  
  return (
    <div className="min-h-screen bg-ngx-neutral-900">
      {/* Hamburger button - only show on pages with navigation */}
      {!hideNavigation && <HamburgerButton />}
      
      {/* Main content area with dynamic navigation spacing */}
      <div className={
        hideNavigation 
          ? '' 
          : `transition-all duration-300 ${isCollapsed ? 'md:ml-18' : 'md:ml-64'} pb-20 md:pb-0`
      }>
        <AppRoutes />
      </div>
      {/* Global Navigation */}
      <Navigation />
    </div>
  );
};

const SimpleApp = () => {
  return (
    <GlobalErrorBoundary>
      <ThemeProvider defaultTheme="system">
        <BrowserRouter>
          <AppProvider>
            <SidebarProvider>
              <LazyPageLoader>
                <AppContent />
              </LazyPageLoader>
              <Toaster position="top-right" richColors closeButton />
            </SidebarProvider>
          </AppProvider>
        </BrowserRouter>
      </ThemeProvider>
    </GlobalErrorBoundary>
  );
};

export default SimpleApp;