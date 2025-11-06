import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {  SignInButton } from '@clerk/clerk-react';

import { useUser, useAuth } from '@clerk/clerk-react';
import Navbar from '@/components/Navbar';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bookmark, BookmarkCheck, ArrowLeft, Lock, Crown } from 'lucide-react';
import { toast } from 'sonner';
import '../copyProtection.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CompanyQuestionsPage = () => {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const { isSignedIn, user } = useUser();
  const { getToken } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [company, setCompany] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [bookmarkedIds, setBookmarkedIds] = useState([]);
    const [isMobileDevice, setIsMobileDevice] = useState(false);
  
  const [loading, setLoading] = useState(true);

  const isPremiumUser = user?.publicMetadata?.isPremium || user?.publicMetadata?.isAdmin;

  useEffect(() => {
    if (isPremiumUser && isSignedIn) {
      fetchUserBookmarks();
    }
    fetchCompanyAndQuestions();
  }, [companyId, isPremiumUser, isSignedIn]);

  const checkIfMobile = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    const mobileKeywords = ['android', 'webos', 'iphone', 'ipad', 'ipod', 'blackberry', 'windows phone'];
    const isMobileUA = mobileKeywords.some(keyword => userAgent.includes(keyword));
    const isMobileScreen = window.innerWidth <= 768;
    return isMobileUA || isMobileScreen;
  };
  
    useEffect(() => {
    // Check device type on mount
    setIsMobileDevice(checkIfMobile());
    
    // Add resize listener to detect screen size changes
    const handleResize = () => {
      setIsMobileDevice(checkIfMobile());
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  

  const fetchUserBookmarks = async () => {
    try {
      const token = await getToken();
      const response = await axios.get(`${API}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setBookmarkedIds(response.data.bookmarked_questions || []);
    } catch (error) {
      console.error('Failed to fetch bookmarks:', error);
    }
  };

  // Disable copy/paste functionality
  useEffect(() => {
    const preventCopy = (e) => {
      e.preventDefault();
      toast.error('Copying is disabled to protect content');
      return false;
    };

    const preventCut = (e) => {
      e.preventDefault();
      toast.error('Cutting is disabled to protect content');
      return false;
    };

    const preventContextMenu = (e) => {
      e.preventDefault();
      return false;
    };

    const preventKeyboardShortcuts = (e) => {
      if (
        (e.ctrlKey && (e.key === 'c' || e.key === 'x' || e.key === 'a' || e.key === 'u')) ||
        (e.metaKey && (e.key === 'c' || e.key === 'x' || e.key === 'a')) ||
        e.key === 'F12'
      ) {
        e.preventDefault();
        toast.error('This action is disabled to protect content');
        return false;
      }
    };

    document.addEventListener('copy', preventCopy);
    document.addEventListener('cut', preventCut);
    document.addEventListener('contextmenu', preventContextMenu);
    document.addEventListener('keydown', preventKeyboardShortcuts);

    return () => {
      document.removeEventListener('copy', preventCopy);
      document.removeEventListener('cut', preventCut);
      document.removeEventListener('contextmenu', preventContextMenu);
      document.removeEventListener('keydown', preventKeyboardShortcuts);
    };
  }, []);

  const fetchCompanyAndQuestions = async () => {
    try {
      // Fetch company from preview endpoint
      const companiesRes = await axios.get(`${API}/companies-preview`);
      const comp = companiesRes.data.find(c => c.id === companyId);
      setCompany(comp);

      // Only fetch questions if user is premium
      if (isPremiumUser && isSignedIn) {
        const token = await getToken();
        const questionsRes = await axios.get(`${API}/company-questions/${companyId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setQuestions(questionsRes.data);
      } else {
        // For non-premium users, just set empty questions
        setQuestions([]);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load company data');
    } finally {
      setLoading(false);
    }
  };

  // PAYMENT HANDLER
  const handlePayment = async () => {
     if (isMobileDevice) {
        toast.error('Please use a desktop or laptop for 100% successful payment 🎉.', {
          duration: 4000,
        });
        return;
      }
    console.log('=== PAYMENT FLOW STARTED (Company Page) ===');
    
    try {
      // Step 1: Check if user is signed in
      if (!isSignedIn) {
        toast.error('Please sign in to purchase premium');
        return;
      }
      
      // Step 2: Get Clerk authentication token
      console.log('Step 1: Getting Clerk token...');
      const token = await getToken();
      
      if (!token) {
        console.error('❌ No token received from Clerk');
        toast.error('Authentication error. Please sign out and sign in again.');
        return;
      }
      
      console.log('✓ Token received from Clerk (length:', token.length, ')');
      
      // Step 3: Create payment order
      console.log('Step 2: Creating payment order...');
      toast.info('Initializing payment...');
      
      const orderResponse = await axios.post(
        `${API}/payment/create-order`,
        { amount: 29900 }, // ₹299 in paise
        { 
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('✓ Payment order created:', orderResponse.data.id);
      
      // Step 4: Open Razorpay checkout
      console.log('Step 3: Opening Razorpay checkout...');
      
      const razorpayOptions = {
        key: 'rzp_live_RbBiOlLpYoy4f3',
        amount: orderResponse.data.amount,
        currency: 'INR',
        offers: ["offer_RbihggUfvvAVVU"],
        order_id: orderResponse.data.id,
        name: 'IGP Premium',
        description: 'Lifetime access to company-wise questions',
        handler: async (razorpayResponse) => {
          console.log('Step 4: Payment successful, verifying...');
          try {
            // Verify payment with backend
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
            
            console.log('✓ Payment verified successfully');
            toast.success('🎉 Premium unlocked! Reloading...');
            
            // Reload page after 1.5 seconds
            setTimeout(() => {
              window.location.reload();
            }, 1500);
            
          } catch (verifyError) {
            console.error('❌ Payment verification failed:', verifyError);
            toast.error('Payment verification failed. Contact support.');
          }
        },
        prefill: {
          name: user?.fullName || user?.firstName || 'User',
          email: user?.primaryEmailAddress?.emailAddress || ''
        },
        theme: {
          color: '#000000'
        },
        modal: {
          ondismiss: () => {
            console.log('Payment cancelled by user');
          }
        }
      };

      const razorpay = new window.Razorpay(razorpayOptions);
      razorpay.open();
      
    } catch (error) {
      console.error('❌ Payment error:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      if (error.response?.status === 401) {
        toast.error('Authentication failed. Please sign out and sign in again.');
      } else if (error.response?.status === 500) {
        toast.error('Server error. Please try again later.');
      } else {
        toast.error('High Demand !, Please try again');
      }
    }
  };

  const toggleBookmark = async (questionId, e) => {
    e.stopPropagation();
    if (!isPremiumUser) {
      return;
    }

    try {
      const token = await getToken();
      const response = await axios.post(
        `${API}/bookmark/${questionId}`,
        {},
        { 
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (response.data.bookmarked) {
        setBookmarkedIds([...bookmarkedIds, questionId]);
        toast.success('Question bookmarked');
      } else {
        setBookmarkedIds(bookmarkedIds.filter(id => id !== questionId));
        toast.success('Bookmark removed');
      }
    } catch (error) {
      toast.error('Failed to update bookmark');
    }
  };

  const filteredQuestions = selectedCategory === 'all' 
    ? questions 
    : questions.filter(q => q.category === selectedCategory);

  const categories = ['all', 'technical', 'coding', 'project', 'HR'];
  const getCategoryCount = (cat) => {
  if (!isPremiumUser) return <Lock className='ml-1 mb-0.5' size={16} />;
  if (cat === 'all') return ;
  return "";
};

  const getDifficultyColor = (diff) => {
    switch(diff) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTagColor = (tag) => {
    switch(tag) {
      case 'v.imp': return 'bg-red-100 text-red-800';
      case 'just-read': return 'bg-blue-100 text-blue-800';
      case 'fav': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!user) {
    // Allow preview for non-logged in users
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/goldmine')}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Goldmine
          </Button>

          <div className="mb-6 bg-yellow-50 border-2 border-yellow-200 p-6 rounded">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Sign in to view this page
                </h3>
                <p className="text-gray-700">Sign in with Google to access company questions.</p>
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

          <div className="mb-8 flex items-center gap-4">
            {company?.logo_url && (
              <img src={company.logo_url} alt={company.name} className="h-16 w-16 object-contain" />
            )}
            <div>
              <h1 className="text-4xl font-bold text-gray-900">{company?.name || 'Company'}</h1>
              <p className="text-gray-600">Sign in to view questions</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/goldmine')}
          data-testid="back-to-goldmine-btn"
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Goldmine
        </Button>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <>
            <div className="mb-8 flex items-center gap-4">
              {company?.logo_url && (
                <img src={company.logo_url} alt={company.name} className="h-16 w-16 object-contain" />
              )}
              <div>
                <h1 className="text-4xl font-bold text-gray-900">{company?.name}</h1>
                {isPremiumUser ? (
                  <p className="text-gray-600">{questions.length +10} interview questions</p>
                ) : (
                  <p className="text-gray-600">Premium content • Upgrade to view</p>
                )}
              </div>
            </div>

            {/* Category Tabs - Always visible */}
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-6">
              <TabsList className="bg-white border border-gray-200">
                {categories.map((cat) => (
                  <TabsTrigger 
                    key={cat} 
                    value={cat}
                    data-testid={`category-${cat}`}
                    className="capitalize"
                  >
                    {cat} { getCategoryCount(cat)}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            {/* Premium users see questions */}
            {isPremiumUser ? (
              <div className="bg-white border border-gray-200 shadow-sm">
                <Accordion type="single" collapsible className="w-full">
                  {filteredQuestions.map((question, index) => (
                    <AccordionItem 
                      key={question.id} 
                      value={question.id}
                    >
                      <AccordionTrigger 
                        data-testid={`question-${index}`}
                        className="px-6 py-4 hover:bg-gray-50 text-left no-copy"
                      >
                        <div className="flex items-center justify-between flex-1 gap-4">
                          <div className="flex items-center gap-3 flex-1">
                            {/* <span className="text-gray-500 font-medium">Q{index + 1}.</span> */}
                            <span className="font-medium text-gray-900">
                              {question.question}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getDifficultyColor(question.difficulty)}>
                              {question.difficulty}
                            </Badge>
                            {question.tags?.map((tag) => (
                              <Badge key={tag} className={getTagColor(tag)}>
                                {tag}
                              </Badge>
                            ))}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => toggleBookmark(question.id, e)}
                              data-testid={`bookmark-${index}`}
                            >
                              {bookmarkedIds.includes(question.id) ? (
                                <BookmarkCheck className="h-5 w-5 text-gray-900" />
                              ) : (
                                <Bookmark className="h-5 w-5 text-gray-400" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                        <div className="prose max-w-none no-copy">
                          <p className="text-gray-700 whitespace-pre-wrap">{question.answer}</p>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>

                {filteredQuestions.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No questions found in this category.</p>
                  </div>
                )}
              </div>
            ) : (
              /* Non-premium users see locked state */
              <div className="bg-white border-2 border-gray-200 shadow-lg">
                {/* Premium Upgrade Banner */}
                  <div className="p-6 space-y-3">
                  {[1, 2].map((i) => (
                    <div 
                      key={i}
                      className="border border-gray-200 rounded-lg p-4 bg-gray-50 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <Lock className="h-5 w-5 text-gray-400" />
                        <div className="flex-1">
                          <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </div>
                      <Badge className="bg-gray-200 text-gray-500">
                        <Lock className="h-3 w-3 mr-1" />
                        Premium
                      </Badge>
                    </div>
                  ))}
                </div>
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-b-2 border-yellow-200 p-8">
                  <div className="max-w-2xl mx-auto text-center">
                    <Crown className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
                    <h2 className="text-3xl font-bold text-gray-900 mb-3">
                      Unlock Premium Content
                    </h2>
                    <p className="text-lg text-gray-700 mb-6">
                      Get lifetime access to {company?.question_count || 'all'} carefully curated interview questions from {company?.name}
                    </p>
                    
                   <div className="bg-white border-2 border-yellow-400 rounded-lg p-6 mb-6 inline-block text-center">
  <div className="text-2xl text-gray-500 line-through mb-1">₹399</div>
  <div className="text-5xl font-bold text-gray-900 mb-1">₹299</div>
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
                    
                    <div className="grid grid-cols-1 mt-2 sm:grid-cols-3 gap-3 text-left text-sm px-2 sm:px-0">
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

                {/* Locked Questions Preview */}
              

                {/* Bottom CTA */}
                
              </div>
            )}
          </>
        )}
      </div>
      
      <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
    </div>
  );
};

export default CompanyQuestionsPage;