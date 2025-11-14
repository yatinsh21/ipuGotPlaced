import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser, SignInButton, UserButton } from '@clerk/clerk-react';
import { Button } from '@/components/ui/button';
import { NotebookText, Compass, Users } from 'lucide-react';
import { Crown, Bookmark, Shield, Menu, X } from 'lucide-react';
import { NewBadge } from './NewBadge';

const Navbar = () => {
  const { isSignedIn, user } = useUser();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isPremium = user?.publicMetadata?.isPremium || user?.publicMetadata?.isAdmin;
  const isAdmin = user?.publicMetadata?.isAdmin;

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-4 md:gap-8">
            <Link to="/" className="flex flex-col text-xl md:text-2xl font-bold text-gray-900">
              <span>IGP</span>
              <span className="text-[10px] md:text-xs font-normal text-gray-600 -mt-1">IPU GOT PLACED</span>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex gap-6">
              <Link to="/topics" className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors flex items-center gap-1">
                <NotebookText className="h-4 w-4" />  
                Question Bank
              </Link>
              <Link to="/goldmine" className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors flex items-center gap-1">
                <Crown className="h-4 w-4" />
                Goldmine
              </Link>
              <Link to="/experiences" className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors flex items-center gap-1">
                <Compass className="h-4 w-4" />
                Experiences
              </Link>
              
              <Link to="/alumni" className="flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
                <Users className="h-4 w-4" />
                <span className="relative pr-5">   
                  Alumni<NewBadge />
                </span>
              </Link>
            </div>
          </div>

          {/* Desktop Right Side */}
          <div className="hidden md:flex items-center gap-4">
            {isSignedIn ? (
              <>
                {isPremium && (
                  <Link to="/bookmarks">
                    <Button variant="ghost" size="sm" data-testid="bookmarks-btn">
                      <Bookmark className="h-4 w-4" />
                    </Button>
                  </Link>
                )}
                {isAdmin && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => navigate('/admin')}
                    data-testid="admin-panel-link"
                  >
                    <Shield className="h-4 w-4" />
                    <span className="ml-2">Admin</span>
                  </Button>
                )}
                <UserButton 
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: "h-10 w-10"
                    }
                  }}
                />
              </>
            ) : (
              <SignInButton mode="modal">
                <Button data-testid="login-btn" size="sm" className="flex items-center gap-2">
                  Sign in with Google
                  <img
                    src="/google.png"
                    alt="Google logo"
                    className="w-4 h-4 object-contain"
                  />
                </Button>
              </SignInButton>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            {isSignedIn && isPremium && (
              <Link to="/bookmarks">
                <Button variant="ghost" size="sm">
                  <Bookmark className="h-4 w-4" />
                </Button>
              </Link>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="mobile-menu-btn"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="flex flex-col space-y-3">
              <Link
                to="/topics"
                className="text-base font-medium text-gray-700 hover:text-gray-900 py-2 flex items-center gap-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                <NotebookText className="h-4 w-4" />
                Questions
              </Link>
              <Link
                to="/goldmine"
                className="text-base font-medium text-gray-700 hover:text-gray-900 py-2 flex items-center gap-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Crown className="h-4 w-4" />
                Goldmine
              </Link>
              <Link
                to="/experiences"
                className="text-base font-medium text-gray-700 hover:text-gray-900 py-2 flex items-center gap-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Compass className="h-4 w-4" />
                Experiences
              </Link>
              <Link 
                to="/alumni" 
                className="text-base font-medium text-gray-700 hover:text-gray-900 py-2 flex items-center gap-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Users className="h-4 w-4" />
                <span className="relative pr-5">   
                  Alumni<NewBadge />
                </span>
              </Link>
              
              {isSignedIn ? (
                <>
                  <div className="border-t border-gray-200 pt-3 mt-2">
                    <div className="flex items-center gap-3 mb-3">
                      <UserButton 
                        afterSignOutUrl="/"
                        appearance={{
                          elements: {
                            avatarBox: "h-10 w-10"
                          }
                        }}
                      />
                      <div>
                        <p className="text-sm font-medium">{user?.fullName || user?.primaryEmailAddress?.emailAddress}</p>
                        {isPremium && (
                          <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded">
                            <Crown className="h-3 w-3" />
                            Premium
                          </span>
                        )}
                      </div>
                    </div>
                    {isAdmin && (
                      <Button
                        variant="outline"
                        className="w-full justify-start mb-2"
                        onClick={() => {
                          navigate('/admin');
                          setMobileMenuOpen(false);
                        }}
                      >
                        <Shield className="mr-2 h-4 w-4" />
                        Admin Panel
                      </Button>
                    )}
                  </div>
                </>
              ) : (
                <div className="border-t border-gray-200 pt-3 mt-2">
                  <SignInButton mode="modal">
                    <Button className="w-full">
                      Sign in
                    </Button>
                  </SignInButton>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;