import { useState, useEffect } from 'react';
import axios from 'axios';
import { useUser, useAuth } from '@clerk/clerk-react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import SEOHelmet from '@/components/SEOHelmet';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bookmark, BookmarkCheck, Lock, Crown } from 'lucide-react';
import { toast } from 'sonner';
import '../copyProtection.css';
import TopBanner from '@/components/TopBanner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const HomePage = () => {
  const { isSignedIn, user } = useUser();
  const { getToken } = useAuth();
  const [searchParams] = useSearchParams();
  const [topics, setTopics] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [difficulty, setDifficulty] = useState('all');
  const [loading, setLoading] = useState(true);
  const [bookmarkedIds, setBookmarkedIds] = useState([]);
  const [seoData, setSeoData] = useState(null);
  
  const isPremium = user?.publicMetadata?.isPremium || user?.publicMetadata?.isAdmin;

  useEffect(() => {
    fetchTopics();
    if (isPremium && isSignedIn) {
      // Fetch user's bookmarks from backend
      fetchUserBookmarks();
    }
    
    // Check if topic parameter is in URL
    const topicParam = searchParams.get('topic');
    if (topicParam) {
      setSelectedTopic(topicParam);
    }
  }, [isPremium, isSignedIn, searchParams]);

  useEffect(() => {
    // Fetch SEO data based on selected topic or general topics page
    if (selectedTopic) {
      fetchTopicSEO(selectedTopic);
    } else {
      fetchTopicsPageSEO();
    }
  }, [selectedTopic]);

  const fetchTopicsPageSEO = async () => {
    try {
      const response = await axios.get(`${API}/seo/topics-page`);
      setSeoData(response.data);
    } catch (error) {
      console.error('Failed to fetch SEO data:', error);
    }
  };

  const fetchTopicSEO = async (topicId) => {
    try {
      const response = await axios.get(`${API}/seo/topic/${topicId}`);
      setSeoData(response.data);
    } catch (error) {
      console.error('Failed to fetch topic SEO data:', error);
    }
  };

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

  useEffect(() => {
    if (selectedTopic) {
      fetchQuestions();
    }
  }, [selectedTopic, difficulty]);

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
      // Prevent Ctrl+C, Ctrl+X, Ctrl+A, Ctrl+U, F12
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

  const fetchTopics = async () => {
    try {
      const response = await axios.get(`${API}/topics`);
      setTopics(response.data);
      // Removed: setSelectedTopic(response.data[0].id) - No default selection
    } catch (error) {
      console.error('Failed to fetch topics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestions = async () => {
    try {
      const params = new URLSearchParams({ topic_id: selectedTopic });
      if (difficulty !== 'all') {
        params.append('difficulty', difficulty);
      }
      const response = await axios.get(`${API}/questions?${params}`);
      setQuestions(response.data);
    } catch (error) {
      console.error('Failed to fetch questions:', error);
    }
  };

  const getDifficultyColor = (diff) => {
    switch(diff) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const toggleBookmark = async (questionId, e) => {
    e.stopPropagation();
    
    if (!isSignedIn) {
      toast.error('Please sign in to bookmark questions');
      return;
    }
    
    if (!isPremium) {
      toast.error('Premium subscription required to bookmark questions');
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
        <div className="mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Ace your next tech interview like a <span className='text-red-600 font-extrabold underline'>Pro</span> 
          </h1>
          <p className="text-lg text-gray-600"> Carefully curated catalog of interview essential Questions</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <>
            {/* Topics Grid - Compact layout for 30+ topics */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900">Select Topic</h2>
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2">
                {topics.map((topic) => (
                  <div
                    key={topic.id}
                    onClick={() => setSelectedTopic(topic.id)}
                    data-testid={`topic-${topic.id}`}
                    className={`p-3 border-2 cursor-pointer transition-all text-center ${
                      selectedTopic === topic.id
                        ? 'border-gray-900 bg-white shadow-md'
                        : 'border-gray-200 bg-white hover:border-gray-400'
                    }`}
                  >
                    <h3 className="text-sm font-semibold text-gray-900">{topic.name}</h3>
                  </div>
                ))}
              </div>
            </div>

            {/* Show content only when a topic is selected */}
            {selectedTopic ? (
              <>
                {/* Difficulty Filter */}
                <div className="mb-6 flex items-center gap-4">
                  <label className="text-sm font-medium text-gray-700">Filter by difficulty:</label>
                  <Select value={difficulty} onValueChange={setDifficulty}>
                    <SelectTrigger data-testid="difficulty-filter" className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <TopBanner/>

                {/* Questions Accordion */}
                {questions.length > 0 ? (
                  <div className="bg-white border border-gray-200 shadow-sm">
                    <Accordion type="single" collapsible className="w-full">
                      {questions.map((question, index) => (
                        <AccordionItem 
                          key={question.id} 
                          value={question.id}
                        >
                          <AccordionTrigger 
                            data-testid={`question-${index}`}
                            className="px-6 py-4 hover:bg-gray-50 text-left no-copy"
                          >
                            <div className="flex items-center gap-3 flex-1 justify-between">
                              <div className="flex items-center gap-3 flex-1">
                                <span className="font-medium text-gray-900">{question.question}</span>
                                <Badge className={getDifficultyColor(question.difficulty)}>
                                  {question.difficulty}
                                </Badge>
                              </div>
                              {user?.is_premium && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => toggleBookmark(question.id, e)}
                                  data-testid={`bookmark-${index}`}
                                  className="ml-2"
                                >
                                  {bookmarkedIds.includes(question.id) ? (
                                    <BookmarkCheck className="h-5 w-5 text-gray-900" />
                                  ) : (
                                    <Bookmark className="h-5 w-5 text-gray-400" />
                                  )}
                                </Button>
                              )}
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
                  </div>
                ) : (
                  <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
                    <p className="text-gray-500">No questions found for this topic and difficulty.</p>
                  </div>
                )}
              </>
            ) : (
              /* Placeholder message when no topic is selected */
              <div className="text-center py-20 bg-gradient-to-b from-gray-50 to-white border border-dashed border-gray-300 rounded-xl">
                <div className="flex justify-center mb-4">
                  <div className="p-4 rounded-full bg-blue-50 border border-blue-100">
                    <Bookmark className="h-10 w-10 text-blue-600" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  Select a topic to get started
                </h3>
                <p className="text-gray-500 text-sm">
                  Click on any topic above to view interview questions
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default HomePage;