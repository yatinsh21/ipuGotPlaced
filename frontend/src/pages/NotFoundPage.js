import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Search, ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
        <div className="flex flex-col items-center mb-6">
          <div className="relative">
            <h1 className="text-[100px] sm:text-[120px] font-extrabold text-gray-900 leading-none">
              404
            </h1>
            {/* <Search className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-10 w-10 text-gray-400 opacity-30" /> */}
          </div>
          <p className="text-xl font-semibold text-gray-800 mt-3">
            Lost your way?
          </p>
          <p className="text-gray-500 text-sm sm:text-base mt-1">
            Don’t worry — even toppers get lost sometimes.  
            Let’s get you back on track!
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <Button
            onClick={() => navigate("/")}
            className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-full flex items-center justify-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Home
          </Button>
          <Button
            onClick={() => navigate("/topics")}
            variant="outline"
            className="border-gray-300 hover:bg-gray-100 text-gray-700 rounded-full px-6 py-3"
          >
            Start Practicing Free 🚀
          </Button>
        </div>
      </div>

      {/* <Footer /> */}
    </div>
  );
};

export default NotFoundPage;
