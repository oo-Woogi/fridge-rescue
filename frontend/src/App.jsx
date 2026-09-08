import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import MobileFrame from "./components/layout/MobileFrame";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";

import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import HomePage from "./pages/HomePage";
import FoodAddPage from "./pages/FoodAddPage";
import FoodDetailPage from "./pages/FoodDetailPage";
import FoodEditPage from "./pages/FoodEditPage";
import FoodListPage from "./pages/FoodListPage";
import StatsPage from "./pages/StatsPage";
import NotificationsPage from "./pages/NotificationsPage";
import NotificationSettingsPage from "./pages/NotificationSettingsPage";
import SettingsPage from "./pages/SettingsPage";
import SettingsProfilePage from "./pages/SettingsProfilePage";
import FaqPage from "./pages/FaqPage";

function Private({ children }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <MobileFrame>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />

              <Route path="/home" element={<Private><HomePage /></Private>} />
              <Route path="/foods" element={<Private><FoodListPage /></Private>} />
              <Route path="/foods/new" element={<Private><FoodAddPage /></Private>} />
              <Route path="/foods/:foodId" element={<Private><FoodDetailPage /></Private>} />
              <Route path="/foods/:foodId/edit" element={<Private><FoodEditPage /></Private>} />
              <Route path="/stats" element={<Private><StatsPage /></Private>} />
              <Route path="/notifications" element={<Private><NotificationsPage /></Private>} />
              <Route path="/notifications/settings" element={<Private><NotificationSettingsPage /></Private>} />
              <Route path="/settings" element={<Private><SettingsPage /></Private>} />
              <Route path="/settings/profile" element={<Private><SettingsProfilePage /></Private>} />
              <Route path="/settings/faq" element={<FaqPage />} />

              <Route path="/" element={<Navigate to="/home" replace />} />
              <Route path="*" element={<Navigate to="/home" replace />} />
            </Routes>
          </MobileFrame>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
