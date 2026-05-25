import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ActiveAlarms from "./pages/ActiveAlarms";
import History from "./pages/History";
import Settings from "./pages/Settings";
import EcuManagement from "./pages/EcuManagement";
import ProtectedRoute from "./components/ProtectedRoute";
import "./App.css";

function App() {
    useEffect(() => {
        // Force login on each fresh app run/load
        sessionStorage.removeItem("isAuthenticated");
        sessionStorage.removeItem("username");
        sessionStorage.removeItem("loginTime");
    }, []);

    return (
        <BrowserRouter>
            <Routes>
                {/* LOGIN ROUTE */}
                <Route path="/login" element={<Login />} />

                {/* DEFAULT ROUTE - always start at Login */}
                <Route path="/" element={<Navigate to="/login" replace />} />

                {/* API-based navigation route */}
                <Route path="/api/redirect/ecus" element={<Navigate to="/ecu-management" replace />} />

                {/* PROTECTED ROUTES */}
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/alarms"
                    element={
                        <ProtectedRoute>
                            <ActiveAlarms />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/history"
                    element={
                        <ProtectedRoute>
                            <History />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/settings"
                    element={
                        <ProtectedRoute>
                            <Settings />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/ecu-management"
                    element={<EcuManagement />}
                />
            </Routes>
        </BrowserRouter>
    );
}

export default App;