import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function AnnouncementBar() {
  const [isVisible, setIsVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkDismissed = async () => {
      try {
        const result = await window.storage.get('announcement-dismissed');
        if (result && result.value === 'true') {
          setIsVisible(false);
        }
      } catch (error) {
        // Key doesn't exist, show the banner
        console.log('Banner not dismissed yet');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkDismissed();
  }, []);

  const handleDismiss = async () => {
    setIsVisible(false);
    try {
      await window.storage.set('announcement-dismissed', 'true');
    } catch (error) {
      console.error('Failed to save dismissal:', error);
    }
  };

  if (isLoading || !isVisible) return null;

  return (
    <div className="w-full bg-black text-white shadow-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-2 sm:py-3">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex-1 flex items-center justify-center min-w-0">
            <p className="text-xs sm:text-sm md:text-base font-medium text-center">
              <span className="inline sm:inline"> </span>
              🎉 IGP successfully helped 2,000+ students crack their dream placements!
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1 sm:p-1.5 rounded-full hover:bg-white/20 active:bg-white/30 transition-colors duration-200"
            aria-label="Dismiss announcement"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}