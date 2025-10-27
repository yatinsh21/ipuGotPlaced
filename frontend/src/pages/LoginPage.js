import { Button } from '@/components/ui/button';
import { BookOpen, Crown, FileText, ChevronRight } from 'lucide-react';

const LoginPage = () => {
  const handleGoogleLogin = () => {
    const redirectUrl = encodeURIComponent(window.location.origin);
    window.location.href = `https://auth.emergentagent.com/?redirect=${redirectUrl}`;
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="text-2xl font-bold text-gray-900">InterviewPrep</div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full">
          {/* Login Card */}
          <div className="border-2 border-gray-900 p-8 mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">
              Welcome Back
            </h1>
            <p className="text-gray-600 mb-8 text-center">
              Sign in to access your interview preparation dashboard
            </p>

            {/* Google Sign In Button */}
            <Button
              onClick={handleGoogleLogin}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white h-12 text-base"
              data-testid="google-signin-btn"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </Button>

            <p className="text-xs text-gray-500 text-center mt-4">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>

          {/* Features Preview */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 border border-gray-200 bg-gray-50">
              <BookOpen className="h-5 w-5 text-gray-700" />
              <span className="text-sm text-gray-700">Access 100+ free interview questions</span>
            </div>
            <div className="flex items-center gap-3 p-3 border border-gray-200 bg-gray-50">
              <Crown className="h-5 w-5 text-yellow-600" />
              <span className="text-sm text-gray-700">Unlock company-wise premium questions</span>
            </div>
            <div className="flex items-center gap-3 p-3 border border-gray-200 bg-gray-50">
              <FileText className="h-5 w-5 text-gray-700" />
              <span className="text-sm text-gray-700">Read real interview experiences</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500">
          © 2025 InterviewPrep. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default LoginPage;
