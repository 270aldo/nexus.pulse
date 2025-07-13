import { Routes, Route } from "react-router-dom";
import RouteErrorElement from "./components/RouteErrorElement";

import App from "./pages/App";
import AuthPage from "./pages/AuthPage";
import BiometricLogPage from "./pages/BiometricLogPage";
import ChatPage from "./pages/ChatPage";
import ContentItemPage from "./pages/ContentItemPage";
import DailyCheckinPage from "./pages/DailyCheckinPage";
import DashboardPage from "./pages/DashboardPage";
import NutritionLogPage from "./pages/NutritionLogPage";
import ResourceLibraryPage from "./pages/ResourceLibraryPage";
import SettingsPage from "./pages/SettingsPage";
import SignUpPage from "./pages/SignUpPage";
import TrainingLogPage from "./pages/TrainingLogPage";
import WellnessLogPage from "./pages/WellnessLogPage";
import NotFoundPage from "./pages/NotFoundPage";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/auth-page" element={<AuthPage />} />
      <Route path="/authpage" element={<AuthPage />} />
      <Route path="/biometric-log-page" element={<BiometricLogPage />} />
      <Route path="/biometriclogpage" element={<BiometricLogPage />} />
      <Route path="/chat-page" element={<ChatPage />} />
      <Route path="/chatpage" element={<ChatPage />} />
      <Route path="/content-item-page" element={<ContentItemPage />} />
      <Route path="/contentitempage" element={<ContentItemPage />} />
      <Route path="/daily-checkin-page" element={<DailyCheckinPage />} />
      <Route path="/dailycheckinpage" element={<DailyCheckinPage />} />
      <Route path="/dashboard-page" element={<DashboardPage />} />
      <Route path="/dashboardpage" element={<DashboardPage />} />
      <Route path="/nutrition-log-page" element={<NutritionLogPage />} />
      <Route path="/nutritionlogpage" element={<NutritionLogPage />} />
      <Route path="/resource-library-page" element={<ResourceLibraryPage />} />
      <Route path="/resourcelibrarypage" element={<ResourceLibraryPage />} />
      <Route path="/settings-page" element={<SettingsPage />} />
      <Route path="/settingspage" element={<SettingsPage />} />
      <Route path="/sign-up-page" element={<SignUpPage />} />
      <Route path="/signuppage" element={<SignUpPage />} />
      <Route path="/training-log-page" element={<TrainingLogPage />} />
      <Route path="/traininglogpage" element={<TrainingLogPage />} />
      <Route path="/wellness-log-page" element={<WellnessLogPage />} />
      <Route path="/wellnesslogpage" element={<WellnessLogPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes;