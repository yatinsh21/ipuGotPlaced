import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useUser, useAuth } from '@clerk/clerk-react';
import Navbar from '@/components/Navbar';
import {  SignInButton } from '@clerk/clerk-react';

// import {  useAuth } from '@clerk/clerk-react';
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
      let response;
      
      // Premium users get full experience data
      if (isPremiumUser && isSignedIn) {
        const token = await getToken();
        response = await axios.get(`${API}/experiences`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      } else {
        // Non-premium users get preview data
        response = await axios.get(`${API}/experiences-preview`);
      }
      
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
        key: 'rzp_live_RanAcueBT31KjY',
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
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/experiences')}
            className="mb-4 sm:mb-6 h-8 sm:h-9 text-sm"
          >
            <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden xs:inline">Back to Experiences</span>
            <span className="xs:hidden">Back</span>
          </Button>

          <div className="bg-yellow-50 border-2 border-yellow-200 p-4 sm:p-6 rounded-lg">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Lock className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  <span>Sign in to view this page</span>
                </h3>
                <p className="text-sm sm:text-base text-gray-700">Sign in with Google to access interview experiences.</p>
              </div>
               <SignInButton mode="modal">
                    <Button className="w-[30%]">
                      Sign in with Google<img
      src="/google.png"
      alt="Google logo"
      className="w-4 h-4 object-contain"
    />
                    </Button>
                  </SignInButton>
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
                  {/* <div className="flex items-center gap-1.5 bg-white/15 px-2.5 py-1 rounded">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{formatDate(experience.posted_at)}</span>
                  </div> */}
                </div>
              </div>
            </Card>
          )}

          <div className="bg-white border-2 border-gray-200 shadow-lg rounded-lg w-full max-w-3xl mx-auto">
  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-b-2 border-yellow-200 p-5 sm:p-8">
    <div className="text-center">
      <Crown className="h-10 w-10 sm:h-12 sm:w-12 text-yellow-500 mx-auto mb-3" />
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
        Premium Content
      </h2>
      <p className="text-sm sm:text-base text-gray-700 mb-4 px-2 sm:px-0">
        Upgrade to premium to read full interview experiences and access company-wise questions
      </p>

      {/* Price box */}
          <div className='flex flex-col'>

          
      <div className="bg-white border-2 border-yellow-400 rounded-lg p-4 mb-4 inline-block w-full sm:w-auto">
        <div className="text-3xl sm:text-4xl font-bold text-gray-900 mb-1">₹399</div>
        <div className="text-gray-600 text-sm sm:text-base">One-time • Lifetime access</div>
      </div>

      {/* Button */}
      <Button
        onClick={handlePayment}
        className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold px-5 sm:px-6 py-4 sm:py-5 h-auto mb-5 w-full sm:w-auto"
      >
        <Crown className="h-4 w-4 mr-2" />
        Upgrade to Premium Now
      </Button>
</div>
      {/* Features */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left text-sm px-2 sm:px-0">
        <div className="bg-white/50 p-3 rounded border border-yellow-200 text-center sm:text-left">
          <div className="font-semibold text-gray-900 mb-1">✓ All Experiences</div>
          <div className="text-xs text-gray-600">Real Stories , Real Impact</div>
        </div>
        <div className="bg-white/50 p-3 rounded border border-yellow-200 text-center sm:text-left">
          <div className="font-semibold text-gray-900 mb-1">✓ Company Q&A</div>
          <div className="text-xs text-gray-600">Master company-specific Q&A</div>
        </div>
        <div className="bg-white/50 p-3 rounded border border-yellow-200 text-center sm:text-left">
          <div className="font-semibold text-gray-900 mb-1">✓ Lifetime Access</div>
          <div className="text-xs text-gray-600">Pay once forever</div>
        </div>
        <div className="bg-white/50 p-3 rounded border border-yellow-200 text-center sm:text-left">
          <div className="font-semibold text-gray-900 mb-1">✓ Priority Support</div>
          <div className="text-xs text-gray-600">Skip the line , get Priority</div>
        </div>
        <div className="bg-white/50 p-3 rounded border border-yellow-200 text-center sm:text-left">
          <div className="font-semibold text-gray-900 mb-1">✓ Bookmark Questions</div>
          <div className="text-xs text-gray-600">Save what matters</div>
        </div>
        <div className="bg-white/50 p-3 rounded border border-yellow-200 text-center sm:text-left">
          <div className="font-semibold text-gray-900 mb-1">✓ Tags & Filters</div>
          <div className="text-xs text-gray-600">Smart tags for sharp minds</div>
        </div>
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
      
      <div className="max-w-5xl mx-auto px-3 sm:px-4 py-3 sm:py-4 md:py-6">
        <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/experiences')}
            className="hover:bg-gray-100 -ml-2 h-8 sm:h-9 text-sm"
            data-testid="back-btn"
          >
            <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
            Back
          </Button>
          <Button 
            variant="outline" 
            onClick={() => navigate('/experiences')}
            className="border border-gray-300 hover:border-gray-900 h-8 sm:h-9 text-xs sm:text-sm px-3 sm:px-4"
          >
            <span className="hidden xs:inline">More Experiences</span>
            <span className="xs:hidden">More</span>
          </Button>
        </div>

        <Card className="border border-gray-200 shadow-sm">
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white px-3 sm:px-4 md:px-6 py-3 sm:py-4">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 break-words leading-tight">{experience.company_name}</h1>
            <div className="flex flex-wrap gap-1.5 sm:gap-2 text-xs sm:text-sm">
              <div className="flex items-center gap-1 sm:gap-1.5 bg-white/15 px-2 sm:px-2.5 py-1 rounded">
                <Briefcase className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                <span className="truncate max-w-[120px] sm:max-w-[200px] md:max-w-none">{experience.role}</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-1.5 bg-white/15 px-2 sm:px-2.5 py-1 rounded whitespace-nowrap">
                <Layers className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                <span>{experience.rounds} rounds</span>
              </div>
              {/* <div className="flex items-center gap-1 sm:gap-1.5 bg-white/15 px-2 sm:px-2.5 py-1 rounded whitespace-nowrap">
                <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                <span>{formatDate(experience.posted_at)}</span>
              </div> */}
            </div>
          </div>

          <CardContent className="p-3 sm:p-4 md:p-6">
            <Accordion type="single" collapsible className="space-y-2">
              {roundSections.map((section, index) => (
                <AccordionItem 
                  key={index} 
                  value={`round-${index}`}
                  className="border border-gray-200 rounded-lg"
                >
                  <AccordionTrigger 
                    className="hover:no-underline px-2.5 sm:px-3 py-2 sm:py-2.5 hover:bg-gray-50 text-xs sm:text-sm"
                    data-testid={`round-${index}`}
                  >
                    <div className="flex items-center gap-1.5 sm:gap-2 w-full">
                      <div className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 bg-gray-900 text-white rounded-full text-xs font-bold flex-shrink-0">
                        {index + 1}
                      </div>
                      <span className="font-semibold text-gray-900 text-left break-words pr-2">{section.title}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-2.5 sm:px-3 pb-2.5 sm:pb-3 pt-1">
  <div
    className="pl-6 sm:pl-8 text-xs sm:text-sm text-gray-700 whitespace-pre-line"
  >
    {section.content}
  </div>
</AccordionContent>

                </AccordionItem>
              ))}
            </Accordion>

           {tipsSections.length > 0 && (
  <div className="mt-3 sm:mt-4 bg-amber-50 border border-amber-200 rounded-lg p-2.5 sm:p-3">
    <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
      <Lightbulb className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-600 flex-shrink-0" />
      <h3 className="text-xs sm:text-sm font-bold text-gray-900">Key Insights</h3>
    </div>
    {tipsSections.map((section, index) => (
      <div key={index} className="space-y-1 sm:space-y-1.5">
        <p className="text-xs font-semibold text-gray-700">{section.title}:</p>
        <div className="text-xs sm:text-sm text-gray-700 space-y-0.5 sm:space-y-1">
          {section.content.map((line, i) => (
            <p 
              key={i} 
              className="flex gap-1 sm:gap-1.5 whitespace-pre-line"  // ✅ add this
            >
              <span className="text-amber-600 flex-shrink-0">•</span>
              <span className="break-words">{line}</span>
            </p>
          ))}
        </div>
      </div>
    ))}
  </div>
)}


            {otherSections.length > 0 && (
              <div className="mt-3 sm:mt-4 text-xs sm:text-sm text-gray-700 space-y-1 sm:space-y-1.5">
                {otherSections.map((section, index) => (
                  <div key={index}>
                    {section.content.map((line, i) => (
                      <p key={i} className="break-words">{line}</p>
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