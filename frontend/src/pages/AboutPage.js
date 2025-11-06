import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Target, Users, Zap, Shield, BookOpen, TrendingUp } from 'lucide-react';
import Footer from '@/components/Footer';

const AboutPage = () => {
  const navigate = useNavigate();

  return (
    <>
      <Navbar />
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            About IPUGotPlaced
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
            Your trusted companion for cracking technical interviews and landing your dream job
          </p>
        </div>

        {/* Mission Section */}
        <Card className="border-2 border-gray-200 mb-8">
          <CardContent className="p-6 sm:p-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-gray-900 rounded-lg">
                <Target className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">Our Mission</h2>
                <p className="text-gray-700 leading-relaxed">
                  At IPUGotPlaced, we believe that every student deserves access to quality interview preparation resources. Our mission is to bridge the gap between academic learning and industry requirements by providing comprehensive interview preparation materials that actually work.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* What We Offer */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">What We Offer</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border border-gray-200 hover:border-gray-900 transition-all">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <BookOpen className="h-5 w-5 text-green-700" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Free Topic-Wise Questions</h3>
                </div>
                <p className="text-gray-600">
                  Access a vast collection of interview questions organized by topics. Perfect for building strong fundamentals across different technical domains.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 hover:border-gray-900 transition-all">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Users className="h-5 w-5 text-yellow-700" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Real Interview Experiences</h3>
                </div>
                <p className="text-gray-600">
                  Learn from candidates who successfully cleared interviews. Get insights into interview rounds, questions asked, and preparation strategies.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 hover:border-gray-900 transition-all">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Zap className="h-5 w-5 text-blue-700" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Company-Wise Questions</h3>
                </div>
                <p className="text-gray-600">
                  Premium curated question banks for specific companies. Know exactly what to expect and prepare accordingly for your target companies.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 hover:border-gray-900 transition-all">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-purple-700" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Regular Updates</h3>
                </div>
                <p className="text-gray-600">
                  Stay ahead with regularly updated content based on the latest interview trends and patterns from top companies.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Why Choose Us */}
        <Card className="border-2 border-gray-200 mb-8 bg-gradient-to-br from-gray-50 to-white">
          <CardContent className="p-6 sm:p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Why Choose IPUGotPlaced?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <div className="p-1.5 bg-gray-900 rounded-full mt-1">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Curated Content</h4>
                  <p className="text-sm text-gray-600">Every question and experience is carefully reviewed and verified for authenticity.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-1.5 bg-gray-900 rounded-full mt-1">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Student-Focused</h4>
                  <p className="text-sm text-gray-600">Built by students, for students. We understand your challenges and needs.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-1.5 bg-gray-900 rounded-full mt-1">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
               <div>
  <h4 className="font-semibold text-gray-900 mb-1">Affordable Premium</h4>
  <p className="text-sm text-gray-600">
    One-time payment of{" "}
    <span className="line-through text-gray-500">₹399</span>{" "}
    <span className="font-semibold text-green-600">₹299</span> for lifetime access.
    No subscriptions, no hidden fees.
  </p>
</div>

              </div>
              <div className="flex items-start gap-3">
                <div className="p-1.5 bg-gray-900 rounded-full mt-1">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Comprehensive Coverage</h4>
                  <p className="text-sm text-gray-600">From technical questions to HR rounds, we've got you covered for every stage.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <div className="text-center bg-gray-900 text-white rounded-lg p-8">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">Ready to Ace Your Interviews?</h2>
          <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
            Join thousands of students who have successfully prepared for their dream job interviews with IPUGotPlaced.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              onClick={() => navigate('/topics')}
              className="bg-white text-gray-900 hover:bg-gray-100"
            >
              Explore Free Questions
            </Button>
            <Button 
              onClick={() => navigate('/goldmine')}
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-gray-900"
            >
              View Premium Content
            </Button>
          </div>
        </div>
      </div>
    </div>
    {/* <Footer/> */}
    </>

    
  );
};

export default AboutPage;