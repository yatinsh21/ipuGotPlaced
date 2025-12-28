import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '@/components/Navbar';
import SEOHelmet from '@/components/SEOHelmet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ChevronRight, Search, Briefcase, Calendar } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ExperiencesPage = () => {
  const navigate = useNavigate();
  const [experiences, setExperiences] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [seoData, setSeoData] = useState(null);

  useEffect(() => {
    fetchData();
    fetchSEOData();
  }, []);

  const fetchSEOData = async () => {
    try {
      const response = await axios.get(`${API}/seo/experiences`);
      setSeoData(response.data);
    } catch (error) {
      console.error('Failed to fetch SEO data:', error);
    }
  };

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
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getExcerpt = (text, maxLength = 120) => {
    const cleanText = text.replace(/\\n/g, ' ').trim();
    if (cleanText.length <= maxLength) return cleanText;
    return cleanText.substring(0, maxLength) + '...';
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
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Compact Hero Section */}
        <div className="mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
           <span className='text-green-500'>Genuine</span>  Interview Experiences
          </h1>
          <p className="text-gray-600 mb-4">
            Real experiences from candidates who got offers
          </p>
          
          {/* Search Bar */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 focus:border-gray-900 focus:ring-2 focus:ring-gray-900 focus:bg-white transition-all duration-200 placeholder:text-gray-400" />
              <Input
                type="text"
                placeholder="Search by company or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10 w-full text-sm border-2 border-gray-200 focus:border-gray-900 rounded-lg"
                data-testid="search-experiences"
              />
            </div>
            {/* <div className="px-3 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium whitespace-nowrap">
              {filteredExperiences.length} experiences
            </div> */}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-gray-900"></div>
          </div>
        ) : (
          <>
            {/* Compact Experience Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredExperiences.map((exp) => (
                <Card 
                  key={exp.id} 
                  className="border border-gray-200 hover:border-gray-900 hover:shadow-lg transition-all cursor-pointer group bg-white" 
                  onClick={() => navigate(`/experience/${exp.id}`)}
                  data-testid={`experience-${exp.id}`}
                >
                  <CardHeader className="pb-2 pt-4 px-4">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <CardTitle className="text-lg font-bold text-gray-900 leading-tight group-hover:text-gray-700 transition-colors line-clamp-1">
                        {exp.company_name}
                      </CardTitle>
                      <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-gray-900 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <Briefcase className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="font-medium line-clamp-1">{exp.role}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 text-xs text-gray-500">
                     
                      <Badge className="bg-gray-900 text-white text-xs h-5 px-2">
                        {exp.rounds} rounds
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-2 pb-4 px-4">
                    <p className="text-xs text-gray-600 leading-relaxed line-clamp-2 mb-2">
                      {getExcerpt(exp.experience)}
                    </p>
                    
                    <div className="flex items-center text-gray-900 font-medium text-xs group-hover:underline">
                      Read more
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Empty States */}
            {filteredExperiences.length === 0 && !loading && searchTerm && (
              <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
                <Search className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-900 font-semibold mb-1">No experiences found</p>
                <p className="text-gray-500 text-sm">Try different keywords</p>
              </div>
            )}

            {experiences.length === 0 && !loading && !searchTerm && (
              <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
                <Briefcase className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500">No interview experiences available yet</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ExperiencesPage;