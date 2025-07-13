import React, { startTransition, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./hooks/useTheme";
import { GlobalErrorBoundary } from "./components/GlobalErrorBoundary";
import { AppProvider } from "./components/AppProvider";
import { LazyPageLoader } from "./components/LazyPageLoader";
import { Toaster } from "sonner";

// Lazy load pages for better performance
const App = lazy(() => import("./pages/App"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const SignUpPage = lazy(() => import("./pages/SignUpPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

const SimpleApp = () => {
  return (
    <GlobalErrorBoundary>
      <ThemeProvider defaultTheme="system">
        <BrowserRouter>
          <AppProvider>
            <LazyPageLoader>
              <Routes>
                <Route path="/" element={<App />} />
                <Route path="/auth-page" element={<AuthPage />} />
                <Route path="/sign-up-page" element={<SignUpPage />} />
                <Route path="/dashboard-page" element={<DashboardPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </LazyPageLoader>
            <Toaster position="top-right" richColors closeButton />
          </AppProvider>
        </BrowserRouter>
      </ThemeProvider>
    </GlobalErrorBoundary>
  );
};

export default SimpleApp;