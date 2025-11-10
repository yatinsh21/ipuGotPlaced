import React, { useState, useEffect } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import axios from 'axios';
import Navbar from '@/components/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, MapPin, Briefcase, GraduationCap, Calendar, Mail, Phone, Lock, Crown, Building2 } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AlumniPage = () => {
  const { user, isSignedIn } = useUser();
  const { getToken } = useAuth();
  const [alumni, setAlumni] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [searchCompany, setSearchCompany] = useState('');

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

  const searchAlumni = async (name = searchName, company = searchCompany) => {
    setLoading(true);
    try {
      const config = await getAuthConfig();
      const params = {};
      
      if (name) params.name = name;
      if (company) params.company = company;

      const response = await axios.get(`${API}/alumni/search`, {
        ...config,
        params
      });
      
      setAlumni(response.data);
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
      
      setAlumni(prevAlumni => 
        prevAlumni.map(a => 
          a.id === alumniId ? { ...a, ...response.data, revealed: true } : a
        )
      );
      
      toast.success('Contact revealed!');
    } catch (error) {
      console.error('Failed to reveal contact:', error);
      toast.error('Failed to reveal contact');
    }
  };

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      searchAlumni();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchName, searchCompany]);

  // Load all alumni on mount
  useEffect(() => {
    searchAlumni('', '');
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Compact Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Alumni Network</h1>
          <p className="text-sm text-gray-600">Connect with alumni at top companies</p>
        </div>

        {/* Premium Banner - Compact */}
        {!isPremium && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2 text-sm">
            <Lock className="h-4 w-4 text-yellow-600 flex-shrink-0" />
            <span className="text-yellow-800">
              <strong>Premium</strong> required to reveal contacts
            </span>
          </div>
        )}

        {/* Minimalist Search */}
        <div className="mb-6 bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Search className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Search Alumni</span>
            {loading && (
              <div className="ml-auto">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-gray-900"></div>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              placeholder="Search by name..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="text-sm"
            />
            <Input
              placeholder="Search by company..."
              value={searchCompany}
              onChange={(e) => setSearchCompany(e.target.value)}
              className="text-sm"
            />
          </div>
        </div>

        {/* Results - Compact Cards */}
        {alumni.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {alumni.map((person) => (
              <Card key={person.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 space-y-2.5">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-gray-900 text-sm leading-tight">
                      {person.name}
                    </h3>
                    {isPremium && <Crown className="h-3.5 w-3.5 text-yellow-500 flex-shrink-0 mt-0.5" />}
                  </div>
                  
                  {/* Role & Company */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-gray-700">
                      <Briefcase className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                      <span className="text-xs font-medium truncate">{person.role}</span>
                    </div>
                    
                    <div className="flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                      <span className="text-xs font-semibold text-blue-600 truncate">{person.company}</span>
                    </div>
                  </div>
                  
                  {/* Additional Info - Compact */}
                  {/* <div className="space-y-1 text-xs text-gray-600">
                    {person.location && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3 w-3 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{person.location}</span>
                      </div>
                    )}
                    
                    {person.years_of_experience && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3 w-3 text-gray-400 flex-shrink-0" />
                        <span>{person.years_of_experience}y exp</span>
                      </div>
                    )}
                    
                    {person.graduation_year && (
                      <div className="flex items-center gap-1.5">
                        <GraduationCap className="h-3 w-3 text-gray-400 flex-shrink-0" />
                        <span>'{person.graduation_year.toString().slice(-2)}</span>
                      </div>
                    )}
                  </div> */}
                  
                  {/* Contact Section - Compact */}
                  <div className="pt-2.5 border-t space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <Mail className="h-3 w-3 text-gray-400 flex-shrink-0" />
                      {person.revealed || person.email.includes('@') ? (
                        <span className="text-xs truncate">{person.email}</span>
                      ) : (
                        <span className="text-xs text-gray-400 blur-[3px] select-none">
                          email@example.com
                        </span>
                      )}
                    </div>
                    
                    {person.phone && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3 w-3 text-gray-400 flex-shrink-0" />
                        {person.revealed || !person.phone.includes('*') ? (
                          <span className="text-xs">{person.phone}</span>
                        ) : (
                          <span className="text-xs text-gray-400 blur-[3px] select-none">
                            123-456-7890
                          </span>
                        )}
                      </div>
                    )}
                    
                    {!person.revealed && (person.email.includes('*') || (person.phone && person.phone.includes('*'))) && (
                      <Button
                        className="w-full mt-2 h-7 text-xs"
                        size="sm"
                        onClick={() => revealContact(person.id)}
                        disabled={!isPremium}
                      >
                        {isPremium ? (
                          'Reveal Contact'
                        ) : (
                          <>
                            <Lock className="h-3 w-3 mr-1" />
                            Premium
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-gray-900"></div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-sm">No alumni found. Try different search terms.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlumniPage;