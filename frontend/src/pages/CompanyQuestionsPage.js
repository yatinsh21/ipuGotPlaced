import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
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
  const [loading, setLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const isPremiumUser = user?.publicMetadata?.isPremium || user?.publicMetadata?.isAdmin;

  useEffect(() => {
    if (isPremiumUser && isSignedIn) {
      fetchUserBookmarks();
    }
    fetchCompanyAndQuestions();
  }, [companyId, isPremiumUser, isSignedIn]);

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

      // Fetch questions (backend will handle preview for non-premium)
      const config = isPremiumUser && isSignedIn ? {
        headers: {
          Authorization: `Bearer ${await getToken()}`
        }
      } : {};
      const questionsRes = await axios.get(`${API}/company-questions/${companyId}`, config);
      setQuestions(questionsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load company data');
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionClick = () => {
    if (!isPremiumUser) {
      setShowUpgradeModal(true);
    }
  };

  const handlePayment = async () => {
    try {
      const token = await getToken();
      
      if (!token) {
        toast.error('Authentication required. Please sign in again.');
        return;
      }
      
      const orderResponse = await axios.post(
        `${API}/payment/create-order`,
        { amount: 39900 }, // ₹399
        { 
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const options = {
        key: 'rzp_live_RVGaTvsyo82E4p',
        amount: orderResponse.data.amount,
        currency: 'INR',
        order_id: orderResponse.data.id,
        name: 'InterviewPrep Premium',
        description: 'Lifetime access to company-wise questions',
        handler: async (response) => {
          try {
            await axios.post(
              `${API}/payment/verify`,
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              },
              { 
                headers: {
                  Authorization: `Bearer ${token}`
                }
              }
            );
            toast.success('Payment successful! Reloading...');
            setTimeout(() => window.location.reload(), 1500);
          } catch (error) {
            toast.error('Payment verification failed');
          }
        },
        prefill: {
          name: user?.fullName,
          email: user?.primaryEmailAddress?.emailAddress
        },
        theme: {
          color: '#000000'
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Payment initiation error:', error);
      if (error.response?.status === 401) {
        toast.error('Please sign in again to complete payment');
      } else {
        toast.error('Failed to initiate payment');
      }
    }
  };

  const toggleBookmark = async (questionId, e) => {
    e.stopPropagation();
    if (!isPremiumUser) {
      setShowUpgradeModal(true);
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
    if (cat === 'all') return questions.length;
    return questions.filter(q => q.category === cat).length;
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
                  Sign in to unlock preview
                </h3>
                <p className="text-gray-700">Sign in with Google to see company questions structure and upgrade to premium for full access.</p>
              </div>
              <Button 
                onClick={() => {
                  window.location.href = `${BACKEND_URL}/api/auth/login`;
                }}
                className="bg-gray-900 hover:bg-gray-800 text-white"
              >
                Sign in with Google
              </Button>
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

        {/* Premium Banner for non-premium users */}
        {!isPremiumUser && (
          <div className="mb-6 bg-yellow-50 border-2 border-yellow-200 p-6 rounded">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Preview Mode - Unlock Full Access
                </h3>
                <p className="text-gray-700">You're viewing the question structure. Upgrade to see all answers and bookmark questions.</p>
              </div>
              <Button 
                onClick={handlePayment}
                className="bg-gray-900 hover:bg-gray-800 text-white"
              >
                <Crown className="h-4 w-4 mr-2" />
                Upgrade for ₹399
              </Button>
            </div>
          </div>
        )}

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
                <p className="text-gray-600">{questions.length} interview questions</p>
              </div>
            </div>

            <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-6">
              <TabsList className="bg-white border border-gray-200">
                {categories.map((cat) => (
                  <TabsTrigger 
                    key={cat} 
                    value={cat}
                    data-testid={`category-${cat}`}
                    className="capitalize"
                  >
                    {cat} ({getCategoryCount(cat)})
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <div className="bg-white border border-gray-200 shadow-sm">
              {!isPremiumUser && filteredQuestions.length > 3 && (
                <div className="bg-yellow-50 border-b-2 border-yellow-200 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Lock className="h-5 w-5 text-yellow-600" />
                    <div>
                      <p className="font-medium text-gray-900">Preview Mode - Only first 3 questions shown</p>
                      <p className="text-sm text-gray-600">Unlock all questions and answers with premium</p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => setShowUpgradeModal(true)}
                    className="bg-yellow-500 hover:bg-yellow-600 text-gray-900"
                  >
                    <Crown className="h-4 w-4 mr-2" />
                    Upgrade to Premium
                  </Button>
                </div>
              )}
              
              <Accordion type="single" collapsible className="w-full">
                {filteredQuestions.map((question, index) => (
                  <AccordionItem 
                    key={question.id} 
                    value={question.id}
                    className={question.locked ? 'locked-question opacity-60' : ''}
                  >
                    <AccordionTrigger 
                      data-testid={`question-${index}`}
                      className="px-6 py-4 hover:bg-gray-50 text-left no-copy"
                      disabled={question.locked}
                      onClick={question.locked ? handleQuestionClick : undefined}
                    >
                      <div className="flex items-center justify-between flex-1 gap-4">
                        <div className="flex items-center gap-3 flex-1">
                          {question.locked && <Lock className="h-4 w-4 text-gray-400" />}
                          <span className="text-gray-500 font-medium">Q{index + 1}.</span>
                          <span className={`font-medium ${question.locked ? 'text-gray-500' : 'text-gray-900'}`}>
                            {question.question}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getDifficultyColor(question.difficulty)}>
                            {question.difficulty}
                          </Badge>
                          {question.locked && (
                            <Badge className="bg-yellow-100 text-yellow-800">
                              <Lock className="h-3 w-3 mr-1" />
                              Premium
                            </Badge>
                          )}
                          {question.tags?.map((tag) => (
                            <Badge key={tag} className={getTagColor(tag)}>
                              {tag}
                            </Badge>
                          ))}
                          {isPremiumUser && !question.locked && (
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
                          )}
                        </div>
                      </div>
                    </AccordionTrigger>
                    {!question.locked && (
                      <AccordionContent className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                        <div className="prose max-w-none no-copy">
                          <p className="text-gray-700 whitespace-pre-wrap">{question.answer}</p>
                        </div>
                      </AccordionContent>
                    )}
                  </AccordionItem>
                ))}
              </Accordion>
            </div>

            {filteredQuestions.length === 0 && (
              <div className="text-center py-12 bg-white border border-gray-200">
                <p className="text-gray-500">No questions found in this category.</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowUpgradeModal(false)}>
          <div className="bg-white p-8 max-w-md mx-4 border-2 border-gray-900" onClick={e => e.stopPropagation()}>
            <Crown className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">Unlock Full Access</h2>
            <p className="text-gray-600 mb-6 text-center">
              Upgrade to premium to view complete answers, bookmark questions, and access all features.
            </p>
            <div className="mb-6 text-center">
              <div className="text-4xl font-bold text-gray-900 mb-1">₹399</div>
              <div className="text-gray-600">One-time payment • Lifetime access</div>
            </div>
            <Button 
              onClick={handlePayment}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white mb-3"
            >
              Upgrade Now
            </Button>
            <Button 
              variant="ghost"
              onClick={() => setShowUpgradeModal(false)}
              className="w-full"
            >
              Continue Preview
            </Button>
          </div>
        </div>
      )}
      
      <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
    </div>
  );
};

export default CompanyQuestionsPage;