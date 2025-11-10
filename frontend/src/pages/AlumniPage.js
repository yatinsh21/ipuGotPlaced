import React, { useState, useEffect } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import axios from 'axios';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, MapPin, Briefcase, GraduationCap, Calendar, Mail, Phone, Lock, Crown } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AlumniPage = () => {
  const { user, isSignedIn } = useUser();
  const { getToken } = useAuth();
  const [alumni, setAlumni] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    company: '',
    name: '',
    role: '',
    location: '',
    years_of_experience: '',
    graduation_year: ''
  });

  const isPremium = user?.publicMetadata?.isPremium || user?.publicMetadata?.isAdmin;

  const getAuthConfig = async () => {
    if (!isSignedIn) return {};
    const token = await getToken();
    return {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
  };

  const searchAlumni = async () => {
    setLoading(true);
    try {
      const config = await getAuthConfig();
      const params = {};
      
      // Only add non-empty filters
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params[key] = filters[key];
        }
      });

      const response = await axios.get(`${API}/alumni/search`, {
        ...config,
        params
      });
      
      setAlumni(response.data);
      
      if (response.data.length === 0) {
        toast.info('No alumni found matching your criteria');
      }
    } catch (error) {
      console.error('Failed to search alumni:', error);
      toast.error('Failed to search alumni');
    } finally {
      setLoading(false);
    }
  };

  const revealContact = async (alumniId) => {
    if (!isPremium) {
      toast.error('Premium subscription required to reveal contacts');
      return;
    }

    try {
      const config = await getAuthConfig();
      const response = await axios.get(`${API}/alumni/${alumniId}/reveal`, config);
      
      // Update the alumni in the list with revealed info
      setAlumni(prevAlumni => 
        prevAlumni.map(a => 
          a.id === alumniId ? { ...a, ...response.data, revealed: true } : a
        )
      );
      
      toast.success('Contact revealed successfully!');
    } catch (error) {
      console.error('Failed to reveal contact:', error);
      toast.error('Failed to reveal contact');
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      company: '',
      name: '',
      role: '',
      location: '',
      years_of_experience: '',
      graduation_year: ''
    });
    setAlumni([]);
  };

  useEffect(() => {
    // Load all alumni on mount
    searchAlumni();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Alumni Network</h1>
          <p className="text-gray-600">Connect with alumni working at top companies</p>
          {!isPremium && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
              <Lock className="h-5 w-5 text-yellow-600" />
              <span className="text-yellow-800">
                Upgrade to <strong>Premium</strong> to reveal alumni contact information
              </span>
            </div>
          )}
        </div>

        {/* Search Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search Alumni
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                <Input
                  placeholder="e.g., Google, Microsoft"
                  value={filters.company}
                  onChange={(e) => handleFilterChange('company', e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <Input
                  placeholder="Search by name"
                  value={filters.name}
                  onChange={(e) => handleFilterChange('name', e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <Input
                  placeholder="e.g., Software Engineer"
                  value={filters.role}
                  onChange={(e) => handleFilterChange('role', e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <Input
                  placeholder="e.g., San Francisco"
                  value={filters.location}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
                <Input
                  type="number"
                  placeholder="e.g., 5"
                  value={filters.years_of_experience}
                  onChange={(e) => handleFilterChange('years_of_experience', e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Graduation Year</label>
                <Input
                  type="number"
                  placeholder="e.g., 2020"
                  value={filters.graduation_year}
                  onChange={(e) => handleFilterChange('graduation_year', e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex gap-2 mt-4">
              <Button onClick={searchAlumni} disabled={loading}>
                <Search className="h-4 w-4 mr-2" />
                {loading ? 'Searching...' : 'Search'}
              </Button>
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        ) : alumni.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {alumni.map((person) => (
              <Card key={person.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center justify-between">
                    <span>{person.name}</span>
                    {isPremium && <Crown className="h-5 w-5 text-yellow-500" />}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Briefcase className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">{person.role}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-gray-700">
                    <span className="font-semibold text-blue-600">{person.company}</span>
                  </div>
                  
                  {person.location && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span>{person.location}</span>
                    </div>
                  )}
                  
                  {person.years_of_experience && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>{person.years_of_experience} years experience</span>
                    </div>
                  )}
                  
                  {person.graduation_year && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <GraduationCap className="h-4 w-4 text-gray-400" />
                      <span>Class of {person.graduation_year}</span>
                    </div>
                  )}
                  
                  <div className="pt-3 border-t mt-3">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        {person.revealed || person.email.includes('@') ? (
                          <span className="text-sm">{person.email}</span>
                        ) : (
                          <span className="text-sm text-gray-400 blur-sm select-none">
                            email@example.com
                          </span>
                        )}
                      </div>
                      
                      {person.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          {person.revealed || !person.phone.includes('*') ? (
                            <span className="text-sm">{person.phone}</span>
                          ) : (
                            <span className="text-sm text-gray-400 blur-sm select-none">
                              123-456-7890
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {!person.revealed && (person.email.includes('*') || (person.phone && person.phone.includes('*'))) && (
                      <Button
                        className="w-full mt-3"
                        size="sm"
                        onClick={() => revealContact(person.id)}
                        disabled={!isPremium}
                      >
                        {isPremium ? (
                          <>Reveal Contact</>
                        ) : (
                          <>
                            <Lock className="h-4 w-4 mr-2" />
                            Premium Required
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No alumni found. Try adjusting your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlumniPage;
