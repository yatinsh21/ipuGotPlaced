import { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ExperiencesPage = () => {
  const [experiences, setExperiences] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [expRes, compRes] = await Promise.all([
        axios.get(`${API}/experiences`),
        axios.get(`${API}/topics`) // Using topics as proxy for companies list
      ]);
      setExperiences(expRes.data);
    } catch (error) {
      console.error('Failed to fetch experiences:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredExperiences = selectedCompany === 'all'
    ? experiences
    : experiences.filter(exp => exp.company_id === selectedCompany);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">Interview Experiences</h1>
          <p className="text-lg text-gray-600">Real interview experiences from candidates</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {filteredExperiences.map((exp) => (
                <Card key={exp.id} className="border-2 border-gray-200 hover:border-gray-900 transition-all" data-testid={`experience-${exp.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <CardTitle className="text-xl font-bold text-gray-900">{exp.company_name}</CardTitle>
                      <Badge className="bg-gray-900 text-white">{exp.rounds} rounds</Badge>
                    </div>
                    <p className="text-sm font-medium text-gray-700">{exp.role}</p>
                    <p className="text-xs text-gray-500">{formatDate(exp.posted_at)}</p>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{exp.experience}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredExperiences.length === 0 && (
              <div className="text-center py-12 bg-white border border-gray-200">
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