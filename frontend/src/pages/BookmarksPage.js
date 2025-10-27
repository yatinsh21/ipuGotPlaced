import { useState, useEffect } from 'react';
import axios from 'axios';
import { useUser } from '@clerk/clerk-react';
import Navbar from '@/components/Navbar';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookmarkCheck } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const BookmarksPage = () => {
  const { isSignedIn, user } = useUser();
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const isPremium = user?.publicMetadata?.isPremium || user?.publicMetadata?.isAdmin;

  useEffect(() => {
    if (isPremium && isSignedIn) {
      fetchBookmarks();
    }
  }, [isPremium, isSignedIn]);

  const fetchBookmarks = async () => {
    try {
      const token = await user.getClerkSessionToken();
      const response = await axios.get(`${API}/bookmarks`, { 
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setBookmarks(response.data);
    } catch (error) {
      console.error('Failed to fetch bookmarks:', error);
      toast.error('Failed to load bookmarks');
    } finally {
      setLoading(false);
    }
  };

  const removeBookmark = async (questionId) => {
    try {
      const token = await user.getClerkSessionToken();
      await axios.post(`${API}/bookmark/${questionId}`, {}, { 
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setBookmarks(bookmarks.filter(q => q.id !== questionId));
      toast.success('Bookmark removed');
    } catch (error) {
      toast.error('Failed to remove bookmark');
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">Bookmarked Questions</h1>
          <p className="text-lg text-gray-600">Your saved questions for quick reference</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <>
            {bookmarks.length > 0 ? (
              <div className="bg-white border border-gray-200 shadow-sm">
                <Accordion type="single" collapsible className="w-full">
                  {bookmarks.map((question, index) => (
                    <AccordionItem key={question.id} value={question.id}>
                      <AccordionTrigger 
                        data-testid={`bookmark-${index}`}
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
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeBookmark(question.id);
                              }}
                              data-testid={`remove-bookmark-${index}`}
                            >
                              <BookmarkCheck className="h-5 w-5 text-gray-900" />
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
            ) : (
              <div className="text-center py-12 bg-white border border-gray-200">
                <BookmarkCheck className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">No bookmarked questions yet.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default BookmarksPage;