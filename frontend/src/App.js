import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { Toaster } from "@/components/ui/sonner";
import LandingPage from "@/pages/LandingPage";
import HomePage from "@/pages/HomePage";
import GoldminePage from "@/pages/GoldminePage";
import ExperiencesPage from "@/pages/ExperiencesPage";
import ExperienceDetailPage from "@/pages/ExperienceDetailPage";
import AdminPanel from "@/pages/AdminPanel";
import TermsPage from "./pages/TermsPage";
import CompanyQuestionsPage from "@/pages/CompanyQuestionsPage";
import BookmarksPage from "@/pages/BookmarksPage";
import ContactPage from "./pages/ContactPage";
import PrivacyPage from "./pages/PrivacyPolicy";
import AboutPage from "./pages/AboutPage";
import "@/App.css";

function App() {
  const { isLoaded, isSignedIn, user } = useUser();

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/topics" element={<HomePage />} />
          <Route path="/privacy" element={<PrivacyPage/>} />
          <Route path="/contact" element={<ContactPage/>} />
          <Route path="/terms" element={<TermsPage/>} />

          <Route path="/about" element={<AboutPage />} />
          <Route path="/goldmine" element={<GoldminePage />} />
          <Route path="/company/:companyId" element={<CompanyQuestionsPage />} />
          <Route path="/bookmarks" element={<BookmarksPage />} />
          <Route path="/experiences" element={<ExperiencesPage />} />
          <Route path="/experience/:experienceId" element={<ExperienceDetailPage />} />
          <Route 
            path="/admin" 
            element={
              isSignedIn && user?.publicMetadata?.isAdmin ? 
                <AdminPanel /> : 
                <Navigate to="/" />
            } 
          />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </div>
  );
}

export default App;