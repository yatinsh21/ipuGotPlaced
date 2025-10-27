import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Crown, Lock, Check, X } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const GoldminePage = () => {
  const { isSignedIn, user } = useUser();
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  
  const isPremium = user?.publicMetadata?.isPremium || user?.publicMetadata?.isAdmin;

  useEffect(() => {
    // Always fetch companies for everyone
    fetchCompaniesPreview();
  }, [user]);

  const fetchCompaniesPreview = async () => {
    try {
      // Fetch real companies for preview
      const response = await axios.get(`${API}/companies-preview`);
      setCompanies(response.data);
    } catch (error) {
      console.error('Failed to fetch preview:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyClick = (companyId) => {
    // Allow everyone to view company preview
    navigate(`/company/${companyId}`);
  };

  const handlePayment = async () => {
    try {
      const orderResponse = await axios.post(
        `${API}/payment/create-order`,
        { amount: 100 }, // ₹1
        { withCredentials: true }
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
              { withCredentials: true }
            );
            toast.success('Payment successful! Reloading...');
            setTimeout(() => window.location.reload(), 1500);
          } catch (error) {
            toast.error('Payment verification failed');
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email
        },
        theme: {
          color: '#000000'
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      toast.error('Failed to initiate payment');
    }
  };

  if (showPayment && user && !user.is_premium) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white max-w-3xl w-full p-6 max-h-[95vh] overflow-y-auto">
          <div className="text-center mb-6">
            <Crown className="h-12 w-12 text-yellow-500 mx-auto mb-3" />
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Upgrade to Premium</h2>
            <div className="my-4">
              <div className="text-4xl font-bold text-gray-900 mb-1">₹1</div>
              <div className="text-sm text-gray-600">One-time • Lifetime access</div>
            </div>
          </div>

          {/* Comparison Table - Compact */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3 text-center">Free vs Premium</h3>
            <div className="grid grid-cols-3 gap-0 border border-gray-300 text-sm">
              {/* Header */}
              <div className="p-2 bg-gray-50 font-semibold border-b border-r">Features</div>
              <div className="p-2 bg-gray-50 font-semibold text-center border-b border-r">Free</div>
              <div className="p-2 bg-yellow-50 font-semibold text-center border-b border-l border-yellow-500">Premium</div>
              
              {/* Topic-wise Questions */}
              <div className="p-2 border-b border-r text-xs">Topic-wise Questions</div>
              <div className="p-2 border-b border-r text-center">
                <Check className="h-4 w-4 text-green-600 mx-auto" />
              </div>
              <div className="p-2 border-b border-l border-yellow-500 text-center">
                <Check className="h-4 w-4 text-green-600 mx-auto" />
              </div>
              
              {/* All Question Answers */}
              <div className="p-2 border-b border-r text-xs">All Question Answers</div>
              <div className="p-2 border-b border-r text-center">
                <Check className="h-4 w-4 text-green-600 mx-auto" />
              </div>
              <div className="p-2 border-b border-l border-yellow-500 text-center">
                <Check className="h-4 w-4 text-green-600 mx-auto" />
              </div>
              
              {/* Company-wise Questions */}
              <div className="p-2 border-b border-r text-xs">Company-wise Questions</div>
              <div className="p-2 border-b border-r text-center">
                <span className="text-xs text-gray-500">3 only</span>
              </div>
              <div className="p-2 border-b border-l border-yellow-500 text-center">
                <Check className="h-4 w-4 text-green-600 mx-auto" />
              </div>
              
              {/* 15+ Companies */}
              <div className="p-2 border-b border-r text-xs">15+ Top Companies</div>
              <div className="p-2 border-b border-r text-center">
                <X className="h-4 w-4 text-red-500 mx-auto" />
              </div>
              <div className="p-2 border-b border-l border-yellow-500 text-center">
                <Check className="h-4 w-4 text-green-600 mx-auto" />
              </div>
              
              {/* Bookmark Questions */}
              <div className="p-2 border-b border-r text-xs">Bookmark Questions</div>
              <div className="p-2 border-b border-r text-center">
                <X className="h-4 w-4 text-red-500 mx-auto" />
              </div>
              <div className="p-2 border-b border-l border-yellow-500 text-center">
                <Check className="h-4 w-4 text-green-600 mx-auto" />
              </div>
              
              {/* Question Tags */}
              <div className="p-2 border-r text-xs">Tags & Filters</div>
              <div className="p-2 border-r text-center">
                <X className="h-4 w-4 text-red-500 mx-auto" />
              </div>
              <div className="p-2 border-l border-yellow-500 text-center">
                <Check className="h-4 w-4 text-green-600 mx-auto" />
              </div>
            </div>
          </div>

          <div className="text-center">
            <Button 
              size="lg" 
              onClick={handlePayment}
              data-testid="upgrade-premium-btn"
              className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-4 text-base mb-3"
            >
              Upgrade to Premium for ₹1
            </Button>
            
            <Button 
              variant="ghost" 
              onClick={() => setShowPayment(false)}
              className="text-sm"
            >
              Continue browsing
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <Crown className="h-10 w-10 text-yellow-500" />
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900">
              Crack Top Companies with<br />Real Interview Questions
            </h1>
          </div>
          <p className="text-lg text-gray-600 mb-2">
            Questions sourced from actual placement experiences. 15+ companies • 98% match rate from recent interviews.
          </p>
          <p className="text-xl font-semibold text-gray-900">The Only Set You Need</p>
          
          {user && !user.is_premium && (
            <Button 
              onClick={() => setShowPayment(true)}
              className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 mt-4"
            >
              <Crown className="h-4 w-4 mr-2" />
              Unlock All for ₹1
            </Button>
          )}
        </div>

        {!user && (
          <div className="mb-8 bg-yellow-50 border-2 border-yellow-200 p-6 text-center">
            <p className="text-gray-900 font-medium">Sign in to unlock premium company-wise questions</p>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {companies.map((company) => (
              <div
                key={company.id}
                onClick={() => handleCompanyClick(company.id)}
                data-testid={`company-${company.id}`}
                className="relative bg-white border-2 border-gray-200 p-6 cursor-pointer hover:border-gray-900 transition-all hover:shadow-md"
              >
                {(!user || !user.is_premium) && (
                  <div className="absolute top-2 right-2">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                )}
                {company.logo_url ? (
                  <img 
                    src={company.logo_url} 
                    alt={company.name} 
                    className="h-16 w-16 object-contain mb-4"
                  />
                ) : (
                  <div className="h-16 w-16 bg-gray-200 mb-4 flex items-center justify-center">
                    <span className="text-2xl font-bold text-gray-600">{company.name.charAt(0)}</span>
                  </div>
                )}
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{company.name}</h3>
                <p className="text-sm text-gray-600">{company.question_count} questions</p>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Payment Modal Overlay */}
      {showPayment && user && !user.is_premium && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white max-w-3xl w-full p-6 max-h-[95vh] overflow-y-auto">
            <div className="text-center mb-6">
              <Crown className="h-12 w-12 text-yellow-500 mx-auto mb-3" />
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Upgrade to Premium</h2>
              <div className="my-4">
                <div className="text-4xl font-bold text-gray-900 mb-1">₹1</div>
                <div className="text-sm text-gray-600">One-time • Lifetime access</div>
              </div>
            </div>

            {/* Comparison Table - Compact */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3 text-center">Free vs Premium</h3>
              <div className="grid grid-cols-3 gap-0 border border-gray-300 text-sm">
                {/* Header */}
                <div className="p-2 bg-gray-50 font-semibold border-b border-r">Features</div>
                <div className="p-2 bg-gray-50 font-semibold text-center border-b border-r">Free</div>
                <div className="p-2 bg-yellow-50 font-semibold text-center border-b border-l border-yellow-500">Premium</div>
                
                {/* Topic-wise Questions */}
                <div className="p-2 border-b border-r text-xs">Topic-wise Questions</div>
                <div className="p-2 border-b border-r text-center">
                  <Check className="h-4 w-4 text-green-600 mx-auto" />
                </div>
                <div className="p-2 border-b border-l border-yellow-500 text-center">
                  <Check className="h-4 w-4 text-green-600 mx-auto" />
                </div>
                
                {/* All Question Answers */}
                <div className="p-2 border-b border-r text-xs">All Question Answers</div>
                <div className="p-2 border-b border-r text-center">
                  <Check className="h-4 w-4 text-green-600 mx-auto" />
                </div>
                <div className="p-2 border-b border-l border-yellow-500 text-center">
                  <Check className="h-4 w-4 text-green-600 mx-auto" />
                </div>
                
                {/* Company-wise Questions */}
                <div className="p-2 border-b border-r text-xs">Company-wise Questions</div>
                <div className="p-2 border-b border-r text-center">
                  <span className="text-xs text-gray-500">3 only</span>
                </div>
                <div className="p-2 border-b border-l border-yellow-500 text-center">
                  <Check className="h-4 w-4 text-green-600 mx-auto" />
                </div>
                
                {/* 15+ Companies */}
                <div className="p-2 border-b border-r text-xs">15+ Top Companies</div>
                <div className="p-2 border-b border-r text-center">
                  <X className="h-4 w-4 text-red-500 mx-auto" />
                </div>
                <div className="p-2 border-b border-l border-yellow-500 text-center">
                  <Check className="h-4 w-4 text-green-600 mx-auto" />
                </div>
                
                {/* Bookmark Questions */}
                <div className="p-2 border-b border-r text-xs">Bookmark Questions</div>
                <div className="p-2 border-b border-r text-center">
                  <X className="h-4 w-4 text-red-500 mx-auto" />
                </div>
                <div className="p-2 border-b border-l border-yellow-500 text-center">
                  <Check className="h-4 w-4 text-green-600 mx-auto" />
                </div>
                
                {/* Question Tags */}
                <div className="p-2 border-r text-xs">Tags & Filters</div>
                <div className="p-2 border-r text-center">
                  <X className="h-4 w-4 text-red-500 mx-auto" />
                </div>
                <div className="p-2 border-l border-yellow-500 text-center">
                  <Check className="h-4 w-4 text-green-600 mx-auto" />
                </div>
              </div>
            </div>

            <div className="text-center">
              <Button 
                size="lg" 
                onClick={handlePayment}
                data-testid="upgrade-premium-btn"
                className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-4 text-base mb-3"
              >
                Upgrade to Premium for ₹1
              </Button>
              
              <Button 
                variant="ghost" 
                onClick={() => setShowPayment(false)}
                className="text-sm"
              >
                Continue browsing
              </Button>
            </div>
          </div>
        </div>
      )}
      
      <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
    </div>
  );
};

export default GoldminePage;