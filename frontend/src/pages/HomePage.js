import { useState, useEffect } from 'react';
import axios from 'axios';
import { useUser, useAuth } from '@clerk/clerk-react';
import Navbar from '@/components/Navbar';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bookmark, BookmarkCheck, Lock, Crown } from 'lucide-react';
import { toast } from 'sonner';
import '../copyProtection.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const HomePage = () => {
  const { isSignedIn, user } = useUser();
  const { getToken } = useAuth();
  const [topics, setTopics] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [difficulty, setDifficulty] = useState('all');
  const [loading, setLoading] = useState(true);
  const [bookmarkedIds, setBookmarkedIds] = useState([]);
  
  const isPremium = user?.publicMetadata?.isPremium || user?.publicMetadata?.isAdmin;

  useEffect(() => {
    fetchTopics();
    if (isPremium && isSignedIn) {
      // Fetch user's bookmarks from backend
      fetchUserBookmarks();
    }
  }, [isPremium, isSignedIn]);

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
      if (response.data.length > 0) {
        setSelectedTopic(response.data[0].id);
      }
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
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Ace your next tech interview like a <span className='text-red-600 font-extrabold underline'>Pro</span> 
          </h1>
          <p className="text-lg text-gray-600">Actual interviews from real experiences!</p>
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

            {/* Questions Accordion */}
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
                          <span className="text-gray-500 font-medium">Q{index + 1}.</span>
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

            {questions.length === 0 && (
              <div className="text-center py-12 bg-white border border-gray-200">
                <p className="text-gray-500">No questions found for this topic and difficulty.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default HomePage;