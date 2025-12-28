import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

const CookieConsent = () => {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if user has already given consent
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      // Show banner after a short delay for better UX
      setTimeout(() => setShowBanner(true), 1000);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    setShowBanner(false);
  };

  const handleDecline = () => {
    localStorage.setItem('cookieConsent', 'declined');
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-gray-900 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 sm:py-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              🍪 We Value Your Privacy
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              We use cookies to enhance your browsing experience, serve personalized ads or content, and analyze our traffic. 
              By clicking "Accept All", you consent to our use of cookies. Read our{' '}
              <a href="/privacy" className="text-blue-600 hover:text-blue-800 underline font-medium">
                Privacy Policy
              </a>{' '}
              and{' '}
              <a href="/terms" className="text-blue-600 hover:text-blue-800 underline font-medium">
                Terms of Service
              </a>{' '}
              for more information.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              onClick={handleDecline}
              variant="outline"
              className="w-full sm:w-auto border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              Decline
            </Button>
            <Button
              onClick={handleAccept}
              className="w-full sm:w-auto bg-gray-900 hover:bg-gray-800 text-white"
            >
              Accept All
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
