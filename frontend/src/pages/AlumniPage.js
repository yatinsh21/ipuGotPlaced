import React, { useState, useEffect } from 'react';
import { useUser, useAuth, SignInButton } from '@clerk/clerk-react';
import axios from 'axios';
import Navbar from '@/components/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, MapPin, Briefcase, GraduationCap, Calendar, Mail, Phone, Lock, Crown, Building2, Timer, Check, X, GraduationCapIcon } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const SkeletonCard = () => (
  <div className="animate-pulse bg-white rounded-lg border border-gray-200 p-4 space-y-2 min-h-[140px]">
    <div className="h-3 w-1/2 bg-gray-200 rounded"></div>
    <div className="h-2.5 w-1/3 bg-gray-200 rounded"></div>
    <div className="h-2.5 w-1/2 bg-gray-200 rounded"></div>
    <div className="pt-2 border-t mt-2 space-y-2">
      <div className="h-2.5 w-2/3 bg-gray-200 rounded"></div>
      <div className="h-2.5 w-1/2 bg-gray-200 rounded"></div>
      <div className="h-6 w-full bg-gray-200 rounded"></div>
    </div>
  </div>
);

const AlumniPage = () => {
  const { user, isSignedIn } = useUser();
  const { getToken } = useAuth();
  const [alumni, setAlumni] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [searchCompany, setSearchCompany] = useState('');
  const [searchCollege, setSearchCollege] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  const isPremium = user?.publicMetadata?.isPremium || user?.publicMetadata?.isAdmin;

  // Device detection
  const checkIfMobile = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    const mobileKeywords = ['android', 'webos', 'iphone', 'ipad', 'ipod', 'blackberry', 'windows phone'];
    const isMobileUA = mobileKeywords.some(keyword => userAgent.includes(keyword));
    const isMobileScreen = window.innerWidth <= 768;
    return isMobileUA || isMobileScreen;
  };

  useEffect(() => {
    setIsMobileDevice(checkIfMobile());
    
    const handleResize = () => {
      setIsMobileDevice(checkIfMobile());
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getAuthConfig = async () => {
    if (!isSignedIn) return {};
    const token = await getToken();
    return {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
  };

  const searchAlumni = async (name = searchName, company = searchCompany, college = searchCollege) => {
    if (!name && !company && !college) {
      setHasSearched(false);
      setAlumni([]);
      return;
    }

    setLoading(true);
    setHasSearched(true);
    try {
      const config = await getAuthConfig();
      const params = {};
      
      if (name) params.name = name;
      if (company) params.company = company;
      if (college) params.college = college;

      const response = await axios.get(`${API}/alumni/search`, {
        ...config,
        params
      });
      
      setAlumni(response.data);
    } catch (error) {
      console.error('Failed to search alumni:', error);
      toast.error('Failed to search alumni');
    } finally {
      setLoading(false);
    }
  };

  // PAYMENT HANDLER
  const handlePayment = async () => {
    if (isMobileDevice) {
      toast.error('Please use a desktop or laptop for 100% successful payment 🎉', {
        duration: 4000,
      });
      return;
    }

    console.log('=== PAYMENT FLOW STARTED (Alumni Page) ===');
    
    try {
      if (!isSignedIn) {
        toast.error('Please sign in to purchase premium');
        return;
      }
      
      console.log('Step 1: Getting Clerk token...');
      const token = await getToken();
      
      if (!token) {
        console.error('❌ No token received from Clerk');
        toast.error('Authentication error. Please sign out and sign in again.');
        return;
      }
      
      console.log('✓ Token received from Clerk (length:', token.length, ')');
      
      console.log('Step 2: Creating payment order...');
      toast.info('Initializing payment...');
      
      const orderResponse = await axios.post(
        `${API}/payment/create-order`,
        { amount: 29900 },
        { 
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('✓ Payment order created:', orderResponse.data.id);
      
      console.log('Step 3: Opening Razorpay checkout...');
      
      const razorpayOptions = {
        key: 'rzp_live_RbBiOlLpYoy4f3',
        amount: orderResponse.data.amount,
        currency: 'INR',
        order_id: orderResponse.data.id,
        name: 'IGP Premium',
        description: 'Lifetime access to premium features',
        handler: async (razorpayResponse) => {
          console.log('Step 4: Payment successful, verifying...');
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
            
            console.log('✓ Payment verified successfully');
            toast.success('🎉 Premium unlocked! Reloading...');
            
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
        toast.error('High demand! Please try again');
      } else {
        toast.error('High demand! Please try again');
      }
    }
  };

  const revealContact = async (alumniId) => {
    // Step 1: Check if signed in - don't handle here, let SignInButton handle it
    if (!isSignedIn) {
      toast.info('Please sign in to reveal contacts');
      return;
    }

    // Step 2: Check if premium
    if (!isPremium) {
      setShowPayment(true);
      return;
    }

    // Step 3: Reveal contact for premium users
    try {
      const config = await getAuthConfig();
      const response = await axios.get(`${API}/alumni/${alumniId}/reveal`, config);
      
      setAlumni(prevAlumni => 
        prevAlumni.map(a => 
          a.id === alumniId ? { ...a, ...response.data, revealed: true } : a
        )
      );
      
      toast.success('Contact revealed!');
    } catch (error) {
      console.error('Failed to reveal contact:', error);
      toast.error('Failed to reveal contact');
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      searchAlumni();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchName, searchCompany, searchCollege]);

  // Payment Modal
  if (showPayment && isSignedIn && !isPremium) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-white max-w-3xl w-full p-8 rounded-2xl shadow-2xl border border-gray-100 max-h-[95vh] overflow-y-auto">
          <div className="text-center mb-8">
            <Crown className="h-12 w-12 text-yellow-500 mx-auto mb-3" />
            <h2 className="text-3xl font-bold text-gray-900 mb-1">Upgrade to Premium</h2>
            <p className="text-gray-600 text-sm">Unlock alumni contacts and all premium features 🚀</p>

            <div className="mt-6 flex flex-col items-center justify-center text-center">
              <div className="text-2xl text-gray-500 line-through">₹399</div>
              <div className="text-5xl font-extrabold text-gray-900 mb-1">₹299</div>
              <div className="text-sm text-gray-600 font-medium">
                One-time payment • Lifetime access
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
              What You Get
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              {[
                "Reveal Alumni Contacts",
                "Company-wise Questions",
                "Bookmark Questions",
                "Premium Experiences",
                "Tags & Filters",
                "Priority Support"
              ].map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700 font-medium">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center space-y-4">
            <Button
              size="lg"
              onClick={handlePayment}
              className="w-full sm:w-auto bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-10 py-4 text-base rounded-xl shadow-md transition-all duration-200 hover:shadow-lg"
            >
              Upgrade Now <Crown className="ml-2 h-5 w-5" />
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
      
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-8 text-center sm:text-left">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-2 leading-snug">
            Tired of "Hi bhaiya" messages dying on{" "}
            <span className="text-[#0A66C2]">LinkedIn?</span>
          </h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-xxl">
            Connect with <span className="font-semibold text-gray-800 underline">alumni</span> who've aced the interviews you're preparing for.
          </p>
          
          {!isSignedIn && (
            <SignInButton mode="modal">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white mt-4">
                <Lock className="h-4 w-4 mr-2" />
                Sign In to Reveal Contacts
              </Button>
            </SignInButton>
          )}

          
        </div>

        <div className="mb-6 bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Search className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Search Alumni</span>
            {loading && (
              <div className="ml-auto">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-gray-900"></div>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              placeholder="Search by name..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="text-sm"
            />
            <Input
              placeholder="Search by company... (Indus Valley Partners)"
              value={searchCompany}
              onChange={(e) => setSearchCompany(e.target.value)}
              className="text-sm"
            />
          </div>
        </div>

        {!hasSearched ? (
          <div className="text-center py-5 bg-gradient-to-b from-gray-50 to-white border border-dashed border-gray-200 rounded-xl max-w-lg mx-auto">
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-full bg-blue-50 border border-blue-100">
                <Search className="h-8 w-8 text-[#0A66C2] animate-pulse" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-1">
              Start your alumni search
            </h3>
            <p className="text-gray-500 text-sm mb-4">
              Enter a <span className="font-medium text-gray-700">name</span> or{" "}
              <span className="font-medium text-gray-700">company</span> to connect.
            </p>
          </div>
        ) : alumni.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {alumni.map((person) => (
              <Card key={person.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-gray-900 text-sm leading-tight">
                      {person.name}
                    </h3>
                    {isPremium && <Crown className="h-3.5 w-3.5 text-yellow-500 flex-shrink-0 mt-0.5" />}
                  </div>
                  
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-gray-700">
                      <Briefcase className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                      <span className="text-xs font-medium truncate">{person.role}</span>
                    </div>
                    
                    <div className="flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                      <span className="text-xs font-semibold text-blue-600 truncate">{person.company}</span>
                    </div>
                    
                    <div className="flex items-center gap-1.5">
                      <GraduationCapIcon className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                      <span className="text-xs font-semibold text-blue-600 truncate">{person.graduation_year}</span>
                    </div>
                  </div>
                  
                  <div className="pt-2.5 border-t space-y-1.5">
                    {person.revealed ? (
                      <>
                        <div className="flex items-center gap-1.5">
                          <Mail className="h-3 w-3 text-gray-400 flex-shrink-0" />
                          <span className="text-xs truncate">{person.email}</span>
                        </div>
                        
                        {person.phone && (
                          <div className="flex items-center gap-1.5">
                            <Phone className="h-3 w-3 text-gray-400 flex-shrink-0" />
                            <span className="text-xs">{person.phone}</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-1.5">
                          <Mail className="h-3 w-3 text-gray-400 flex-shrink-0" />
                          <span className="text-xs text-gray-400 blur-[3px] select-none">
                            email@example.com
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1.5">
                          <Phone className="h-3 w-3 text-gray-400 flex-shrink-0" />
                          <span className="text-xs text-gray-400 blur-[3px] select-none">
                            123-456-7890
                          </span>
                        </div>
                      </>
                    )}
                    
                    {!person.revealed && (
                      !isSignedIn ? (
                        <SignInButton mode="modal">
                          <Button
                            className="w-full mt-2 h-7 text-xs"
                            size="sm"
                          >
                            <Lock className="h-3 w-3 mr-1" />
                            Sign In to Reveal
                          </Button>
                        </SignInButton>
                      ) : (
                        <Button
                          className="w-full mt-2 h-7 text-xs"
                          size="sm"
                          onClick={() => revealContact(person.id)}
                        >
                          {isPremium ? (
                            'Reveal Contact'
                          ) : (
                            <>
                              <Lock className="h-3 w-3 mr-1" />
                              Unlock with Premium
                            </>
                          )}
                        </Button>
                      )
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 py-8">
            {[...Array(8)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-gradient-to-b from-gray-50 to-white border border-dashed border-gray-200 rounded-xl max-w-lg mx-auto">
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-full bg-red-50 border border-red-100">
                <Search className="h-8 w-8 text-red-500" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-1">
              No alumni found
            </h3>
            <p className="text-gray-500 text-sm mb-3">
              Try searching with a different name or company.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSearchName('');
                setSearchCompany('');
                setSearchCollege('');
                setHasSearched(false);
              }}
            >
              Clear Search
            </Button>
          </div>
        )}
      </div>
      
      <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
    </div>
  );
};

export default AlumniPage;