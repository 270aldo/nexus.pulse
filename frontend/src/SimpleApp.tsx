import React, { startTransition } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DEFAULT_THEME } from "./constants/default-theme";
import { ThemeProvider } from "./internal-components/ThemeProvider";
import { OuterErrorBoundary } from "./prod-components/OuterErrorBoundary";
import { AppProvider } from "./components/AppProvider";
import { Toaster } from "sonner";

import App from "./pages/App";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import NotFoundPage from "./pages/NotFoundPage";
import SignUpPage from "./pages/SignUpPage";

const SimpleApp = () => {
  return (
    <OuterErrorBoundary>
      <ThemeProvider defaultTheme={DEFAULT_THEME}>
        <BrowserRouter>
          <AppProvider>
            <Routes>
              <Route path="/" element={<App />} />
              <Route path="/auth-page" element={<AuthPage />} />
              <Route path="/sign-up-page" element={<SignUpPage />} />
              <Route path="/dashboard-page" element={<DashboardPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
            <Toaster position="top-right" richColors closeButton />
          </AppProvider>
        </BrowserRouter>
      </ThemeProvider>
    </OuterErrorBoundary>
  );
};

export default SimpleApp;