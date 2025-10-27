import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ChevronRight, Search } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ExperiencesPage = () => {
  const navigate = useNavigate();
  const [experiences, setExperiences] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const expRes = await axios.get(`${API}/experiences`);
      setExperiences(expRes.data);
    } catch (error) {
      console.error('Failed to fetch experiences:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const getExcerpt = (text, maxLength = 200) => {
    // Remove \n and clean text
    const cleanText = text.replace(/\\n/g, ' ').trim();
    if (cleanText.length <= maxLength) return cleanText;
    return cleanText.substring(0, maxLength) + '...';
  };

  const getRoundsDescription = (text) => {
    // Extract first round info as preview
    const lines = text.split('\\n');
    const roundLines = lines.filter(line => line.trim().match(/^Round \d+:/i));
    return roundLines.length > 0 ? roundLines[0].replace(/Round \d+:\s*/i, '') : '';
  };

  const filteredExperiences = experiences.filter(exp => {
    if (searchTerm) {
      return exp.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
             exp.role.toLowerCase().includes(searchTerm.toLowerCase());
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">Interview Experiences</h1>
          <p className="text-lg text-gray-600 mb-6">Real interview experiences from candidates who got offers</p>
          
          {/* Search Bar */}
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by company name or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 border-2 border-gray-200 focus:border-gray-900"
              data-testid="search-experiences"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <>
            <div className="mb-4 text-sm text-gray-600">
              Showing {filteredExperiences.length} {filteredExperiences.length === 1 ? 'experience' : 'experiences'}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredExperiences.map((exp) => (
                <Card 
                  key={exp.id} 
                  className="border-2 border-gray-200 hover:border-gray-900 transition-all cursor-pointer group" 
                  onClick={() => navigate(`/experience/${exp.id}`)}
                  data-testid={`experience-${exp.id}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <CardTitle className="text-2xl font-bold text-gray-900 mb-2">{exp.company_name}</CardTitle>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-base font-semibold text-gray-700">{exp.role}</p>
                          <Badge className="bg-gray-900 text-white">{exp.rounds} rounds</Badge>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">{formatDate(exp.posted_at)}</p>
                  </CardHeader>
                  
                  <CardContent>
                    {/* First Round Preview */}
                    {getRoundsDescription(exp.experience) && (
                      <div className="mb-3 p-3 bg-gray-50 border border-gray-200 rounded">
                        <p className="text-xs font-semibold text-gray-500 mb-1">First Round:</p>
                        <p className="text-sm text-gray-700">{getRoundsDescription(exp.experience)}</p>
                      </div>
                    )}
                    
                    {/* Description Excerpt */}
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                      {getExcerpt(exp.experience)}
                    </p>
                    
                    {/* Read More Link */}
                    <div className="flex items-center text-gray-900 font-medium text-sm group-hover:underline">
                      Read full interview experience
                      <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredExperiences.length === 0 && !loading && (
              <div className="text-center py-12 bg-white border-2 border-gray-200">
                <Search className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500 text-lg">No experiences found matching "{searchTerm}"</p>
                <p className="text-gray-400 text-sm mt-2">Try searching with different keywords</p>
              </div>
            )}

            {experiences.length === 0 && !loading && !searchTerm && (
              <div className="text-center py-12 bg-white border-2 border-gray-200">
                <p className="text-gray-500">No interview experiences available yet.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ExperiencesPage;