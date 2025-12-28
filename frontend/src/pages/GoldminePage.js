import React from "react";
import { ArrowLeft, Calendar, Briefcase, Layers, Lightbulb, Monitor, Search } from 'lucide-react';
import { createIcons, icons } from 'lucide';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useUser, useAuth } from '@clerk/clerk-react';
import Navbar from '@/components/Navbar';
import SEOHelmet from '@/components/SEOHelmet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Crown, Lock, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import Footer from "@/components/Footer";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const GoldminePage = () => {
  const { isSignedIn, user } = useUser();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [filteredCompanies, setFilteredCompanies] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [seoData, setSeoData] = useState(null);
  
  const isPremium = user?.publicMetadata?.isPremium || user?.publicMetadata?.isAdmin;

  useEffect(() => {
    // Always fetch companies for everyone
    fetchCompaniesPreview();
    fetchSEOData();
  }, [isSignedIn]);

  const fetchSEOData = async () => {
    try {
      const response = await axios.get(`${API}/seo/goldmine`);
      setSeoData(response.data);
    } catch (error) {
      console.error('Failed to fetch SEO data:', error);
    }
  };

  // Device detection function
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

  const fetchCompaniesPreview = async () => {
    try {
      // Fetch real companies for preview
      const response = await axios.get(`${API}/companies-preview`);
      setCompanies(response.data);
      setFilteredCompanies(response.data);
    } catch (error) {
      console.error('Failed to fetch preview:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter companies based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredCompanies(companies);
    } else {
      const filtered = companies.filter(company =>
        company.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCompanies(filtered);
    }
  }, [searchQuery, companies]);

  const handleCompanyClick = (companyId) => {
    // Allow everyone to view company preview
    navigate(`/company/${companyId}`);
  };

  // PAYMENT HANDLER
  const handlePayment = async () => {
    if (isMobileDevice) {
      toast.error('Please use a desktop or laptop for 100% successful payment 🎉', {
        duration: 4000,
      });
      return;
    }

    console.log('=== PAYMENT FLOW STARTED ===');
    
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
        toast.error('High demand ! , Please try again');
      } else {
        toast.error('High demand ! , Please try again');
      }
    }
  };

  if (showPayment && isSignedIn && !isPremium) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-white max-w-3xl w-full p-8 rounded-2xl shadow-2xl border border-gray-100 max-h-[95vh] overflow-y-auto">
          {/* Header Section */}
          <div className="text-center mb-8">
            <Crown className="h-12 w-12 text-yellow-500 mx-auto mb-3" />
            <h2 className="text-3xl font-bold text-gray-900 mb-1">Upgrade to Premium</h2>
            <p className="text-gray-600 text-sm">Unlock all features — once and for all 🚀</p>

            <div className="mt-6 flex flex-col items-center justify-center text-center">
              <div className="text-2xl text-gray-500 line-through">₹399</div>
              <div className="text-5xl font-extrabold text-gray-900 mb-1">₹299</div>
              <div className="text-sm text-gray-600 font-medium">
                One-time payment • Lifetime access
              </div>
            </div>
          </div>

          {/* Comparison Table */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
              Compare Plans
            </h3>
            <div className="grid grid-cols-3 gap-0 border border-gray-300 text-sm rounded-lg overflow-hidden">
              {/* Header */}
              <div className="p-2 bg-gray-50 font-semibold border-b border-r">Features</div>
              <div className="p-2 bg-gray-50 font-semibold text-center border-b border-r">
                Free
              </div>
              <div className="p-2 bg-yellow-50 font-semibold text-center border-b border-l border-yellow-500">
                Premium
              </div>

              {/* Feature Rows */}
              {[
                ["Topic-wise Questions", true, true],
                ["All Question Answers", true, true],
                ["Company-wise Questions", false, true],
                ["Top Companies", false, true],
                ["AI Project Prep", false, true],
                ["Bookmark Questions", false, true],
                [
                  <>
                    Tags & Filters<br />
                    <span className="text-xs text-gray-500">(e.g. most-asked, just-read)</span>
                  </>,
                  false,
                  true
                ],
                ["Premium Experiences", false, true],
              ].map(([feature, free, premium], idx) => (
                <React.Fragment key={idx}>
                  <div className="p-2 border-b border-r text-xs sm:text-sm">{feature}</div>
                  <div className="p-2 border-b border-r text-center">
                    {free ? (
                      <Check className="h-4 w-4 text-green-600 mx-auto" />
                    ) : (
                      <X className="h-4 w-4 text-red-500 mx-auto" />
                    )}
                  </div>
                  <div className="p-2 border-b border-l border-yellow-500 text-center">
                    {premium ? (
                      <Check className="h-4 w-4 text-green-600 mx-auto" />
                    ) : (
                      <X className="h-4 w-4 text-red-500 mx-auto" />
                    )}
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="text-center space-y-4">
            <Button
              size="lg"
              onClick={handlePayment}
              data-testid="upgrade-premium-btn"
              className="w-full sm:w-auto bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-10 py-4 text-base rounded-xl shadow-md transition-all duration-200 hover:shadow-lg"
            >
              Upgrade Now <Check className="font-extrabold" />
            </Button>

            <Button
              variant="ghost"
              onClick={() => setShowPayment(false)}
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200"
            >
              Continue Without Premium
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {seoData && (
        <SEOHelmet
          title={seoData.title}
          description={seoData.description}
          keywords={seoData.keywords}
          canonical={seoData.canonical}
          structuredData={seoData.structuredData}
          type="website"
        />
      )}
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Crown className="h-10 w-10 text-yellow-500" />
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900">
              Crack Top Companies with<br />Real Interview Questions
            </h1>
          </div>
          <p className="text-lg text-gray-600 mb-2">
            Questions sourced from actual placement experiences. <span className='text-green-700 font-bold'>• 98% match rate from recent interviews.</span> 
          </p>
          <div className="flex items-center gap-2">
            <Check className="text-green-700" />
            <p className="text-xl font-semibold text-gray-900">The Only Set You Need</p>
          </div>

          {isSignedIn && !isPremium && (
            <Button 
              onClick={() => setShowPayment(true)}
              className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 mt-4"
            >
              <Crown className="h-4 w-4 mr-2" />
              Unlock All for ₹299
            </Button>
          )}
          
        </div>

        {!isSignedIn && (
          <div className="mb-8 bg-yellow-50 border-2 border-yellow-200 p-6 text-center">
            <p className="text-gray-900 font-medium">Sign in to unlock premium company-wise questions</p>
          </div>
        )}
        

        {/* Search Bar */}
     <div className="mb-6">
  <div className="relative max-w-md">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-hover:text-gray-700 transition-colors" />

    <Input
      type="text"
      placeholder="Search companies..."
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      className="pl-10 pr-10 py-2.5 w-full  border border-gray-300 bg-white/80 shadow-sm backdrop-blur-sm focus:border-gray-900 focus:ring-2 focus:ring-gray-900 focus:bg-white transition-all duration-200 placeholder:text-gray-400"
    />

    {/* Right side icon */}
    {searchQuery ? (
      <button
        onClick={() => setSearchQuery('')}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition"
      >
        ✕
      </button>
    ) : (
      <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-gray-400 border border-gray-200 rounded px-1.5 py-0.5">
        /
      </kbd>
    )}
  </div>
</div>


        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        ) : filteredCompanies.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCompanies.map((company) => (
              <div
                key={company.id}
                onClick={() => handleCompanyClick(company.id)}
                data-testid={`company-${company.id}`}
                className="relative bg-white border-2 border-gray-200 p-6 cursor-pointer hover:border-gray-900 transition-all hover:shadow-md"
              >
                {(!isSignedIn || !isPremium) && (
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
        ) : (
          <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 text-lg font-medium">No companies found</p>
            <p className="text-gray-400 text-sm mt-1">Try a different search term</p>
          </div>
        )}
      </div>
      
      <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
    </div>
  );
};

export default GoldminePage;