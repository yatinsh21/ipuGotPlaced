import React, { useEffect, useState, createContext } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import { Toaster } from "@/components/ui/sonner";
import HomePage from "@/pages/HomePage";
import GoldminePage from "@/pages/GoldminePage";
import ExperiencesPage from "@/pages/ExperiencesPage";
import AdminPanel from "@/pages/AdminPanel";
import CompanyQuestionsPage from "@/pages/CompanyQuestionsPage";
import BookmarksPage from "@/pages/BookmarksPage";
import "@/App.css";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const AuthContext = createContext();

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for session_id in URL fragment
    const hash = window.location.hash;
    if (hash.includes('session_id=')) {
      const sessionId = hash.split('session_id=')[1].split('&')[0];
      handleSessionId(sessionId);
    } else {
      checkExistingSession();
    }
  }, []);

  const handleSessionId = async (sessionId) => {
    try {
      const response = await axios.post(
        `${API}/auth/session`,
        {},
        {
          headers: { 'X-Session-ID': sessionId },
          withCredentials: true
        }
      );
      setUser(response.data.user);
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (error) {
      console.error('Session creation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkExistingSession = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`, { withCredentials: true });
      setUser(response.data.user);
    } catch (error) {
      // Not authenticated
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, setUser, logout }}>
      <div className="App">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/goldmine" element={<GoldminePage />} />
            <Route path="/company/:companyId" element={<CompanyQuestionsPage />} />
            <Route path="/bookmarks" element={<BookmarksPage />} />
            <Route path="/experiences" element={<ExperiencesPage />} />
            <Route path="/admin" element={user?.is_admin ? <AdminPanel /> : <Navigate to="/" />} />
          </Routes>
        </BrowserRouter>
        <Toaster />
      </div>
    </AuthContext.Provider>
  );
}

export default App;