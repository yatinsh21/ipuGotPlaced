import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useUser, useAuth } from '@clerk/clerk-react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ArrowLeft, Calendar, Briefcase, Layers, Lightbulb, Lock, Crown } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ExperienceDetailPage = () => {
  const { experienceId } = useParams();
  const navigate = useNavigate();
  const { isSignedIn, user } = useUser();
  const { getToken } = useAuth();
  const [experience, setExperience] = useState(null);
  const [loading, setLoading] = useState(true);

  const isPremiumUser = user?.publicMetadata?.isPremium || user?.publicMetadata?.isAdmin;

  useEffect(() => {
    fetchExperience();
  }, [experienceId]);

  const fetchExperience = async () => {
    try {
      // Fetch preview data for all users
      const response = await axios.get(`${API}/experiences-preview`);
      const exp = response.data.find(e => e.id === experienceId);
      setExperience(exp);
    } catch (error) {
      console.error('Failed to fetch experience:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    try {
      if (!isSignedIn) {
        toast.error('Please sign in to purchase premium');
        return;
      }
      
      const token = await getToken();
      if (!token) {
        toast.error('Authentication error. Please sign out and sign in again.');
        return;
      }
      
      toast.info('Initializing payment...');
      
      const orderResponse = await axios.post(
        `${API}/payment/create-order`,
        { amount: 39900 },
        { 
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      const razorpayOptions = {
        key: 'rzp_live_RVGaTvsyo82E4p',
        amount: orderResponse.data.amount,
        currency: 'INR',
        order_id: orderResponse.data.id,
        name: 'IGP Premium',
        description: 'Lifetime access to company-wise questions',
        handler: async (razorpayResponse) => {
          try {
            await axios.post(
              `${API}/payment/verify`,
              {
                razorpay_order_id: razorpayResponse.razorpay_order_id,
                razorpay_payment_id: razorpayResponse.razorpay_payment_id,
                razorpay_signature: razorpayResponse.razorpay_signature
              },
              { 
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              }
            );
            
            toast.success('🎉 Premium unlocked! Reloading...');
            setTimeout(() => {
              window.location.reload();
            }, 1500);
            
          } catch (verifyError) {
            toast.error('Payment verification failed. Contact support.');
          }
        },
        prefill: {
          name: user?.fullName || user?.firstName || 'User',
          email: user?.primaryEmailAddress?.emailAddress || ''
        },
        theme: {
          color: '#000000'
        }
      };

      const razorpay = new window.Razorpay(razorpayOptions);
      razorpay.open();
      
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error('Authentication failed. Please sign out and sign in again.');
      } else {
        toast.error('Payment initiation failed. Please try again.');
      }
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const parseExperience = (text) => {
    const lines = text.split('\\n').filter(line => line.trim());
    const sections = [];
    let currentSection = { type: 'other', content: [] };

    lines.forEach(line => {
      const trimmedLine = line.trim();
      
      if (trimmedLine.match(/^Round \d+:/i)) {
        if (currentSection.content.length > 0) {
          sections.push(currentSection);
        }
        const [title, ...descParts] = trimmedLine.split(':');
        currentSection = {
          type: 'round',
          title: title.trim(),
          content: [descParts.join(':').trim()]
        };
      } else if (trimmedLine.match(/^(Tips?|Focus|Note|Important):/i)) {
        if (currentSection.content.length > 0) {
          sections.push(currentSection);
        }
        const [title, ...descParts] = trimmedLine.split(':');
        currentSection = {
          type: 'tips',
          title: title.trim(),
          content: [descParts.join(':').trim()]
        };
      } else if (trimmedLine) {
        currentSection.content.push(trimmedLine);
      }
    });

    if (currentSection.content.length > 0) {
      sections.push(currentSection);
    }

    return sections;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-gray-900"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/experiences')}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Experiences
          </Button>

          <div className="bg-yellow-50 border-2 border-yellow-200 p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Sign in to view this page
                </h3>
                <p className="text-gray-700">Sign in with Google to access interview experiences.</p>
              </div>
              <button 
                onClick={() => {
                  window.location.href = `${BACKEND_URL}/api/auth/login`;
                }}
                className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg font-medium"
              >
                Sign in with Google
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isPremiumUser) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/experiences')}
            className="mb-4 hover:bg-gray-100 -ml-2 h-9"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Experiences
          </Button>

          {experience && (
            <Card className="border border-gray-200 shadow-sm mb-4">
              <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white px-4 sm:px-6 py-4">
                <h1 className="text-2xl sm:text-3xl font-bold mb-2">{experience.company_name}</h1>
                <div className="flex flex-wrap gap-2 text-sm">
                  <div className="flex items-center gap-1.5 bg-white/15 px-2.5 py-1 rounded">
                    <Briefcase className="h-3.5 w-3.5" />
                    <span>{experience.role}</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white/15 px-2.5 py-1 rounded">
                    <Layers className="h-3.5 w-3.5" />
                    <span>{experience.rounds} rounds</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white/15 px-2.5 py-1 rounded">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{formatDate(experience.posted_at)}</span>
                  </div>
                </div>
              </div>
            </Card>
          )}

         <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-b-2 border-yellow-200 p-8">
                  <div className="max-w-2xl mx-auto text-center">
                    <Crown className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
                    <h2 className="text-3xl font-bold text-gray-900 mb-3">
                      Unlock Premium Content
                    </h2>
                    <p className="text-lg text-gray-700 mb-6">
                      Get lifetime access to carefully curated interview questions.
                    </p>
                    
                    <div className="bg-white border-2 border-yellow-400 rounded-lg p-6 mb-6 inline-block">
                      <div className="text-5xl font-bold text-gray-900 mb-2">₹399</div>
                      <div className="text-gray-600 text-lg">One-time payment • Lifetime access</div>
                    </div>
                    
                    <Button 
                      onClick={handlePayment}
                      size="lg"
                      className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold text-lg px-8 py-6 h-auto"
                    >
                      <Crown className="h-5 w-5 mr-2" />
                      Upgrade to Premium Now
                    </Button>
                    
                    <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                      <div className="bg-white/50 p-4 rounded border border-yellow-200">
                        <div className="font-semibold text-gray-900 mb-1">✓ All Questions</div>
                        <div className="text-sm text-gray-600">Access complete Q&A database</div>
                      </div>
                      <div className="bg-white/50 p-4 rounded border border-yellow-200">
                        <div className="font-semibold text-gray-900 mb-1">✓ Bookmark Feature</div>
                        <div className="text-sm text-gray-600">Save important questions</div>
                      </div>
                      <div className="bg-white/50 p-4 rounded border border-yellow-200">
                        <div className="font-semibold text-gray-900 mb-1">✓ Lifetime Access</div>
                        <div className="text-sm text-gray-600">Pay once, access forever</div>
                      </div>
                    </div>
                  </div>
                </div>
        </div>
        
        <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
      </div>
    );
  }

  if (!experience) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Experience not found</h1>
          <Button onClick={() => navigate('/experiences')} className="bg-gray-900 hover:bg-gray-800">
            Back to Experiences
          </Button>
        </div>
      </div>
    );
  }

  const sections = parseExperience(experience.experience);
  const roundSections = sections.filter(s => s.type === 'round');
  const tipsSections = sections.filter(s => s.type === 'tips');
  const otherSections = sections.filter(s => s.type === 'other');

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-5xl mx-auto px-4 py-4 sm:py-6">
        <div className="flex items-center justify-between mb-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/experiences')}
            className="hover:bg-gray-100 -ml-2 h-9"
            data-testid="back-btn"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <Button 
            variant="outline" 
            onClick={() => navigate('/experiences')}
            className="border border-gray-300 hover:border-gray-900 h-9 text-sm"
          >
            More Experiences
          </Button>
        </div>

        <Card className="border border-gray-200 shadow-sm">
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white px-4 sm:px-6 py-4">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">{experience.company_name}</h1>
            <div className="flex flex-wrap gap-2 text-sm">
              <div className="flex items-center gap-1.5 bg-white/15 px-2.5 py-1 rounded">
                <Briefcase className="h-3.5 w-3.5" />
                <span>{experience.role}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/15 px-2.5 py-1 rounded">
                <Layers className="h-3.5 w-3.5" />
                <span>{experience.rounds} rounds</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/15 px-2.5 py-1 rounded">
                <Calendar className="h-3.5 w-3.5" />
                <span>{formatDate(experience.posted_at)}</span>
              </div>
            </div>
          </div>

          <CardContent className="p-4 sm:p-6">
            <Accordion type="single" collapsible className="space-y-2">
              {roundSections.map((section, index) => (
                <AccordionItem 
                  key={index} 
                  value={`round-${index}`}
                  className="border border-gray-200 rounded-lg"
                >
                  <AccordionTrigger 
                    className="hover:no-underline px-3 py-2.5 hover:bg-gray-50 text-sm"
                    data-testid={`round-${index}`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center w-6 h-6 bg-gray-900 text-white rounded-full text-xs font-bold flex-shrink-0">
                        {index + 1}
                      </div>
                      <span className="font-semibold text-gray-900 text-left">{section.title}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-3 pb-3 pt-1">
                    <div className="pl-8 text-sm text-gray-700 space-y-1.5">
                      {section.content.map((line, i) => (
                        <p key={i}>{line}</p>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            {tipsSections.length > 0 && (
              <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="h-4 w-4 text-amber-600" />
                  <h3 className="text-sm font-bold text-gray-900">Key Insights</h3>
                </div>
                {tipsSections.map((section, index) => (
                  <div key={index} className="space-y-1.5">
                    <p className="text-xs font-semibold text-gray-700">{section.title}:</p>
                    <div className="text-sm text-gray-700 space-y-1">
                      {section.content.map((line, i) => (
                        <p key={i} className="flex gap-1.5">
                          <span className="text-amber-600">•</span>
                          <span>{line}</span>
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {otherSections.length > 0 && (
              <div className="mt-4 text-sm text-gray-700 space-y-1.5">
                {otherSections.map((section, index) => (
                  <div key={index}>
                    {section.content.map((line, i) => (
                      <p key={i}>{line}</p>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ExperienceDetailPage;