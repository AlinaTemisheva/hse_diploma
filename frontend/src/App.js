import { useState, useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import AdminDashboardPage from "@/pages/AdminDashboardPage";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    // Check for stored auth on mount
    const storedUser = localStorage.getItem("onboarding_user");
    const storedRole = localStorage.getItem("onboarding_role");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setUserRole(storedRole);
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (userData, role, userId) => {
    setUser(userData);
    setUserRole(role);
    setIsAuthenticated(true);
    localStorage.setItem("onboarding_user", JSON.stringify(userData));
    localStorage.setItem("onboarding_role", role);
    localStorage.setItem("onboarding_user_id", userId);
  };

  const handleLogout = () => {
    setUser(null);
    setUserRole(null);
    setIsAuthenticated(false);
    localStorage.removeItem("onboarding_user");
    localStorage.removeItem("onboarding_role");
    localStorage.removeItem("onboarding_user_id");
  };

  const getUserId = () => {
    return localStorage.getItem("onboarding_user_id") || "1";
  };

  const getDashboardComponent = () => {
    if (userRole === "admin") {
      return <AdminDashboardPage user={user} onLogout={handleLogout} />;
    }
    return <DashboardPage user={user} userId={getUserId()} onLogout={handleLogout} />;
  };

  return (
    <div className="App">
      <Toaster position="top-right" />
      <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <LoginPage onLogin={handleLogin} />
              )
            }
          />
          <Route
            path="/dashboard"
            element={
              isAuthenticated ? (
                getDashboardComponent()
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/"
            element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />}
          />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
