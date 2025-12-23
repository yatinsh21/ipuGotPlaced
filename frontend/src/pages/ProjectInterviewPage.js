import React, { useState, useEffect } from 'react';
import { Crown, Lock, Sparkles, RefreshCw, ChevronDown, Loader2, X, CheckCircle2, AlertCircle, Check } from 'lucide-react';
import { useUser, useAuth, SignInButton } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
const API = `${BACKEND_URL}/api`;

// Sample questions for preview
const SAMPLE_QUESTIONS = {
  easy_questions: [
    { question: "Can you explain the main purpose of your project?", difficulty: "easy", topic: "Overview" },
    { question: "What technologies did you use and why?", difficulty: "easy", topic: "Tech Stack" },
    { question: "How did you structure your project folders?", difficulty: "easy", topic: "Architecture" },
  ],
  medium_questions: [
    { question: "What challenges did you face during development?", difficulty: "medium", topic: "Problem Solving" },
    { question: "How did you ensure code quality?", difficulty: "medium", topic: "Best Practices" },
    { question: "Explain the API design decisions you made.", difficulty: "medium", topic: "API Design" },
  ],
  hard_questions: [
    { question: "How would you scale this to 1 million users?", difficulty: "hard", topic: "Scalability" },
    { question: "Explain the database design and optimization.", difficulty: "hard", topic: "Database" },
    { question: "How did you handle security vulnerabilities?", difficulty: "hard", topic: "Security" },
  ]
};

const TECH_OPTIONS = [
  'React', 'Vue.js', 'Angular', 'Next.js', 'Node.js', 'Express.js',
  'Python', 'Django', 'FastAPI', 'Flask', 'Java', 'Spring Boot',
  'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Firebase',
  'AWS', 'Docker', 'Kubernetes', 'GraphQL', 'REST API',
  'TypeScript', 'JavaScript', 'Tailwind CSS', 'Material UI'
];

const ROLE_OPTIONS = ['Frontend', 'Backend', 'Full Stack', 'Solo'];

const ProjectInterviewPage = () => {
  const { isSignedIn, user } = useUser();
  const { getToken } = useAuth();
  const navigate = useNavigate();

  // Premium check
  const isPremium = user?.publicMetadata?.isPremium || user?.publicMetadata?.isAdmin;

  // Form state
  const [projectTitle, setProjectTitle] = useState('');
  const [techStack, setTechStack] = useState([]);
  const [techInput, setTechInput] = useState('');
  const [showTechDropdown, setShowTechDropdown] = useState(false);
  const [projectDescription, setProjectDescription] = useState('');
  const [featuresImplemented, setFeaturesImplemented] = useState('');
  const [studentRole, setStudentRole] = useState('');
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState(null);
  const [remainingGenerations, setRemainingGenerations] = useState(3);
  const [activeTab, setActiveTab] = useState('easy');
  const [showPayment, setShowPayment] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);

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
    const handleResize = () => setIsMobileDevice(checkIfMobile());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch rate limit on mount for premium users
  useEffect(() => {
    if (isSignedIn && isPremium) {
      fetchRateLimit();
    }
  }, [isSignedIn, isPremium]);

  const fetchRateLimit = async () => {
    try {
      const token = await getToken();
      const response = await axios.get(`${API}/project-interview/rate-limit`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRemainingGenerations(response.data.remaining_generations);
    } catch (error) {
      console.error('Failed to fetch rate limit:', error);
    }
  };

  const addTech = (tech) => {
    if (!techStack.includes(tech)) {
      setTechStack([...techStack, tech]);
    }
    setTechInput('');
    setShowTechDropdown(false);
  };

  const removeTech = (tech) => {
    setTechStack(techStack.filter(t => t !== tech));
  };

  const filteredTechOptions = TECH_OPTIONS.filter(
    tech => tech.toLowerCase().includes(techInput.toLowerCase()) && !techStack.includes(tech)
  );

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
      
      console.log('✓ Token received from Clerk');
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
      console.log('Step 3: Opening Razorpay checkout...');
      
      const razorpayOptions = {
        key: 'rzp_live_RbBiOlLpYoy4f3',
        amount: orderResponse.data.amount,
        currency: 'INR',
        order_id: orderResponse.data.id,
        name: 'IGP Premium',
        description: 'Lifetime access to all premium features',
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
      
      if (error.response?.status === 401) {
        toast.error('Authentication failed. Please sign out and sign in again.');
      } else if (error.response?.status === 500) {
        toast.error('High demand! Please try again');
      } else {
        toast.error('High demand! Please try again');
      }
    }
  };

  const handleSubmit = async () => {
    // If not signed in, show sign in prompt
    if (!isSignedIn) {
      toast.error('Please sign in to use this feature');
      return;
    }

    // If not premium, show payment modal
    if (!isPremium) {
      setShowPayment(true);
      return;
    }

    // Validate form
    if (!projectTitle.trim()) {
      toast.error('Please enter a project title');
      return;
    }
    if (techStack.length === 0) {
      toast.error('Please add at least one technology');
      return;
    }
    if (!projectDescription.trim()) {
      toast.error('Please describe your project');
      return;
    }
    if (!featuresImplemented.trim()) {
      toast.error('Please list the features you implemented');
      return;
    }
    if (!studentRole) {
      toast.error('Please select your role');
      return;
    }

    setLoading(true);
    try {
      const token = await getToken();
      const response = await axios.post(
        `${API}/project-interview/generate`,
        {
          project_title: projectTitle,
          tech_stack: techStack,
          project_description: projectDescription,
          features_implemented: featuresImplemented,
          student_role: studentRole
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setQuestions(response.data.questions);
      setRemainingGenerations(response.data.remaining_generations);
      toast.success('Interview questions generated successfully!');
      setActiveTab('easy');
    } catch (error) {
      console.error('Failed to generate questions:', error);
      if (error.response?.status === 429) {
        toast.error('Daily limit reached. You can generate up to 3 sets per day.');
      } else if (error.response?.status === 403) {
        toast.error('Premium subscription required for this feature');
        setShowPayment(true);
      } else {
        toast.error(error.response?.data?.detail || 'Failed to generate questions. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = () => {
    if (remainingGenerations <= 0) {
      toast.error('Daily limit reached. Try again tomorrow.');
      return;
    }
    setQuestions(null);
    handleSubmit();
  };

  const QuestionCard = ({ question, index, blurred = false }) => (
    <div className={`relative group ${blurred ? 'select-none' : ''}`}>
      <div className="flex gap-3 p-4 rounded-lg border border-gray-200 bg-white hover:border-gray-300 transition-colors">
        <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-gray-100 rounded-full text-sm font-medium text-gray-600">
          {index + 1}
        </span>
        <div className="flex-1 min-w-0">
          <p className={`text-gray-800 leading-relaxed ${blurred ? 'blur-sm' : ''}`}>
            {question.question}
          </p>
          <span className={`inline-block mt-2 text-xs text-gray-500 ${blurred ? 'blur-sm' : ''}`}>
            {question.topic}
          </span>
        </div>
      </div>
      {blurred && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/60 rounded-lg">
          <Lock className="h-4 w-4 text-gray-400" />
        </div>
      )}
    </div>
  );

  const TabButton = ({ id, label, count }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
        activeTab === id
          ? 'bg-gray-900 text-white'
          : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      {label} <span className="text-xs opacity-75">({count})</span>
    </button>
  );

  const displayQuestions = questions || SAMPLE_QUESTIONS;

  // Payment Modal
  if (showPayment && isSignedIn && !isPremium) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-white max-w-3xl w-full p-8 rounded-2xl shadow-2xl border border-gray-100 max-h-[95vh] overflow-y-auto">
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
              <div className="p-2 bg-gray-50 font-semibold border-b border-r">Features</div>
              <div className="p-2 bg-gray-50 font-semibold text-center border-b border-r">Free</div>
              <div className="p-2 bg-yellow-50 font-semibold text-center border-b border-l border-yellow-500">Premium</div>

              {[
                ["Topic-wise Questions", true, true],
                ["Company-wise Questions", false, true],
                ["Project Interview Questions", false, true],
                ["Bookmark Questions", false, true],
                ["Premium Experiences", false, true],
                ["AI-Powered Features", false, true],
              ].map(([feature, free, premium], idx) => (
                <React.Fragment key={idx}>
                  <div className="p-2 border-b border-r text-xs sm:text-sm">{feature}</div>
                  <div className="p-2 border-b border-r text-center">
                    {free ? <Check className="h-4 w-4 text-green-600 mx-auto" /> : <X className="h-4 w-4 text-red-500 mx-auto" />}
                  </div>
                  <div className="p-2 border-b border-l border-yellow-500 text-center">
                    {premium ? <Check className="h-4 w-4 text-green-600 mx-auto" /> : <X className="h-4 w-4 text-red-500 mx-auto" />}
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="text-center space-y-4">
            <button
              onClick={handlePayment}
              className="w-full sm:w-auto bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-10 py-4 text-base rounded-xl shadow-md transition-all duration-200 hover:shadow-lg"
            >
              Upgrade Now <Check className="inline ml-2" />
            </button>

            <button
              onClick={() => setShowPayment(false)}
              className="block mx-auto text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200"
            >
              Continue Without Premium
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar placeholder */}
      <Navbar/>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <Sparkles className="h-4 w-4" />
            AI-Powered Interview Prep
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Project Interview Questions
          </h1>
          <p className="text-gray-600 max-w-2xl">
            Generate personalized interview questions based on your project experience
          </p>
        </div>

        {/* Premium Banner for non-premium users */}
        {isSignedIn && !isPremium && (
          <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Crown className="h-5 w-5 text-amber-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-900">Premium Feature</p>
                <p className="text-sm text-gray-600">Unlock AI-generated questions for your projects</p>
              </div>
            </div>
            <button
              onClick={() => setShowPayment(true)}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors whitespace-nowrap"
            >
              Upgrade for ₹299
            </button>
          </div>
        )}

        {/* Not signed in banner */}
        {!isSignedIn && (
          <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-blue-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-900">Sign in to Get Started</p>
                <p className="text-sm text-gray-600">Create an account to generate personalized questions</p>
              </div>
            </div>
            <SignInButton mode="modal">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors whitespace-nowrap">
                Sign In
              </button>
            </SignInButton>
          </div>
        )}

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Form Section - 2 columns */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-5 lg:sticky lg:top-8">
              {/* Project Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Title *
                </label>
                <input
                  type="text"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  placeholder="E-commerce Platform"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all"
                />
              </div>

              {/* Tech Stack */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tech Stack *
                </label>
                {techStack.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {techStack.map((tech) => (
                      <span
                        key={tech}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                      >
                        {tech}
                        <button
                          type="button"
                          onClick={() => removeTech(tech)}
                          className="hover:text-gray-900"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="relative">
                  <input
                    type="text"
                    value={techInput}
                    onChange={(e) => {
                      setTechInput(e.target.value);
                      setShowTechDropdown(true);
                    }}
                    onFocus={() => setShowTechDropdown(true)}
                    placeholder="Search technologies..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all"
                  />
                  {showTechDropdown && techInput && filteredTechOptions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {filteredTechOptions.slice(0, 6).map((tech) => (
                        <button
                          key={tech}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            addTech(tech);
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                        >
                          {tech}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Project Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="Describe what your project does..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all resize-none"
                />
              </div>

              {/* Features */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Key Features *
                </label>
                <textarea
                  value={featuresImplemented}
                  onChange={(e) => setFeaturesImplemented(e.target.value)}
                  placeholder="List main features..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all resize-none"
                />
              </div>

              {/* Role */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Role *
                </label>
                <button
                  type="button"
                  onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                  className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg bg-white text-left hover:border-gray-400 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all"
                >
                  <span className={studentRole ? 'text-gray-900' : 'text-gray-500'}>
                    {studentRole || 'Select your role...'}
                  </span>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </button>
                {showRoleDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                    {ROLE_OPTIONS.map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => {
                          setStudentRole(role);
                          setShowRoleDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : isPremium ? (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate Questions
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    Premium Required
                  </>
                )}
              </button>

              {isPremium && (
                <p className="text-xs text-center text-gray-500 flex items-center justify-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {remainingGenerations} generations remaining today
                </p>
              )}
            </div>
          </div>

          {/* Questions Section - 3 columns */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {questions ? 'Your Questions' : 'Preview'}
                  </h2>
                  {questions && isPremium && (
                    <button
                      onClick={handleRegenerate}
                      disabled={loading || remainingGenerations <= 0}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                      Regenerate
                    </button>
                  )}
                </div>

                <div className="flex gap-2 overflow-x-auto">
                  <TabButton id="easy" label="Easy" count={displayQuestions.easy_questions.length} />
                  <TabButton id="medium" label="Medium" count={displayQuestions.medium_questions.length} />
                  <TabButton id="hard" label="Hard" count={displayQuestions.hard_questions.length} />
                </div>
              </div>

              <div className="p-6 space-y-3 relative min-h-[400px]">
                {activeTab === 'easy' && displayQuestions.easy_questions.map((q, idx) => (
                  <QuestionCard key={idx} question={q} index={idx} blurred={!isPremium && !questions} />
                ))}
                {activeTab === 'medium' && displayQuestions.medium_questions.map((q, idx) => (
                  <QuestionCard key={idx} question={q} index={idx} blurred={!isPremium && !questions} />
                ))}
                {activeTab === 'hard' && displayQuestions.hard_questions.map((q, idx) => (
                  <QuestionCard key={idx} question={q} index={idx} blurred={!isPremium && !questions} />
                ))}

                {/* Premium Overlay */}
                {!isPremium && !questions && (
                  <div className="absolute inset-0 bg-gradient-to-t from-white via-white/95 to-transparent flex items-center justify-center">
                    <div className="text-center p-6 max-w-sm">
                      <Lock className="h-10 w-10 mx-auto mb-3 text-gray-400" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Premium Feature
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Get personalized questions for your specific project
                      </p>
                      <button
                        onClick={() => setShowPayment(true)}
                        className="px-6 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                      >
                        Upgrade to Premium
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Info Cards */}
            <div className="grid sm:grid-cols-3 gap-4 mt-6">
              <div className="p-4 bg-white rounded-lg border border-gray-200">
                <Sparkles className="h-5 w-5 text-gray-900 mb-2" />
                <p className="text-sm font-medium text-gray-900 mb-1">Personalized</p>
                <p className="text-xs text-gray-600">Questions tailored to your project</p>
              </div>
              <div className="p-4 bg-white rounded-lg border border-gray-200">
                <CheckCircle2 className="h-5 w-5 text-gray-900 mb-2" />
                <p className="text-sm font-medium text-gray-900 mb-1">3 Difficulty Levels</p>
                <p className="text-xs text-gray-600">Easy, medium, and hard questions</p>
              </div>
              <div className="p-4 bg-white rounded-lg border border-gray-200">
                <RefreshCw className="h-5 w-5 text-gray-900 mb-2" />
                <p className="text-sm font-medium text-gray-900 mb-1">3 Per Day</p>
                <p className="text-xs text-gray-600">Generate multiple question sets</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProjectInterviewPage;