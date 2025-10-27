import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '@/App';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { User, LogOut, Crown, Bookmark, Shield } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogin = () => {
    const redirectUrl = encodeURIComponent(window.location.origin + '/goldmine');
    window.location.href = `https://auth.emergentagent.com/?redirect=${redirectUrl}`;
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <Link to="/" className="text-2xl font-bold text-gray-900">
              InterviewPrep
            </Link>
            
            <div className="hidden md:flex gap-6">
              <Link to="/" className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
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

          <div className="flex items-center gap-4">
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
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
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
              <Button onClick={handleLogin} data-testid="login-btn">
                Sign in with Google
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;