import { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '@/App';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { User, LogOut, Crown, Bookmark, Shield, Menu, X } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogin = () => {
    window.location.href = `${BACKEND_URL}/api/auth/login`;
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-4 md:gap-8">
            <Link to="/" className="text-xl md:text-2xl font-bold text-gray-900">
              InterviewPrep
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex gap-6">
              <Link to="/topics" className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
                Questions
              </Link>
              <Link to="/goldmine" className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors flex items-center gap-1">
                <Crown className="h-4 w-4" />
                Goldmine
              </Link>
              <Link to="/experiences" className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
                Experiences
              </Link>
            </div>
          </div>

          {/* Desktop Right Side */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                {user.is_premium && (
                  <Link to="/bookmarks">
                    <Button variant="ghost" size="sm" data-testid="bookmarks-btn">
                      <Bookmark className="h-4 w-4" />
                    </Button>
                  </Link>
                )}
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full" data-testid="user-menu-btn">
                      <Avatar>
                        <AvatarImage src={user.picture} alt={user.name} />
                        <AvatarFallback>{user.name?.charAt(0) || 'U'}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-2 py-2 border-b">
                      <p className="text-sm font-medium truncate">{user.name}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      {user.is_premium && (
                        <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded">
                          <Crown className="h-3 w-3" />
                          Premium
                        </span>
                      )}
                    </div>
                    {user.is_admin && (
                      <DropdownMenuItem onClick={() => navigate('/admin')} data-testid="admin-panel-link">
                        <Shield className="mr-2 h-4 w-4" />
                        Admin Panel
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={handleLogout} data-testid="logout-btn">
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button onClick={handleLogin} data-testid="login-btn" size="sm">
                Sign in
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            {user && user.is_premium && (
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
                className="text-base font-medium text-gray-700 hover:text-gray-900 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
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
                className="text-base font-medium text-gray-700 hover:text-gray-900 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Experiences
              </Link>
              
              {user ? (
                <>
                  <div className="border-t border-gray-200 pt-3 mt-2">
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar>
                        <AvatarImage src={user.picture} alt={user.name} />
                        <AvatarFallback>{user.name?.charAt(0) || 'U'}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                    {user.is_admin && (
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
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={handleLogout}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </Button>
                  </div>
                </>
              ) : (
                <div className="border-t border-gray-200 pt-3 mt-2">
                  <Button onClick={handleLogin} className="w-full">
                    Sign in with Google
                  </Button>
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