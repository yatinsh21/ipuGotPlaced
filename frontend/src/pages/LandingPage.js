import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '@/App';
import { Button } from '@/components/ui/button';
import { Crown, BookOpen, Building2, FileText, ChevronRight } from 'lucide-react';

const LandingPage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogin = () => {
    const redirectUrl = encodeURIComponent(window.location.origin + '/goldmine');
    window.location.href = `https://auth.emergentagent.com/?redirect=${redirectUrl}`;
  };

  const companies = [
    { name: 'Google', logo: 'https://cdn.worldvectorlogo.com/logos/google-icon.svg' },
    { name: 'Microsoft', logo: 'https://cdn.worldvectorlogo.com/logos/microsoft-5.svg' },
    { name: 'Amazon', logo: 'https://cdn.worldvectorlogo.com/logos/amazon-icon-1.svg' },
    { name: 'Meta', logo: 'https://cdn.worldvectorlogo.com/logos/meta-icon-new.svg' },
    { name: 'Apple', logo: 'https://cdn.worldvectorlogo.com/logos/apple-14.svg' }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 sticky top-0 bg-white z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-gray-900">InterviewPrep</div>
          {user ? (
            <Button onClick={() => navigate('/topics')} data-testid="get-started-btn">
              Go to Dashboard
            </Button>
          ) : (
            <Button onClick={handleLogin} data-testid="login-btn">
              Sign in with Google
            </Button>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-6">
            Ace Your Next Interview
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Practice with real interview questions from top tech companies. Master data structures, algorithms, system design, and more.
          </p>
          <Button 
            size="lg" 
            onClick={() => user ? navigate('/topics') : handleLogin()}
            className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-6 text-lg"
            data-testid="cta-btn"
          >
            Start Practicing Free
            <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
        </div>

        {/* Company Logos */}
        <div className="mb-20">
          <p className="text-center text-sm text-gray-500 mb-8 uppercase tracking-wide">Questions from Top Companies</p>
          <div className="flex justify-center items-center gap-12 flex-wrap">
            {companies.map((company) => (
              <div key={company.name} className="grayscale hover:grayscale-0 transition-all">
                <img 
                  src={company.logo} 
                  alt={company.name} 
                  className="h-12 w-auto object-contain"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          <Link to="/topics" className="group">
            <div className="border-2 border-gray-200 p-8 hover:border-gray-900 transition-all">
              <BookOpen className="h-12 w-12 text-gray-900 mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Free Questions</h3>
              <p className="text-gray-600 mb-4">Practice 100+ interview questions organized by topics like Data Structures, Algorithms, and System Design</p>
              <span className="text-gray-900 font-medium group-hover:underline">Browse Topics →</span>
            </div>
          </Link>

          <Link to="/goldmine" className="group">
            <div className="border-2 border-gray-200 p-8 hover:border-gray-900 transition-all">
              <Crown className="h-12 w-12 text-yellow-500 mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Premium Goldmine</h3>
              <p className="text-gray-600 mb-4">Company-wise questions with insider tips, categorized by interview types. Bookmark your favorites</p>
              <span className="text-gray-900 font-medium group-hover:underline">View Companies →</span>
            </div>
          </Link>

          <Link to="/experiences" className="group">
            <div className="border-2 border-gray-200 p-8 hover:border-gray-900 transition-all">
              <FileText className="h-12 w-12 text-gray-900 mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Interview Experiences</h3>
              <p className="text-gray-600 mb-4">Real interview experiences from candidates who got offers from top tech companies</p>
              <span className="text-gray-900 font-medium group-hover:underline">Read Stories →</span>
            </div>
          </Link>
        </div>

        {/* CTA Section */}
        <div className="border-2 border-gray-900 p-12 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to start preparing?</h2>
          <p className="text-lg text-gray-600 mb-6">Join thousands of developers preparing for their dream job</p>
          <Button 
            size="lg" 
            onClick={() => user ? navigate('/topics') : handleLogin()}
            className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-6 text-lg"
          >
            Get Started for Free
          </Button>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;