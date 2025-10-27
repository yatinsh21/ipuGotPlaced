import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '@/App';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Crown, Lock } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const GoldminePage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);

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

  if (showPayment) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-20">
          <div className="bg-white border-2 border-gray-900 p-12 text-center">
            <Crown className="h-20 w-20 mx-auto mb-6 text-yellow-500" />
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Upgrade to Premium</h1>
            <p className="text-lg text-gray-600 mb-8">
              Get access to company-wise interview questions, bookmarks, and more
            </p>
            
            <div className="mb-8">
              <div className="text-5xl font-bold text-gray-900 mb-2">₹1</div>
              <div className="text-gray-600">One-time payment • Lifetime access</div>
            </div>

            <ul className="text-left max-w-md mx-auto mb-8 space-y-3">
              <li className="flex items-center gap-2">
                <div className="h-2 w-2 bg-gray-900"></div>
                <span className="text-gray-700">Access to 100+ companies</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="h-2 w-2 bg-gray-900"></div>
                <span className="text-gray-700">Company-wise categorized questions</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="h-2 w-2 bg-gray-900"></div>
                <span className="text-gray-700">Bookmark important questions</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="h-2 w-2 bg-gray-900"></div>
                <span className="text-gray-700">Question tags and filters</span>
              </li>
            </ul>

            <Button 
              size="lg" 
              onClick={handlePayment}
              data-testid="upgrade-premium-btn"
              className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-6 text-lg"
            >
              Upgrade to Premium for ₹1
            </Button>
            
            <Button 
              variant="ghost" 
              onClick={() => setShowPayment(false)}
              className="mt-4"
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
        <div className="mb-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Crown className="h-10 w-10 text-yellow-500" />
            <div>
              <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-2">Goldmine</h1>
              <p className="text-lg text-gray-600">Company-wise interview questions</p>
            </div>
          </div>
          
          {user && !user.is_premium && (
            <Button 
              onClick={() => setShowPayment(true)}
              className="bg-yellow-500 hover:bg-yellow-600 text-gray-900"
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
      
      <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
    </div>
  );
};

export default GoldminePage;