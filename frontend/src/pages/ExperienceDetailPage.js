import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ArrowLeft, Calendar, Briefcase, Hash } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ExperienceDetailPage = () => {
  const { experienceId } = useParams();
  const navigate = useNavigate();
  const [experience, setExperience] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExperience();
  }, [experienceId]);

  const fetchExperience = async () => {
    try {
      const response = await axios.get(`${API}/experiences`);
      const exp = response.data.find(e => e.id === experienceId);
      setExperience(exp);
    } catch (error) {
      console.error('Failed to fetch experience:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const parseExperience = (text) => {
    // Split by new lines and identify rounds and other sections
    const lines = text.split('\\n').filter(line => line.trim());
    const sections = [];
    let currentSection = { type: 'other', content: [] };

    lines.forEach(line => {
      const trimmedLine = line.trim();
      
      // Check if it's a round line
      if (trimmedLine.match(/^Round \d+:/i)) {
        // Save previous section if it has content
        if (currentSection.content.length > 0) {
          sections.push(currentSection);
        }
        // Start new round section
        const [title, ...descParts] = trimmedLine.split(':');
        currentSection = {
          type: 'round',
          title: title.trim(),
          content: [descParts.join(':').trim()]
        };
      } else if (trimmedLine.match(/^(Tips?|Focus|Note|Important):/i)) {
        // Save previous section
        if (currentSection.content.length > 0) {
          sections.push(currentSection);
        }
        // Start tips/focus section
        const [title, ...descParts] = trimmedLine.split(':');
        currentSection = {
          type: 'tips',
          title: title.trim(),
          content: [descParts.join(':').trim()]
        };
      } else if (trimmedLine) {
        // Add to current section
        currentSection.content.push(trimmedLine);
      }
    });

    // Push last section
    if (currentSection.content.length > 0) {
      sections.push(currentSection);
    }

    return sections;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  if (!experience) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Experience not found</h1>
          <Button onClick={() => navigate('/experiences')}>Back to Experiences</Button>
        </div>
      </div>
    );
  }

  const sections = parseExperience(experience.experience);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/experiences')}
          className="mb-6"
          data-testid="back-btn"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Experiences
        </Button>

        <Card className="border-2 border-gray-200">
          <CardContent className="p-8">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">{experience.company_name}</h1>
              
              <div className="flex flex-wrap gap-4 text-gray-600">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  <span className="font-medium">{experience.role}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Hash className="h-5 w-5" />
                  <Badge className="bg-gray-900 text-white">{experience.rounds} rounds</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  <span className="text-sm">{formatDate(experience.posted_at)}</span>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 my-8"></div>

            {/* Experience Content - Rounds in Accordion */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Interview Process</h2>
              
              <Accordion type="single" collapsible className="w-full space-y-2">
                {sections.map((section, index) => {
                  if (section.type === 'round') {
                    return (
                      <AccordionItem 
                        key={index} 
                        value={`round-${index}`}
                        className="border-2 border-gray-200 px-4 rounded"
                      >
                        <AccordionTrigger 
                          className="hover:no-underline py-4"
                          data-testid={`round-${index}`}
                        >
                          <span className="text-lg font-semibold text-gray-900">{section.title}</span>
                        </AccordionTrigger>
                        <AccordionContent className="pb-4 pt-2">
                          <div className="text-gray-700 space-y-2">
                            {section.content.map((line, i) => (
                              <p key={i}>{line}</p>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  }
                  return null;
                })}
              </Accordion>

              {/* Tips/Focus Section */}
              {sections.some(s => s.type === 'tips') && (
                <div className="mt-8 p-6 bg-blue-50 border-2 border-blue-200 rounded">
                  {sections.filter(s => s.type === 'tips').map((section, index) => (
                    <div key={index}>
                      <h3 className="text-lg font-bold text-gray-900 mb-3">{section.title}:</h3>
                      <div className="text-gray-700 space-y-2">
                        {section.content.map((line, i) => (
                          <p key={i}>{line}</p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Other content that doesn't fit in rounds or tips */}
              {sections.some(s => s.type === 'other') && (
                <div className="mt-6 text-gray-700">
                  {sections.filter(s => s.type === 'other').map((section, index) => (
                    <div key={index} className="space-y-2">
                      {section.content.map((line, i) => (
                        <p key={i}>{line}</p>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Related Experiences */}
        <div className="mt-8">
          <Button 
            variant="outline" 
            onClick={() => navigate('/experiences')}
            className="w-full border-2 border-gray-200 hover:border-gray-900"
          >
            View More Interview Experiences
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ExperienceDetailPage;