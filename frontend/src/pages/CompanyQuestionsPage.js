import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '@/App';
import Navbar from '@/components/Navbar';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bookmark, BookmarkCheck, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CompanyQuestionsPage = () => {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [questions, setQuestions] = useState([]);
  const [company, setCompany] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [bookmarkedIds, setBookmarkedIds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      setBookmarkedIds(user.bookmarked_questions || []);
      fetchCompanyAndQuestions();
    }
  }, [companyId, user]);

  const fetchCompanyAndQuestions = async () => {
    try {
      const [companiesRes, questionsRes] = await Promise.all([
        axios.get(`${API}/companies`, { withCredentials: true }),
        axios.get(`${API}/company-questions/${companyId}`, { withCredentials: true })
      ]);
      
      const comp = companiesRes.data.find(c => c.id === companyId);
      setCompany(comp);
      setQuestions(questionsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const toggleBookmark = async (questionId) => {
    try {
      const response = await axios.post(
        `${API}/bookmark/${questionId}`,
        {},
        { withCredentials: true }
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
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Please sign in</h1>
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
              {company?.logo_url ? (
                <img src={company.logo_url} alt={company.name} className="h-16 w-16 object-contain" />
              ) : (
                <div className="h-16 w-16 bg-gray-200 flex items-center justify-center">
                  <span className="text-2xl font-bold text-gray-600">{company?.name.charAt(0)}</span>
                </div>
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
              <Accordion type="single" collapsible className="w-full">
                {filteredQuestions.map((question, index) => (
                  <AccordionItem key={question.id} value={question.id}>
                    <AccordionTrigger 
                      data-testid={`question-${index}`}
                      className="px-6 py-4 hover:bg-gray-50 text-left"
                    >
                      <div className="flex items-center justify-between flex-1 gap-4">
                        <div className="flex items-center gap-3 flex-1">
                          <span className="text-gray-500 font-medium">Q{index + 1}.</span>
                          <span className="font-medium text-gray-900">{question.question}</span>
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
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleBookmark(question.id);
                            }}
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
                      <div className="prose max-w-none">
                        <p className="text-gray-700 whitespace-pre-wrap">{question.answer}</p>
                      </div>
                    </AccordionContent>
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
    </div>
  );
};

export default CompanyQuestionsPage;