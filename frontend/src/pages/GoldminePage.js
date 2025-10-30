import React from "react";

import { createIcons, icons } from 'lucide';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useUser, useAuth } from '@clerk/clerk-react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Crown, Lock, Check, X } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const GoldminePage = () => {
  const { isSignedIn, user } = useUser();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  
  const isPremium = user?.publicMetadata?.isPremium || user?.publicMetadata?.isAdmin;

  useEffect(() => {
    // Always fetch companies for everyone
    fetchCompaniesPreview();
  }, [isSignedIn]);

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

  // PAYMENT HANDLER - REWRITTEN FROM SCRATCH
  const handlePayment = async () => {
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
        { amount: 39900 }, // ₹399 in paise
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
        key: 'rzp_live_RVGaTvsyo82E4p',
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
        toast.error('Server error. Please try again later.');
      } else {
        toast.error('Payment initiation failed. Please try again.');
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

      <div className="mt-6">
        <div className="text-5xl font-extrabold text-gray-900 mb-1">₹399</div>
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
          ["15+ Top Companies", false, true],
          ["Bookmark Questions", false, true],
          ["Tags & Filters", false, true],
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
        Upgrade Now <Check className=" font-extrabold" />
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
              Unlock All for ₹399
            </Button>
          )}
        </div>

        {!isSignedIn && (
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
                <p className="text-sm text-gray-600">{company.question_count+5} questions</p>
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
                <div className="text-4xl font-bold text-gray-900 mb-1">₹399</div>
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
                Upgrade to Premium for ₹399
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