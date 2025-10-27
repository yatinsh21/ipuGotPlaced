import { Link, useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Crown, BookOpen, Building2, FileText, ChevronRight } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  const companies = [
    { name: 'TCS', logo: 'https://customer-assets.emergentagent.com/job_interviewace-app/artifacts/hdc4u34c_tcs.png' },
    { name: 'Cvent', logo: 'https://customer-assets.emergentagent.com/job_interviewace-app/artifacts/yncdtcih_cvent.jpg' },
    { name: 'IVP', logo: 'https://customer-assets.emergentagent.com/job_interviewace-app/artifacts/2jfnamkw_ivp.jpg' },
    { name: 'TTN', logo: 'https://customer-assets.emergentagent.com/job_interviewace-app/artifacts/bvknwmxb_ttn.jpg' }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Use same navbar as other pages */}
      <Navbar />

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 py-12 sm:py-16 md:py-20">
        <div className="text-center mb-12 md:mb-16">
          <div className="mb-6 md:mb-8">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-3 md:mb-4">
              Trust IGP — He Knows Interviews !
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-gray-600 font-medium max-w-3xl mx-auto px-4">
              We can't change luck — but we can be ready when it arrives.
            </p>
          </div>
          <Button 
            size="lg" 
            onClick={() => navigate('/topics')}
            className="bg-gray-900 hover:bg-gray-800 text-white px-6 md:px-8 py-4 md:py-6 text-base md:text-lg"
            data-testid="cta-btn"
          >
            Start Practicing Free
            <ChevronRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
          </Button>
        </div>

        {/* Company Logos */}
        <div className="mb-12 md:mb-20">
          <p className="text-center text-xs sm:text-sm text-gray-500 mb-6 md:mb-8 uppercase tracking-wide">Questions from Top Companies</p>
          <div className="flex justify-center items-center gap-8 md:gap-16 flex-wrap px-4">
            {companies.map((company) => (
              <div key={company.name} className="transition-transform hover:scale-110">
                <img 
                  src={company.logo} 
                  alt={company.name} 
                  className="h-16 sm:h-20 md:h-24 lg:h-28 w-auto object-contain"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-12 md:mb-20 px-4">
          <Link to="/topics" className="group">
            <div className="border-2 border-gray-200 p-6 md:p-8 hover:border-gray-900 transition-all">
              <BookOpen className="h-10 w-10 md:h-12 md:w-12 text-gray-900 mb-3 md:mb-4" />
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 md:mb-3">Free Question Banks</h3>
              <p className="text-sm md:text-base text-gray-600 mb-3 md:mb-4">Practice 100+ interview questions organized by topics like Data Structures, Algorithms, and System Design</p>
              <span className="text-sm md:text-base text-gray-900 font-medium group-hover:underline">Browse Topics →</span>
            </div>
          </Link>

          <Link to="/goldmine" className="group">
            <div className="border-2 border-gray-200 p-6 md:p-8 hover:border-gray-900 transition-all">
              <Crown className="h-10 w-10 md:h-12 md:w-12 text-yellow-500 mb-3 md:mb-4" />
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 md:mb-3">Company-Wise Prep</h3>
              <p className="text-sm md:text-base text-gray-600 mb-3 md:mb-4">Real questions from top companies. Practice what actually gets asked in interviews</p>
              <span className="text-sm md:text-base text-gray-900 font-medium group-hover:underline">View Companies →</span>
            </div>
          </Link>

          <Link to="/experiences" className="group">
            <div className="border-2 border-gray-200 p-6 md:p-8 hover:border-gray-900 transition-all">
              <FileText className="h-10 w-10 md:h-12 md:w-12 text-gray-900 mb-3 md:mb-4" />
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 md:mb-3">Real Experiences</h3>
              <p className="text-sm md:text-base text-gray-600 mb-3 md:mb-4">Learn from students who got placed. Real stories, real insights</p>
              <span className="text-sm md:text-base text-gray-900 font-medium group-hover:underline">Read Stories →</span>
            </div>
          </Link>
        </div>

        {/* CTA Section */}
        <div className="border-2 border-gray-900 p-8 md:p-12 text-center mx-4">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 md:mb-4">Ready to start preparing?</h2>
          <p className="text-base md:text-lg text-gray-600 mb-4 md:mb-6">Join thousands of developers preparing for their dream job</p>
          <Button 
            size="lg" 
            onClick={() => navigate('/topics')}
            className="bg-gray-900 hover:bg-gray-800 text-white px-6 md:px-8 py-4 md:py-6 text-base md:text-lg"
          >
            Get Started for Free
          </Button>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;